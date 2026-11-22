import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, createDefaultCategories } from "../db/database.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return jwt.sign(
    { name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export function register(req, res) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: "Nama harus berisi 2–80 karakter." });
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ error: "Masukkan alamat email yang valid." });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: "Kata sandi harus berisi 8–72 karakter." });
  }
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    return res.status(409).json({ error: "Email sudah terdaftar. Silakan masuk." });
  }

  try {
    const createUser = db.transaction(() => {
      const result = db.prepare(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
      ).run(name, email, bcrypt.hashSync(password, 10));
      const id = Number(result.lastInsertRowid);
      createDefaultCategories(id);
      return { id, name, email, role: "user" };
    });
    const user = createUser();
    return res.status(201).json({ token: createToken(user), user });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Email sudah terdaftar. Silakan masuk." });
    }
    throw error;
  }
}

export function login(req, res) {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan kata sandi wajib diisi." });
  }

  const user = db.prepare(
    "SELECT id, name, email, password_hash, role, is_active AS isActive FROM users WHERE email = ?"
  ).get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Email atau kata sandi tidak sesuai." });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: "Akun telah dinonaktifkan. Hubungi admin." });
  }

  const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return res.json({ token: createToken(publicUser), user: publicUser });
}

export function currentUser(req, res) {
  return res.json({ user: req.user });
}
