import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"
import { sqlConn } from "@/lib/db"
import * as schema from "@/db/schema"

const approvalRequired = process.env.APPROVE_SIGNUPS?.toLowerCase() === "true"
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
const extraTrustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

export const auth = betterAuth({
  database: drizzleAdapter(sqlConn, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },

  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const existingUsers = await sqlConn
            .select({ id: schema.users.id })
            .from(schema.users)
            .limit(1)
          const isFirstUser = existingUsers.length === 0
          const banned = !isFirstUser && approvalRequired

          return {
            data: {
              ...user,
              role: isFirstUser ? "admin" : "user",
              banned: banned,
              banReason: banned ? "Pending admin approval" : null,
            },
          }
        },
      },
      delete: {
        after: async (user) => {
          try {
            const { deleteUserFiles } = await import("@/lib/s3")
            await deleteUserFiles(user.id)
          } catch (error) {
            console.error(
              `Failed to delete files for removed user ${user.id}:`,
              error
            )
          }
        },
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "user",
      bannedUserMessage: approvalRequired
        ? "Your account has not been approved yet. Please contact the administrator."
        : "Your account has been banned. Please contact the administrator.",
    }),
  ],

  user: {
    fields: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      emailVerified: "emailVerified",
    },
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    useSecureCookies: baseURL.startsWith("https"),
  },

  trustedOrigins: [baseURL, ...extraTrustedOrigins],

  baseURL,
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
