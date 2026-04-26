import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const carsTable = pgTable("cars", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  licensePlate: text("license_plate").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color"),
  engineType: text("engine_type"),
  currentMileage: integer("current_mileage"),
  yearlyMileage: integer("yearly_mileage"),
  healthScore: integer("health_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCarSchema = createInsertSchema(carsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof carsTable.$inferSelect;
