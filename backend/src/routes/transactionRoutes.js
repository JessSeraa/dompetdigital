import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  exportTransactions,
  listTransactions,
  updateTransaction
} from "../controllers/transactionController.js";

const router = Router();
router.get("/export", exportTransactions);
router.get("/", listTransactions);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
export default router;
