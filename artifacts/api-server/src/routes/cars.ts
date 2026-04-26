import { Router, type IRouter } from "express";
import { db, carsTable, maintenanceTasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth";

const router: IRouter = Router();

const MOCK_CAR_DB: Record<string, { make: string; model: string; year: number; color?: string; engineType?: string }> = {
  "1234567": { make: "טויוטה", model: "קורולה", year: 2019, color: "לבן", engineType: "בנזין" },
  "7654321": { make: "מזדה", model: "3", year: 2021, color: "כחול", engineType: "בנזין" },
  "1111111": { make: "הונדה", model: "סיוויק", year: 2020, color: "אפור", engineType: "היברידי" },
  "2222222": { make: "קיה", model: "ספורטאג", year: 2022, color: "לבן", engineType: "בנזין" },
  "3333333": { make: "יונדאי", model: "טוסון", year: 2021, color: "שחור", engineType: "דיזל" },
  "9999999": { make: "סקודה", model: "אוקטביה", year: 2023, color: "כסוף", engineType: "בנזין" },
};

router.get("/cars/lookup/:plate", async (req, res): Promise<void> => {
  const plate = Array.isArray(req.params.plate) ? req.params.plate[0] : req.params.plate;
  const normalized = plate.replace(/[^0-9]/g, "");
  const mockData = MOCK_CAR_DB[normalized] || MOCK_CAR_DB[plate];
  if (mockData) {
    res.json({ licensePlate: plate, ...mockData });
    return;
  }
  const year = 2015 + (parseInt(normalized.slice(-1)) || 0);
  const makes = ["טויוטה", "מזדה", "הונדה", "קיה", "יונדאי", "ניסן", "שברולה"];
  const models = ["קורולה", "3", "סיוויק", "ספורטאג", "טוסון", "ג'וק", "קרוז"];
  const idx = (parseInt(normalized[0]) || 0) % makes.length;
  res.json({
    licensePlate: plate,
    make: makes[idx],
    model: models[idx],
    year,
    color: "לבן",
    engineType: "בנזין",
  });
});

router.get("/cars", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    const cars = await db.select().from(carsTable).where(eq(carsTable.userId, user.id));
    res.json(cars);
  } catch (err) {
    req.log.error({ err }, "List cars error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cars", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const { licensePlate, make, model, year, color, engineType, currentMileage, yearlyMileage } = req.body;
  if (!licensePlate || !make || !model || !year) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  try {
    const [car] = await db.insert(carsTable).values({
      userId: user.id,
      licensePlate,
      make,
      model,
      year: parseInt(year),
      color: color || null,
      engineType: engineType || null,
      currentMileage: currentMileage ? parseInt(currentMileage) : null,
      yearlyMileage: yearlyMileage ? parseInt(yearlyMileage) : null,
      healthScore: 85,
    }).returning();

    await generateMaintenanceTasks(car.id, car.yearlyMileage, car.year);

    res.status(201).json(car);
  } catch (err) {
    req.log.error({ err }, "Create car error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cars/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [car] = await db.select().from(carsTable).where(and(eq(carsTable.id, id), eq(carsTable.userId, user.id)));
    if (!car) {
      res.status(404).json({ error: "Car not found" });
      return;
    }
    res.json(car);
  } catch (err) {
    req.log.error({ err }, "Get car error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/cars/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [car] = await db.update(carsTable)
      .set(req.body)
      .where(and(eq(carsTable.id, id), eq(carsTable.userId, user.id)))
      .returning();
    if (!car) {
      res.status(404).json({ error: "Car not found" });
      return;
    }
    res.json(car);
  } catch (err) {
    req.log.error({ err }, "Update car error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cars/:id", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    await db.delete(carsTable).where(and(eq(carsTable.id, id), eq(carsTable.userId, user.id)));
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, "Delete car error");
    res.status(500).json({ error: "Internal server error" });
  }
});

async function generateMaintenanceTasks(carId: number, yearlyMileage: number | null | undefined, year: number): Promise<void> {
  const currentYear = new Date().getFullYear();
  const carAge = currentYear - year;
  const km = yearlyMileage || 15000;

  const tasks = [
    {
      carId,
      title: "החלפת שמן מנוע",
      description: "החלפת שמן ופילטר שמן. ניתן לבצע בבית עם הציוד הנכון.",
      urgency: km > 15000 ? "critical" as const : "soon" as const,
      dueInKm: 5000,
      isDiy: true,
      isCompleted: false,
    },
    {
      carId,
      title: "בדיקת בלמים",
      description: "בדיקת רפידות ודיסקות בלמים. מומלץ לבצע במוסך.",
      urgency: carAge > 3 ? "soon" as const : "routine" as const,
      dueInKm: 20000,
      isDiy: false,
      isCompleted: false,
    },
    {
      carId,
      title: "החלפת צמיגים",
      description: "בדיקת לחץ ובלאי. החלפה נדרשת כל 5-6 שנים.",
      urgency: "routine" as const,
      dueInKm: 40000,
      isDiy: false,
      isCompleted: false,
    },
    {
      carId,
      title: "פילטר אוויר",
      description: "החלפת פילטר אוויר. ניתן לבצע בקלות בבית.",
      urgency: "routine" as const,
      dueInKm: 15000,
      isDiy: true,
      isCompleted: false,
    },
  ];

  if (carAge >= 3) {
    tasks.push({
      carId,
      title: "בדיקת מצבר",
      description: "בדיקת מצבר ומערכת חשמל. חיי המצבר הממוצעים הם 4-5 שנים.",
      urgency: carAge >= 4 ? "soon" as const : "routine" as const,
      dueInKm: null as unknown as number,
      isDiy: false,
      isCompleted: false,
    });
  }

  await db.insert(maintenanceTasksTable).values(tasks);
}

export default router;
