import { Router, type IRouter } from "express";
import { db, maintenanceTasksTable, carsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/cars/:carId/maintenance", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const raw = Array.isArray(req.params.carId) ? req.params.carId[0] : req.params.carId;
  const carId = parseInt(raw, 10);
  if (isNaN(carId)) {
    res.status(400).json({ error: "Invalid carId" });
    return;
  }
  try {
    const [car] = await db.select().from(carsTable).where(and(eq(carsTable.id, carId), eq(carsTable.userId, user.id)));
    if (!car) {
      res.status(404).json({ error: "Car not found" });
      return;
    }
    const tasks = await db.select().from(maintenanceTasksTable).where(eq(maintenanceTasksTable.carId, carId));
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "List maintenance tasks error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cars/:carId/health", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const raw = Array.isArray(req.params.carId) ? req.params.carId[0] : req.params.carId;
  const carId = parseInt(raw, 10);
  if (isNaN(carId)) {
    res.status(400).json({ error: "Invalid carId" });
    return;
  }
  try {
    const [car] = await db.select().from(carsTable).where(and(eq(carsTable.id, carId), eq(carsTable.userId, user.id)));
    if (!car) {
      res.status(404).json({ error: "Car not found" });
      return;
    }
    const tasks = await db.select().from(maintenanceTasksTable)
      .where(and(eq(maintenanceTasksTable.carId, carId), eq(maintenanceTasksTable.isCompleted, false)));

    const criticalCount = tasks.filter(t => t.urgency === "critical").length;
    const soonCount = tasks.filter(t => t.urgency === "soon").length;
    const routineCount = tasks.filter(t => t.urgency === "routine").length;

    let score = 100;
    score -= criticalCount * 25;
    score -= soonCount * 10;
    score -= routineCount * 3;
    score = Math.max(0, Math.min(100, score));

    let status: "excellent" | "good" | "fair" | "poor";
    if (score >= 85) status = "excellent";
    else if (score >= 65) status = "good";
    else if (score >= 40) status = "fair";
    else status = "poor";

    const nextServiceKm = tasks.filter(t => t.dueInKm != null).sort((a, b) => (a.dueInKm ?? 0) - (b.dueInKm ?? 0))[0]?.dueInKm ?? null;

    res.json({ carId, score, status, criticalCount, soonCount, routineCount, nextServiceKm });
  } catch (err) {
    req.log.error({ err }, "Car health error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
