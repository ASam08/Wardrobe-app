# Local Development Setup

This document covers everything needed to get the app running locally on a **fresh Windows machine**, assuming the repo has already been cloned.

## Prerequisites

- **Node.js**: 20 LTS or newer
- **pnpm**: enable via Node's built-in Corepack rather than a separate install:
  ```bash
  corepack enable
  ```
- **WSL2**: used to run Garage, since it has no native Windows binary
- **Postgres 17**: installed natively on Windows

---

## 1. Postgres

1. Download and run the Postgres 17 installer from [postgresql.org](https://www.postgresql.org/download/windows/), or via Chocolatey:
   ```powershell
   choco install postgresql17
   ```
2. During setup, create a database and a user for the app, e.g.:
   - Database: `myapp`
   - User: `myapp`
3. Confirm it's running and reachable:
   ```bash
   psql -U myapp -d myapp -h localhost
   ```

---

## 2. Garage (object storage)

### 2.1 Enable WSL2 and systemd

If WSL2 isn't already set up (admin PowerShell):

```powershell
wsl --install
```

Enable systemd inside your WSL2 distro (needed so Garage can run as a background service):

```bash
echo -e "[boot]\nsystemd=true" | sudo tee /etc/wsl.conf
```

Then, from Windows PowerShell:

```powershell
wsl --shutdown
```

Reopen your WSL2 terminal before continuing.

### 2.2 Install the Garage binary

Inside WSL2:

```bash
wget https://garagehq.deuxfleurs.fr/_releases/v2.4.1/x86_64-unknown-linux-musl/garage -O garage
chmod +x garage
sudo mv garage /usr/local/bin/
```

### 2.3 Create the config file

```bash
mkdir -p ~/garage/{meta,data}
cat > ~/garage/garage.toml <<EOF
metadata_dir = "/home/$(whoami)/garage/meta"
data_dir = "/home/$(whoami)/garage/data"
db_engine = "sqlite"
replication_factor = 1

rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"
rpc_secret = "$(openssl rand -hex 32)"

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
root_domain = ".s3.garage.localhost"

[admin]
api_bind_addr = "[::]:3903"
admin_token = "$(openssl rand -base64 32)"
EOF
```

This file lives outside the repo (`~/garage/garage.toml`) and is never committed, it contains generated secrets specific to this machine.

### 2.4 Run Garage as a background service

Create the systemd unit:

```bash
sudo tee /etc/systemd/system/garage.service > /dev/null <<EOF
[Unit]
Description=Garage S3-compatible object storage
After=network.target

[Service]
ExecStart=/usr/local/bin/garage -c /home/$(whoami)/garage/garage.toml server
Restart=on-failure
Environment=RUST_LOG=garage=info

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now garage
```

Confirm it's running:

```bash
garage status
```

Once enabled, Garage starts automatically every time WSL2 boots, no manual `garage server` command required going forward. WSL2 itself wakes on first use (opening a terminal, or a WSL-connected editor window). If you want it running the moment you log into Windows, add a Task Scheduler entry that runs `wsl.exe -d Ubuntu -e true` at log-on.

### 2.5 One-time bootstrap: create the bucket and access key

The service above just runs `garage server`, it doesn't auto-create anything, so this is a **one-time manual step** the first time you set up on a given machine:

```bash
# Note the node ID from the first column of the output
garage status

# Assign and apply a single-node layout (zone name and capacity are arbitrary for one node)
garage layout assign -z dc1 -c 1G <node_id>
garage layout apply --version 1

# Create the bucket
garage bucket create user-images

# Create an access key — the secret key is shown ONLY ONCE, copy it immediately
garage key create user-images-app-key

# Link the key to the bucket
garage bucket allow --read --write --owner user-images --key user-images-app-key
```

Copy the **Key ID** and **Secret key** printed by `garage key create` into `.env.local` in the next step.

---

## 3. Environment variables

Copy the template:

```bash
cp .example.env .env.local
```

Fill in `.env.local`:

```bash
# Postgres
DATABASE_URL="postgresql://wardrobe-app:<your_password>@localhost:5432/wardrobe-app"

# Garage / S3
S3_ENDPOINT="http://localhost:3900"
S3_ACCESS_KEY="<Key ID from garage key create>"
S3_SECRET_KEY="<Secret key from garage key create>"
S3_BUCKET_NAME="user-images"
S3_REGION="garage"

# better-auth
BETTER_AUTH_SECRET="<generate with: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
```

**Important:** `S3_REGION` must exactly match the `s3_region` value in `garage.toml` (`"garage"`), a mismatch causes S3 request-signing to fail with a confusing error.

---

## 4. Install dependencies and run

```bash
pnpm install
pnpm dev
```

The app should now be running at `http://localhost:3000`, connected to your local Postgres instance and Garage bucket.

---

## Troubleshooting

**`Unable to connect to destination RPC host` / `Connection refused (os error 111)`**
Garage isn't running. If you're using the systemd service from step 2.4, check its status:

```bash
sudo systemctl status garage
sudo systemctl restart garage
```

If you're running it manually instead of via systemd, remember `garage server` runs in the foreground — closing that terminal kills it. Use the systemd service to avoid this.

**Lost the access key / secret key**
Garage doesn't store or re-display secret keys after creation. If you've lost one, just create a new one for the existing bucket, nothing is broken:

```bash
garage key create <new-key-name>
garage bucket allow --read --write --owner user-images --key <new-key-name>
```

Then clean up the old, unused key later with `garage key list` / `garage key delete <old-key-id>`.

**S3 requests failing with a signature error**
Check that `S3_REGION` in `.env.local` matches `s3_region` in `garage.toml` exactly.
