import bcrypt from "bcryptjs";
import { db, createDefaultCategories } from "../db/database.js";

const name = (process.env.ADMIN_NAME || "").trim();
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

if (name.length < 2 || name.length > 80) {
  throw new Error("ADMIN_NAME wajib diisi dengan 2–80 karakter.");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  throw new Error("ADMIN_EMAIL harus berupa alamat email yang valid.");
}
if (password.length < 12 || password.length > 72) {
  throw new Error("ADMIN_PASSWORD wajib berisi 12–72 karakter.");
}

const promoteOrCreateAdmin = db.transaction(() => {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    db.prepare(`
      UPDATE users
      SET name = ?, password_hash = ?, role = 'admin', is_active = 1
      WHERE id = ?
    `).run(name, bcrypt.hashSync(password, 10), existing.id);
    createDefaultCategories(existing.id);
    return existing.id;
  }

  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, 'admin')
  `).run(name, email, bcrypt.hashSync(password, 10));
  const id = Number(result.lastInsertRowid);
  createDefaultCategories(id);
  return id;
});

const id = promoteOrCreateAdmin();
console.log(`Admin siap: ${email} (ID ${id}). Password tidak ditampilkan.`);
db.close();
