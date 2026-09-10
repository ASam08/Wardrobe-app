import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { DATABASE_URL } from "@/lib/db"

const db = drizzle(DATABASE_URL)

await migrate(db, { migrationsFolder: "./db/migrations" })
