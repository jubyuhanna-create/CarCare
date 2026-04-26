import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const garagesTable = pgTable("garages", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  description: text("description"),
  specializations: text("specializations").array().notNull().default([]),
  rating: real("rating"),
  reviewCount: integer("review_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGarageSchema = createInsertSchema(garagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGarage = z.infer<typeof insertGarageSchema>;
export type Garage = typeof garagesTable.$inferSelect;
