export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { drizzle } = await import("drizzle-orm/node-postgres")
    const { migrate } = await import("drizzle-orm/node-postgres/migrator")
    const { DATABASE_URL } = await import("@/lib/db")
    const schema = await import("@/db/schema")

    const requiredEnvVars = ["BETTER_AUTH_SECRET"]

    const warnEnvVars: [string, string][] = []

    const missing = requiredEnvVars.filter((key) => !process.env[key])
    const warned = warnEnvVars.filter(([key]) => !process.env[key])

    if (missing.length > 0) {
      console.error("═══════════════════════════════════════════════════")
      console.error("  APP — MISSING REQUIRED ENVIRONMENT VARIABLES")
      console.error("═══════════════════════════════════════════════════")
      missing.forEach((key) => console.error(`  Missing: ${key}`))
      console.error("")
      console.error("  Please check your compose.yaml and restart.")
      console.error("═══════════════════════════════════════════════════")
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      )
    }

    if (warned.length > 0) {
      console.warn("═══════════════════════════════════════════════════")
      console.warn("  APP — WARNING")
      console.warn("═══════════════════════════════════════════════════")
      warned.forEach(
        ([key, defaultValue]) => (
          console.warn(`  ${key} is not set,`),
          console.warn(`  defaulting to ${defaultValue}`)
        )
      )
      console.warn("")
      console.warn("  App may not behave correctly if this variable")
      console.warn("  is not set.")
      console.warn("═══════════════════════════════════════════════════")
    }

    const db = drizzle(DATABASE_URL, { schema })

    await migrate(db, { migrationsFolder: "./db/migrations" })
    console.log("Migrations complete")
  }
}
