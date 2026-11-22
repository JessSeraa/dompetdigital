import { db } from "../db/database.js";

export function getAdminOverview(_req, res) {
  const totals = db.prepare(`
    SELECT
      COUNT(*) AS totalUsers,
      COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) AS activeUsers
    FROM users
  `).get();
  const transactionCount = db.prepare(
    "SELECT COUNT(*) AS totalTransactions FROM transactions"
  ).get().totalTransactions;
  const users = db.prepare(`
    SELECT id, name, email, role, is_active AS isActive, created_at AS createdAt
    FROM users
    ORDER BY created_at DESC, id DESC
  `).all().map((user) => ({ ...user, isActive: Boolean(user.isActive) }));

  return res.json({
    summary: {
      totalUsers: totals.totalUsers,
      activeUsers: totals.activeUsers,
      totalTransactions: transactionCount
    },
    users
  });
}

export function updateUserStatus(req, res) {
  const userId = Number(req.params.id);
  const { isActive } = req.body;

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "ID akun tidak valid." });
  }
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "Status akun harus aktif atau nonaktif." });
  }
  if (userId === req.user.id && !isActive) {
    return res.status(400).json({ error: "Admin tidak dapat menonaktifkan akunnya sendiri." });
  }

  const target = db.prepare(
    "SELECT id, role, is_active AS isActive FROM users WHERE id = ?"
  ).get(userId);
  if (!target) {
    return res.status(404).json({ error: "Akun tidak ditemukan." });
  }
  if (!isActive && target.role === "admin" && target.isActive) {
    const activeAdmins = db.prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1"
    ).get().count;
    if (activeAdmins <= 1) {
      return res.status(400).json({ error: "Admin aktif terakhir tidak dapat dinonaktifkan." });
    }
  }

  db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(isActive ? 1 : 0, userId);
  return res.json({ user: { id: userId, isActive } });
}
