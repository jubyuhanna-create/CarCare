import { Router, type IRouter } from "express";
import { db, bookingsTable, garagesTable, carsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/bookings", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { role } = req.query as { role?: string };
  try {
    let bookings;
    if (role === "garage" && user.role === "garage_owner") {
      const [myGarage] = await db.select().from(garagesTable).where(eq(garagesTable.ownerId, user.id));
      if (!myGarage) {
        res.json([]);
        return;
      }
      const rawBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.garageId, myGarage.id));
      const enriched = await Promise.all(rawBookings.map(async (b) => {
        const [car] = await db.select().from(carsTable).where(eq(carsTable.id, b.carId));
        return {
          ...b,
          garageName: myGarage.name,
          carInfo: car ? `${car.make} ${car.model} ${car.year} (${car.licensePlate})` : null,
        };
      }));
      res.json(enriched);
    } else {
      const rawBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, user.id));
      const enriched = await Promise.all(rawBookings.map(async (b) => {
        const [garage] = await db.select().from(garagesTable).where(eq(garagesTable.id, b.garageId));
        const [car] = await db.select().from(carsTable).where(eq(carsTable.id, b.carId));
        return {
          ...b,
          garageName: garage?.name || null,
          carInfo: car ? `${car.make} ${car.model} ${car.year}` : null,
        };
      }));
      res.json(enriched);
    }
  } catch (err) {
    req.log.error({ err }, "List bookings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bookings", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { garageId, carId, scheduledDate, notes, maintenanceTaskId } = req.body;
  if (!garageId || !carId || !scheduledDate) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const [booking] = await db.insert(bookingsTable).values({
      userId: user.id,
      garageId: parseInt(garageId),
      carId: parseInt(carId),
      scheduledDate: new Date(scheduledDate),
      status: "pending",
      notes: notes || null,
      maintenanceTaskId: maintenanceTaskId ? parseInt(maintenanceTaskId) : null,
    }).returning();
    const [garage] = await db.select().from(garagesTable).where(eq(garagesTable.id, booking.garageId));
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    res.status(201).json({
      ...booking,
      garageName: garage?.name || null,
      carInfo: car ? `${car.make} ${car.model} ${car.year}` : null,
    });
  } catch (err) {
    req.log.error({ err }, "Create booking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    if (booking.userId !== user.id && user.role !== "garage_owner" && user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [garage] = await db.select().from(garagesTable).where(eq(garagesTable.id, booking.garageId));
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    res.json({
      ...booking,
      garageName: garage?.name || null,
      carInfo: car ? `${car.make} ${car.model} ${car.year} (${car.licensePlate})` : null,
    });
  } catch (err) {
    req.log.error({ err }, "Get booking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { status, notes } = req.body;
  try {
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const [booking] = await db.update(bookingsTable).set(updateData).where(eq(bookingsTable.id, id)).returning();
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    const [garage] = await db.select().from(garagesTable).where(eq(garagesTable.id, booking.garageId));
    const [car] = await db.select().from(carsTable).where(eq(carsTable.id, booking.carId));
    res.json({
      ...booking,
      garageName: garage?.name || null,
      carInfo: car ? `${car.make} ${car.model} ${car.year} (${car.licensePlate})` : null,
    });
  } catch (err) {
    req.log.error({ err }, "Update booking error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
