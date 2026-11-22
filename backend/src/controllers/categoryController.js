import { db } from "../db/database.js";

export function listCategories(req, res) {
  const categories = db.prepare(
    "SELECT id, name, type FROM categories WHERE user_id = ? ORDER BY type, name"
  ).all(req.user.id);
  return res.json({ categories });
}

export function createCategory(req, res) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const type = req.body.type;
  if (name.length < 2 || name.length > 40) {
    return res.status(400).json({ error: "Nama kategori harus berisi 2–40 karakter." });
  }
  if (type !== "income" && type !== "expense") {
    return res.status(400).json({ error: "Jenis kategori harus pemasukan atau pengeluaran." });
  }
  try {
    const result = db.prepare(
      "INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)"
    ).run(req.user.id, name, type);
    return res.status(201).json({
      category: { id: Number(result.lastInsertRowid), name, type }
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Kategori dengan nama dan jenis tersebut sudah ada." });
    }
    throw error;
  }
}
