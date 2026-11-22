import { db } from "../db/database.js";

const transactionSelect = `
  SELECT t.id, t.date, t.type, t.amount, t.note, t.category_id AS categoryId,
    c.name AS category
  FROM transactions t
  JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
`;

function validateTransaction(body, userId) {
  const date = typeof body.date === "string" ? body.date : "";
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  const type = body.type;
  const amount = body.amount;
  const note = typeof body.note === "string" ? body.note.trim() : "";
  const categoryId = Number(body.categoryId);

  if (!dateValid) return { error: "Tanggal harus valid dengan format YYYY-MM-DD." };
  if (type !== "income" && type !== "expense") return { error: "Jenis harus pemasukan atau pengeluaran." };
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1000000000000) {
    return { error: "Nominal harus berupa bilangan bulat positif hingga Rp 1.000.000.000.000." };
  }
  if (note.length > 500) return { error: "Catatan maksimal 500 karakter." };
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
    return { error: "Pilih kategori yang valid." };
  }
  const category = db.prepare(
    "SELECT id FROM categories WHERE id = ? AND user_id = ? AND type = ?"
  ).get(categoryId, userId, type);
  if (!category) return { error: "Kategori tidak ditemukan atau jenisnya tidak sesuai." };
  return { value: { date, type, amount, note, categoryId } };
}

export function listTransactions(req, res) {
  const conditions = ["t.user_id = ?"];
  const parameters = [req.user.id];
  if (req.query.month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.month)) {
      return res.status(400).json({ error: "Filter bulan harus berformat YYYY-MM." });
    }
    conditions.push("substr(t.date, 1, 7) = ?");
    parameters.push(req.query.month);
  }
  if (req.query.type) {
    if (req.query.type !== "income" && req.query.type !== "expense") {
      return res.status(400).json({ error: "Filter jenis tidak valid." });
    }
    conditions.push("t.type = ?");
    parameters.push(req.query.type);
  }
  if (req.query.categoryId) {
    const categoryId = Number(req.query.categoryId);
    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ error: "Filter kategori tidak valid." });
    }
    conditions.push("t.category_id = ?");
    parameters.push(categoryId);
  }
  const transactions = db.prepare(
    `${transactionSelect} WHERE ${conditions.join(" AND ")} ORDER BY t.date DESC, t.id DESC`
  ).all(...parameters);
  return res.json({ transactions });
}

export function createTransaction(req, res) {
  const validated = validateTransaction(req.body, req.user.id);
  if (validated.error) return res.status(400).json({ error: validated.error });
  const { date, type, amount, note, categoryId } = validated.value;
  const result = db.prepare(
    "INSERT INTO transactions (user_id, category_id, date, type, amount, note) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(req.user.id, categoryId, date, type, amount, note);
  const transaction = db.prepare(
    `${transactionSelect} WHERE t.id = ? AND t.user_id = ?`
  ).get(Number(result.lastInsertRowid), req.user.id);
  return res.status(201).json({ transaction });
}

export function updateTransaction(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID transaksi tidak valid." });
  }
  const validated = validateTransaction(req.body, req.user.id);
  if (validated.error) return res.status(400).json({ error: validated.error });
  const { date, type, amount, note, categoryId } = validated.value;
  const result = db.prepare(
    `UPDATE transactions
     SET category_id = ?, date = ?, type = ?, amount = ?, note = ?
     WHERE id = ? AND user_id = ?`
  ).run(categoryId, date, type, amount, note, id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Transaksi tidak ditemukan." });
  const transaction = db.prepare(
    `${transactionSelect} WHERE t.id = ? AND t.user_id = ?`
  ).get(id, req.user.id);
  return res.json({ transaction });
}

export function deleteTransaction(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "ID transaksi tidak valid." });
  }
  const result = db.prepare(
    "DELETE FROM transactions WHERE id = ? AND user_id = ?"
  ).run(id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Transaksi tidak ditemukan." });
  return res.status(204).end();
}

export function exportTransactions(req, res) {
  const transactions = db.prepare(
    `${transactionSelect} WHERE t.user_id = ? ORDER BY t.date DESC, t.id DESC`
  ).all(req.user.id);
  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["Tanggal", "Jenis", "Kategori", "Nominal", "Catatan"],
    ...transactions.map((transaction) => [
      transaction.date,
      transaction.type === "income" ? "Pemasukan" : "Pengeluaran",
      transaction.category,
      transaction.amount,
      transaction.note
    ])
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="transaksi-dompetku.csv"');
  return res.send(csv);
}
