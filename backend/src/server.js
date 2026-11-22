import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./db/database.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { requireAdmin, requireAuth } from "./middleware/auth.js";

dotenv.config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET wajib diatur dan memiliki minimal 32 karakter. Salin .env.example ke .env.");
}

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/dist"
);
const frontendIndex = path.join(frontendDist, "index.html");
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", requireAuth, requireAdmin, adminRoutes);
app.use("/api/categories", requireAuth, categoryRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api", (_req, res) => res.status(404).json({ error: "Endpoint tidak ditemukan." }));
if (fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => res.sendFile(frontendIndex));
} else {
  app.use((_req, res) => res.status(404).json({ error: "Endpoint tidak ditemukan." }));
}
app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

app.listen(port, () => {
  console.log(`API Dompetku berjalan di http://localhost:${port}`);
});
