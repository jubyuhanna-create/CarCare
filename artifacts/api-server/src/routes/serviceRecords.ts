import { Router, type IRouter } from "express";
import { db, serviceRecordsTable, garagesTable, carsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/service-records", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { carId } = req.query as { carId?: string };
  try {
    let records;
    if (carId) {
      const carIdNum = parseInt(carId, 10);
      const [car] = await db.select().from(carsTable).where(and(eq(carsTable.id, carIdNum), eq(carsTable.userId, user.id)));
      if (!car) {
        res.status(404).json({ error: "Car not found" });
        return;
      }
      records = await db.select().from(serviceRecordsTable).where(eq(serviceRecordsTable.carId, carIdNum));
    } else {
      const userCars = await db.select().from(carsTable).where(eq(carsTable.userId, user.id));
      const carIds = userCars.map(c => c.id);
      if (carIds.length === 0) {
        res.json([]);
        return;
      }
      records = await db.select().from(serviceRecordsTable);
      records = records.filter(r => carIds.includes(r.carId));
    }
    const enriched = await Promise.all(records.map(async (r) => {
      const garageName = r.garageId
        ? (await db.select().from(garagesTable).where(eq(garagesTable.id, r.garageId)))[0]?.name || null
        : null;
      return { ...r, garageName };
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List service records error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/service-records", requireAuth, async (req, res): Promise<void> => {
  const { carId, garageId, bookingId, title, description, cost, mileageAtService, serviceDate } = req.body;
  if (!carId || !title || !serviceDate) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const [record] = await db.insert(serviceRecordsTable).values({
      carId: parseInt(carId),
      garageId: garageId ? parseInt(garageId) : null,
      bookingId: bookingId ? parseInt(bookingId) : null,
      title,
      description: description || null,
      cost: cost ? parseFloat(cost) : null,
      mileageAtService: mileageAtService ? parseInt(mileageAtService) : null,
      serviceDate: new Date(serviceDate),
    }).returning();
    const garageName = record.garageId
      ? (await db.select().from(garagesTable).where(eq(garagesTable.id, record.garageId)))[0]?.name || null
      : null;
    res.status(201).json({ ...record, garageName });
  } catch (err) {
    req.log.error({ err }, "Create service record error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/service-records/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [record] = await db.select().from(serviceRecordsTable).where(eq(serviceRecordsTable.id, id));
    if (!record) {
      res.status(404).json({ error: "Service record not found" });
      return;
    }
    const garageName = record.garageId
      ? (await db.select().from(garagesTable).where(eq(garagesTable.id, record.garageId)))[0]?.name || null
      : null;
    res.json({ ...record, garageName });
  } catch (err) {
    req.log.error({ err }, "Get service record error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/service-records/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [record] = await db.update(serviceRecordsTable).set(req.body).where(eq(serviceRecordsTable.id, id)).returning();
    if (!record) {
      res.status(404).json({ error: "Service record not found" });
      return;
    }
    const garageName = record.garageId
      ? (await db.select().from(garagesTable).where(eq(garagesTable.id, record.garageId)))[0]?.name || null
      : null;
    res.json({ ...record, garageName });
  } catch (err) {
    req.log.error({ err }, "Update service record error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/service-records/:id/upload-receipt", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { receiptUrl } = req.body;
  if (!receiptUrl) {
    res.status(400).json({ error: "receiptUrl required" });
    return;
  }
  try {
    const [record] = await db.update(serviceRecordsTable).set({ receiptUrl }).where(eq(serviceRecordsTable.id, id)).returning();
    if (!record) {
      res.status(404).json({ error: "Service record not found" });
      return;
    }
    res.json({ ...record, garageName: null });
  } catch (err) {
    req.log.error({ err }, "Upload receipt error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
