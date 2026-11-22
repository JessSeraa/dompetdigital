import { Router } from "express";
import { getAdminOverview, updateUserStatus } from "../controllers/adminController.js";

const router = Router();
router.get("/overview", getAdminOverview);
router.patch("/users/:id/status", updateUserStatus);
export default router;
