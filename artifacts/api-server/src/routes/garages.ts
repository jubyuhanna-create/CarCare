import { Router, type IRouter } from "express";
import { db, garagesTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/garages/my", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    const [garage] = await db.select().from(garagesTable).where(eq(garagesTable.ownerId, user.id));
    if (!garage) {
      res.status(404).json({ error: "No garage found" });
      return;
    }
    res.json(garage);
  } catch (err) {
    req.log.error({ err }, "Get my garage error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/garages/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [garage] = await db.select().from(garagesTable).where(eq(garagesTable.id, id));
    if (!garage) {
      res.status(404).json({ error: "Garage not found" });
      return;
    }
    res.json(garage);
  } catch (err) {
    req.log.error({ err }, "Get garage error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/garages", async (req, res): Promise<void> => {
  try {
    const { city, specialization } = req.query as { city?: string; specialization?: string };
    let garages;
    if (city) {
      garages = await db.select().from(garagesTable).where(ilike(garagesTable.city, `%${city}%`));
    } else {
      garages = await db.select().from(garagesTable);
    }
    res.json(garages);
  } catch (err) {
    req.log.error({ err }, "List garages error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/garages", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { name, address, city, phone, description, specializations } = req.body;
  if (!name || !address || !city || !phone) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const [garage] = await db.insert(garagesTable).values({
      ownerId: user.id,
      name,
      address,
      city,
      phone,
      description: description || null,
      specializations: specializations || [],
      reviewCount: 0,
      isVerified: false,
    }).returning();
    res.status(201).json(garage);
  } catch (err) {
    req.log.error({ err }, "Create garage error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
