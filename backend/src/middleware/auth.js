import jwt from "jsonwebtoken";
import { db } from "../db/database.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Silakan masuk untuk melanjutkan." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(payload.sub);
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Sesi tidak valid atau sudah berakhir. Silakan masuk kembali." });
    }

    const user = db.prepare(
      "SELECT id, name, email, role, is_active AS isActive FROM users WHERE id = ?"
    ).get(userId);
    if (!user) {
      return res.status(401).json({ error: "Sesi tidak valid atau sudah berakhir. Silakan masuk kembali." });
    }
    if (!user.isActive) {
      return res.status(401).json({ error: "Akun telah dinonaktifkan. Hubungi admin." });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Sesi tidak valid atau sudah berakhir. Silakan masuk kembali." });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Akses khusus admin." });
  }
  return next();
}
