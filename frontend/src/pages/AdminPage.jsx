import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, UserRound, UsersRound } from "lucide-react";
import { api } from "../services/api.js";
import { formatDate } from "../utils/format.js";

const number = new Intl.NumberFormat("id-ID");

export default function AdminPage({ currentUser, refreshKey }) {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.adminOverview()
      .then((result) => { if (active) setOverview(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  async function toggleStatus(user) {
    const nextStatus = !user.isActive;
    const action = nextStatus ? "mengaktifkan" : "menonaktifkan";
    if (!window.confirm(`Yakin ingin ${action} akun ${user.name}?`)) return;
    setUpdatingId(user.id);
    setError("");
    try {
      await api.updateUserStatus(user.id, nextStatus);
      setOverview((current) => ({
        ...current,
        summary: {
          ...current.summary,
          activeUsers: current.summary.activeUsers + (nextStatus ? 1 : -1)
        },
        users: current.users.map((item) =>
          item.id === user.id ? { ...item, isActive: nextStatus } : item
        )
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading heading-row">
        <div>
          <div className="eyebrow"><span /> AREA ADMIN</div>
          <h1>Kelola akun<br className="mobile-break" /> <em>Dompetku.</em></h1>
          <p>Kelola status pengguna dan lihat statistik umum. Transaksi pribadi tidak ditampilkan di sini.</p>
        </div>
        <div className="admin-privacy"><ShieldCheck size={17} /> Data transaksi tetap privat</div>
      </section>

      {error && <div className="notice-error" role="alert">{error}</div>}
      {loading && !overview && <div className="loading-card">Memuat statistik akun...</div>}
      {overview && <>
        <section className="summary-grid admin-summary-grid">
          <article className="summary-card">
            <div className="summary-label"><span>Total akun</span><div className="summary-icon"><UsersRound size={18} /></div></div>
            <strong className="summary-amount">{number.format(overview.summary.totalUsers)}</strong>
            <div className="summary-caption">Semua akun terdaftar</div>
          </article>
          <article className="summary-card">
            <div className="summary-label"><span>Akun aktif</span><div className="summary-icon icon-income"><UserCheck size={18} /></div></div>
            <strong className="summary-amount">{number.format(overview.summary.activeUsers)}</strong>
            <div className="summary-caption">Dapat masuk ke aplikasi</div>
          </article>
          <article className="summary-card">
            <div className="summary-label"><span>Total transaksi</span><div className="summary-icon icon-expense"><UserRound size={18} /></div></div>
            <strong className="summary-amount">{number.format(overview.summary.totalTransactions)}</strong>
            <div className="summary-caption">Jumlah keseluruhan, tanpa detail transaksi</div>
          </article>
        </section>

        <section className="panel admin-users-panel">
          <div className="transactions-toolbar">
            <div className="table-heading"><div className="panel-kicker">AKSES PENGGUNA</div><h2>Daftar akun <span>{overview.users.length}</span></h2></div>
            <span className="privacy-caption"><ShieldCheck size={15} /> Tidak ada data transaksi pribadi</span>
          </div>
          <div className="table-wrap">
            <table className="admin-users-table">
              <thead><tr><th>PENGGUNA</th><th>TANGGAL DAFTAR</th><th>PERAN</th><th>STATUS</th><th>AKSI</th></tr></thead>
              <tbody>
                {overview.users.map((user) => <tr key={user.id}>
                  <td><div className="admin-user-identity"><span className="avatar">{(user.name || "U").slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><span>{user.email}</span></div></div></td>
                  <td className="date-cell">{formatDate(user.createdAt.slice(0, 10))}</td>
                  <td><span className={`role-pill${user.role === "admin" ? " admin-role" : ""}`}>{user.role === "admin" ? "Admin" : "User"}</span></td>
                  <td><span className={`account-status${user.isActive ? " active" : " inactive"}`}><i />{user.isActive ? "Aktif" : "Nonaktif"}</span></td>
                  <td><button className={`button account-action${user.isActive ? " deactivate-button" : " activate-button"}`} disabled={updatingId === user.id || currentUser.id === user.id} onClick={() => toggleStatus(user)}>{currentUser.id === user.id ? "Akun Anda" : updatingId === user.id ? "Menyimpan..." : user.isActive ? "Nonaktifkan" : "Aktifkan"}</button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>Informasi akun saja; admin tidak dapat membuka transaksi pengguna.</span><span>{overview.users.length} akun</span></div>
        </section>
      </>}
    </div>
  );
}
