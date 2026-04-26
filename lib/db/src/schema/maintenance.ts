import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { carsTable } from "./cars";

export const urgencyEnum = pgEnum("maintenance_urgency", ["critical", "soon", "routine"]);

export const maintenanceTasksTable = pgTable("maintenance_tasks", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull().references(() => carsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  urgency: urgencyEnum("urgency").notNull().default("routine"),
  dueInKm: integer("due_in_km"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  isDiy: boolean("is_diy").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasksTable).omit({ id: true, createdAt: true });
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceTask = typeof maintenanceTasksTable.$inferSelect;
