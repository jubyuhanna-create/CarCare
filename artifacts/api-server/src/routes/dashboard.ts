import { Router, type IRouter } from "express";
import { db, carsTable, maintenanceTasksTable, bookingsTable, serviceRecordsTable, garagesTable } from "@workspace/db";
import { eq, and, gt, gte } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    const cars = await db.select().from(carsTable).where(eq(carsTable.userId, user.id));
    const carIds = cars.map(c => c.id);

    let pendingMaintenance = 0;
    let upcomingBookings = 0;
    let recentServices = 0;
    let upcomingBookingsList: unknown[] = [];

    if (carIds.length > 0) {
      const now = new Date();
      const allMaintenance = await db.select().from(maintenanceTasksTable);
      pendingMaintenance = allMaintenance.filter(m => carIds.includes(m.carId) && !m.isCompleted).length;

      const allBookings = await db.select().from(bookingsTable);
      const userUpcoming = allBookings.filter(b =>
        b.userId === user.id &&
        (b.status === "pending" || b.status === "confirmed") &&
        new Date(b.scheduledDate) >= now
      );
      upcomingBookings = userUpcoming.length;

      const enrichedBookings = await Promise.all(userUpcoming.slice(0, 5).map(async (b) => {
        const [garage] = await db.select().from(garagesTable).where(eq(garagesTable.id, b.garageId));
        const [car] = await db.select().from(carsTable).where(eq(carsTable.id, b.carId));
        return {
          ...b,
          garageName: garage?.name || null,
          carInfo: car ? `${car.make} ${car.model} ${car.year}` : null,
        };
      }));
      upcomingBookingsList = enrichedBookings;

      const allRecords = await db.select().from(serviceRecordsTable);
      recentServices = allRecords.filter(r => carIds.includes(r.carId)).length;
    }

    res.json({
      totalCars: cars.length,
      pendingMaintenance,
      upcomingBookings,
      recentServices,
      cars,
      upcomingBookingsList,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard summary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/garage-summary", requireAuth, async (req, res): Promise<void> => {
  const user = (req as AuthRequest).user;
  try {
    const [garage] = await db.select().from(garagesTable).where(eq(garagesTable.ownerId, user.id));
    if (!garage) {
      res.json({
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0,
        todayBookings: 0,
        recentBookings: [],
      });
      return;
    }

    const allBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.garageId, garage.id));
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const enriched = await Promise.all(allBookings.slice(0, 10).map(async (b) => {
      const [car] = await db.select().from(carsTable).where(eq(carsTable.id, b.carId));
      return {
        ...b,
        garageName: garage.name,
        carInfo: car ? `${car.make} ${car.model} ${car.year} (${car.licensePlate})` : null,
      };
    }));

    res.json({
      totalBookings: allBookings.length,
      pendingBookings: allBookings.filter(b => b.status === "pending").length,
      confirmedBookings: allBookings.filter(b => b.status === "confirmed").length,
      completedBookings: allBookings.filter(b => b.status === "completed").length,
      todayBookings: allBookings.filter(b => {
        const d = new Date(b.scheduledDate);
        return d >= todayStart && d < todayEnd;
      }).length,
      recentBookings: enriched,
    });
  } catch (err) {
    req.log.error({ err }, "Garage dashboard summary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
