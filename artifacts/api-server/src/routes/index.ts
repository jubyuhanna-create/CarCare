import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import carsRouter from "./cars";
import maintenanceRouter from "./maintenance";
import garagesRouter from "./garages";
import bookingsRouter from "./bookings";
import serviceRecordsRouter from "./serviceRecords";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(carsRouter);
router.use(maintenanceRouter);
router.use(garagesRouter);
router.use(bookingsRouter);
router.use(serviceRecordsRouter);
router.use(dashboardRouter);

export default router;
