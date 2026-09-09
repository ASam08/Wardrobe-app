import { drizzle } from "drizzle-orm/node-postgres"

const POSTGRES_HOST = process.env.POSTGRES_HOST ?? "db"
const POSTGRES_PORT = process.env.POSTGRES_PORT ?? "5432"
const POSTGRES_USER = process.env.POSTGRES_USER ?? "wardrobe_user"
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "wardrobe"
const POSTGRES_DB = process.env.POSTGRES_DB ?? "wardrobedb"

if (!POSTGRES_USER || !POSTGRES_PASSWORD) {
  throw new Error(
    "Missing database configuration. Set POSTGRES_USER/POSTGRES_PASSWORD."
  )
}

export const DATABASE_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`

export const sqlConn = drizzle(DATABASE_URL)
