import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { carsTable } from "./cars";
import { garagesTable } from "./garages";
import { bookingsTable } from "./bookings";

export const serviceRecordsTable = pgTable("service_records", {
  id: serial("id").primaryKey(),
  carId: integer("car_id").notNull().references(() => carsTable.id, { onDelete: "cascade" }),
  garageId: integer("garage_id").references(() => garagesTable.id),
  bookingId: integer("booking_id").references(() => bookingsTable.id),
  title: text("title").notNull(),
  description: text("description"),
  cost: real("cost"),
  mileageAtService: integer("mileage_at_service"),
  receiptUrl: text("receipt_url"),
  serviceDate: timestamp("service_date", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServiceRecordSchema = createInsertSchema(serviceRecordsTable).omit({ id: true, createdAt: true });
export type InsertServiceRecord = z.infer<typeof insertServiceRecordSchema>;
export type ServiceRecord = typeof serviceRecordsTable.$inferSelect;
