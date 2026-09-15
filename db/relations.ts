import { relations } from "drizzle-orm"
import { users, session, account } from "@/db/schema"

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}))
