# Setup

Wardrobe is a Next.js app backed by Postgres (data) and Garage (S3-compatible storage for item photos). Photos are uploaded to and loaded from Garage **directly by the browser** through short-lived presigned URLs, so Garage must be reachable from every device that uses the app, not just from the server.

- [Run with Docker](#run-with-docker)
- [HTTPS and reverse proxy](#https-and-reverse-proxy)
- [Local development](#local-development)
- [Testing from a phone against the dev server](#testing-from-a-phone-against-the-dev-server)
- [Environment variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Run with Docker

You need Docker with Compose v2.23.1 or later (`docker compose version`). The stack is the app, Postgres and Garage. Garage configures itself on first start.

1. Download `compose.yaml` and `.env.docker.example` into an empty directory.
2. Copy `.env.docker.example` to `.env` and fill in every blank value. The comment above each one gives the command to generate it.
3. Set `BETTER_AUTH_URL`, `S3_PUBLIC_ENDPOINT` and `S3_CORS_ORIGINS` to the addresses your browser will use (see [HTTPS and reverse proxy](#https-and-reverse-proxy)).
4. Start it:

   ```bash
   docker compose pull && docker compose up -d
   docker compose logs -f app
   ```

   Database migrations and the bucket's CORS rules are applied automatically at startup.
5. Open the app and create an account. **The first account becomes the admin.** Set `APPROVE_SIGNUPS=true` to hold later sign-ups until an admin approves them.

### Updating

```bash
docker compose pull && docker compose up -d
```

### Image tags

Images are published to `ghcr.io/asam08/wardrobe-app`. Publishing a GitHub release pushes `X.Y.Z`, `X.Y` and `latest`. Maintainers can also run the "Publish Docker Image" workflow manually to push a custom tag such as `dev`. Choose the tag with `APP_TAG` in `.env`. If the package is private, log in first with a token that has `read:packages`: `docker login ghcr.io -u <github-username>`.

### Ports

| Port | Service | Notes |
|---|---|---|
| 3000 | App | Put the reverse proxy in front of this |
| 3900 | Garage S3 API | Also needs its own HTTPS hostname, because browsers talk to it directly |

Garage's RPC (3901) and admin (3903) ports are never published. `BIND_ADDRESS` controls which host address the two published ports bind to (default `0.0.0.0`). Set it to `127.0.0.1` when a reverse proxy on the same host is in front. If the proxy runs in a container, join `app` and `garage` to the proxy's Docker network with a `compose.override.yaml` instead.

### Data and backups

State lives in three Docker volumes: `db-data` (Postgres), and `garage-meta` and `garage-data` (photos). Back up all three; use `pg_dump` for the database rather than copying its volume while it is running.

On a fresh install the log line `[sweep] Image sweep skipped: no images found in the database` is expected until the first photo is uploaded.

## HTTPS and reverse proxy

Put the app and Garage behind a reverse proxy on two hostnames, for example `wardrobe.example.com` (to `app:3000`) and `wardrobe-s3.example.com` (to `garage:3900`). Both must use HTTPS: browsers block an HTTPS page from uploading to an HTTP address (mixed content).

Then in `.env`:

```dotenv
BETTER_AUTH_URL=https://wardrobe.example.com
S3_PUBLIC_ENDPOINT=https://wardrobe-s3.example.com
S3_CORS_ORIGINS=https://wardrobe.example.com
```

`S3_CORS_ORIGINS` must match the browser's origin exactly, including `https://` and with no trailing slash.

Proxy requirements:

- **Pass the original `Host` header to Garage unchanged.** Presigned URLs are signed for the public hostname, so a rewritten Host header causes `SignatureDoesNotMatch` errors. Caddy and Traefik do this by default. Nginx needs `proxy_set_header Host $host;`.
- **Allow request bodies of at least 25 MB** on the Garage hostname. Nginx defaults to 1 MB: set `client_max_body_size 25m;`.
- **Use a certificate every device trusts**, phones included. A wildcard certificate covers both hostnames.
- Both hostnames must resolve from the devices that use the app.

## Local development

You need Node 24, pnpm (the version pinned in `package.json`, installed through Corepack), a Postgres database, and Garage 2.3.0 or later.

1. Install dependencies:

   ```bash
   corepack enable
   pnpm install
   ```

2. Create the database. Any Postgres works; set `POSTGRES_HOST` and `POSTGRES_PORT` in the next step to match. The user and database names below match `.env.example`.

3. Start Garage. It reads `/etc/garage.toml` unless you start it with `-c <path>`. A minimal single-node config:

   ```toml
   metadata_dir = "/path/to/garage/meta"
   data_dir = "/path/to/garage/data"
   db_engine = "sqlite"
   replication_factor = 1

   rpc_bind_addr = "[::]:3901"
   rpc_public_addr = "127.0.0.1:3901"
   rpc_secret = "<openssl rand -hex 32>"

   [s3_api]
   s3_region = "garage"
   api_bind_addr = "[::]:3900"
   root_domain = ".s3.garage.localhost"

   [admin]
   api_bind_addr = "[::]:3903"
   admin_token = "<openssl rand -base64 32>"
   ```

   Run `garage server`, then do the one-time setup (use the node id prefix from `garage status`):

   ```bash
   garage status
   garage layout assign -z dc1 -c 1G <node-id-prefix>
   garage layout apply --version 1
   garage bucket create user-images
   garage key create wardrobe-app
   garage bucket allow --read --write --owner user-images --key wardrobe-app
   ```

   `garage key create` prints the key ID and secret; you need them for the next step. (Alternatively, on Garage 2.3.0+, start it with `garage server --single-node --default-bucket` and set `GARAGE_DEFAULT_ACCESS_KEY`, `GARAGE_DEFAULT_SECRET_KEY` and `GARAGE_DEFAULT_BUCKET` instead of running the commands above.)

4. Configure the app:

   ```bash
   cp .env.example .env.local
   ```

   Fill in the Postgres and Garage values. Use `127.0.0.1`, not `localhost`, for the S3 endpoints: `localhost` can resolve to IPv6 and miss Garage, notably under WSL2.

5. Run it:

   ```bash
   pnpm dev
   ```

   Migrations and the bucket's CORS rules are applied at startup. The first account you create becomes the admin.

Useful commands:

| Command | What it does |
|---|---|
| `pnpm typecheck` / `pnpm lint` / `pnpm build` | Checks to run before committing |
| `pnpm exec drizzle-kit generate` | Create a migration after changing `db/schema.ts` (migrations are generated by hand, applied automatically at startup) |
| `pnpm s3:cors` | Re-apply the bucket CORS rules manually |
| `pnpm s3:sweep` / `pnpm s3:sweep --dry-run` | Run the orphaned-photo cleanup now / only log what it would delete |

## Testing from a phone against the dev server

To use the dev server from another device on your network:

1. Use the computer's LAN address (give it a fixed IP or DHCP reservation) in `.env.local`:

   ```dotenv
   S3_PUBLIC_ENDPOINT="http://192.168.1.50:3900"
   S3_CORS_ORIGINS="http://localhost:3000,http://192.168.1.50:3000"
   BETTER_AUTH_TRUSTED_ORIGINS="http://192.168.1.50:3000"
   ALLOWED_DEV_ORIGINS="192.168.1.50"
   ```

2. Make ports 3000 and 3900 reachable on that address. With Windows and WSL2 this means port forwarding to the WSL address and a firewall rule for both ports.
3. Restart `pnpm dev`, then open `http://192.168.1.50:3000` on the phone.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | yes | host `db` | Database connection. Compose sets the host and port itself. |
| `S3_ENDPOINT` | yes | | How the server reaches Garage (Docker: `http://garage:3900`, set by compose) |
| `S3_PUBLIC_ENDPOINT` | Docker: yes | `S3_ENDPOINT` | Address the browser uses to reach Garage; embedded in presigned URLs |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | yes | | Garage access key |
| `S3_BUCKET_NAME` | yes | | Bucket for photos (`user-images`) |
| `S3_REGION` | local: yes | `garage` in Docker | Must match `s3_region` in the Garage config |
| `S3_CORS_ORIGINS` | Docker: yes | `http://localhost:3000` | Origins allowed to upload to the bucket (comma-separated) |
| `BETTER_AUTH_SECRET` | yes | | Session signing secret |
| `BETTER_AUTH_URL` | Docker: yes | `http://localhost:3000` | Public URL of the app. `https://` turns on secure cookies. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | no | | Extra origins allowed to sign in (comma-separated) |
| `APPROVE_SIGNUPS` | no | `false` | `true` holds new accounts until an admin approves them |
| `ORPHAN_SWEEP_INTERVAL_HOURS` | no | `24` | How often unreferenced photo files are cleaned up (`0` disables it) |
| `ORPHAN_SWEEP_GRACE_MINUTES` | no | `60` | Files younger than this are never deleted |
| `ORPHAN_SWEEP_TIMEOUT_MINUTES` | no | `60` | Maximum duration of one cleanup run |
| `ORPHAN_SWEEP_DRY_RUN` | no | `false` | `true` only logs what would be deleted |
| `ALLOWED_DEV_ORIGINS` | dev only | | Hostnames allowed to reach `next dev` from other devices |
| `GARAGE_RPC_SECRET`, `GARAGE_ADMIN_TOKEN` | Docker only | | Garage's internal secrets (see `.env.docker.example`) |
| `APP_TAG` | Docker only | `latest` | Which app image tag to run |
| `BIND_ADDRESS` | Docker only | `0.0.0.0` | Host address the published ports bind to |

Don't leave optional numeric settings blank in `.env` (an empty value can be read as `0`): remove the line instead.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `manifest unknown` when pulling | That tag hasn't been published. `latest` only exists after a GitHub release; set `APP_TAG` to a tag that exists (e.g. `dev`). |
| `denied` / `unauthorized` when pulling | The image package is private. Run `docker login ghcr.io` with a token that has `read:packages`. |
| Garage container unhealthy | Run `docker compose logs garage`. Usually a malformed secret in `.env`. |
| Uploads fail with a CORS error | `S3_CORS_ORIGINS` must equal the browser's origin exactly. Check the app log for `[s3] bucket CORS applied`. |
| Uploads fail with `SignatureDoesNotMatch` | The proxy is changing the `Host` header, or `S3_PUBLIC_ENDPOINT` isn't the address the browser actually uses. |
| Uploads fail with HTTP 413 | The proxy's request-body limit is too small (see [HTTPS and reverse proxy](#https-and-reverse-proxy)). |
| Photos don't load on another device | `S3_PUBLIC_ENDPOINT` points at `127.0.0.1` or an internal name. It must be an address that device can reach. |
| "Invalid origin" when signing in | Add the address to `BETTER_AUTH_TRUSTED_ORIGINS`, or correct `BETTER_AUTH_URL`. |
| Build error `useSearchParams() should be wrapped in a suspense boundary` | A page uses `useSearchParams` in a client component without `<Suspense>`; wrap it or read the param on the server. |