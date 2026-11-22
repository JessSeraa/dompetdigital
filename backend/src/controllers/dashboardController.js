import { db } from "../db/database.js";

export function getDashboard(req, res) {
  const requestedMonth = req.query.month;
  const month = requestedMonth || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ error: "Bulan harus berformat YYYY-MM." });
  }

  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
      COUNT(*) AS transactionCount
    FROM transactions
    WHERE user_id = ? AND substr(date, 1, 7) = ?
  `).get(req.user.id, month);

  const categoryExpenses = db.prepare(`
    SELECT c.id AS categoryId, c.name AS category, SUM(t.amount) AS amount
    FROM transactions t
    JOIN categories c ON c.id = t.category_id AND c.user_id = t.user_id
    WHERE t.user_id = ? AND t.type = 'expense' AND substr(t.date, 1, 7) = ?
    GROUP BY c.id, c.name
    ORDER BY amount DESC
  `).all(req.user.id, month);

  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const monthKeys = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - offset, 1));
    monthKeys.push(date.toISOString().slice(0, 7));
  }
  const placeholders = monthKeys.map(() => "?").join(", ");
  const monthlyRows = db.prepare(`
    SELECT substr(date, 1, 7) AS month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
    FROM transactions
    WHERE user_id = ? AND substr(date, 1, 7) IN (${placeholders})
    GROUP BY substr(date, 1, 7)
  `).all(req.user.id, ...monthKeys);
  const monthlyByMonth = new Map(monthlyRows.map((row) => [row.month, row]));
  const monthlyTrend = monthKeys.map((key) => {
    const row = monthlyByMonth.get(key);
    return { month: key, income: row?.income || 0, expense: row?.expense || 0 };
  });

  return res.json({
    month,
    summary: {
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
      transactionCount: totals.transactionCount
    },
    categoryExpenses,
    monthlyTrend
  });
}
