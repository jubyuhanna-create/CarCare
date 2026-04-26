import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { garagesTable } from "./garages";
import { carsTable } from "./cars";
import { maintenanceTasksTable } from "./maintenance";

export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "rejected", "completed", "cancelled"]);

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  garageId: integer("garage_id").notNull().references(() => garagesTable.id, { onDelete: "cascade" }),
  carId: integer("car_id").notNull().references(() => carsTable.id, { onDelete: "cascade" }),
  maintenanceTaskId: integer("maintenance_task_id").references(() => maintenanceTasksTable.id),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
