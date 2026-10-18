import { relations } from "drizzle-orm"
import {
  users,
  session,
  account,
  items,
  categories,
  itemImages,
} from "@/db/schema"

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  items: many(items),
  categories: many(categories),
  itemImages: many(itemImages),
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

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  owner: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  items: many(items),
}))

export const itemsRelations = relations(items, ({ one, many }) => ({
  owner: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  images: many(itemImages),
}))

export const itemImagesRelations = relations(itemImages, ({ one }) => ({
  item: one(items, { fields: [itemImages.itemId], references: [items.id] }),
  owner: one(users, { fields: [itemImages.userId], references: [users.id] }),
}))
