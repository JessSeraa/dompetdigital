import { useCallback, useEffect, useState } from "react";
import { ArrowDownLeft, ArrowDownToLine, ArrowUpRight, CalendarDays, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "../components/Modal.jsx";
import TransactionForm from "../components/TransactionForm.jsx";
import { api } from "../services/api.js";
import { currentMonth, formatDate, formatRupiah } from "../utils/format.js";

export default function TransactionsPage({ categories, refreshKey, onChanged }) {
  const [filters, setFilters] = useState({ month: currentMonth(), categoryId: "", type: "" });
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [exporting, setExporting] = useState(false);

  const loadTransactions = useCallback(async () => {
    setError("");
    try {
      const result = await api.transactions(filters);
      setTransactions(result.transactions);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [filters]);

  useEffect(() => { loadTransactions(); }, [loadTransactions, refreshKey]);

  async function exportCsv() {
    setExporting(true);
    setError("");
    try {
      const blob = await api.exportTransactions();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transaksi-dompetku.csv";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setExporting(false);
    }
  }

  async function removeTransaction(transaction) {
    if (!window.confirm(`Hapus transaksi ${formatRupiah(transaction.amount)}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setError("");
    try {
      await api.deleteTransaction(transaction.id);
      onChanged();
      await loadTransactions();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="page-stack">
      <section className="page-heading heading-row">
        <div><div className="eyebrow"><span /> CATATAN KEUANGAN</div><h1>Setiap rupiah<br className="mobile-break" /> <em>punya cerita.</em></h1><p>Lihat, saring, dan kelola semua transaksi yang kamu catat.</p></div>
        <div className="heading-actions"><button className="button button-secondary" onClick={exportCsv} disabled={exporting}><ArrowDownToLine size={17} />{exporting ? "Menyiapkan..." : "Ekspor CSV"}</button><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Transaksi baru</button></div>
      </section>
      <section className="panel transactions-panel">
        <div className="transactions-toolbar">
          <div className="table-heading"><div className="panel-kicker">AKTIVITASMU</div><h2>Semua transaksi <span>{transactions.length}</span></h2></div>
          <div className="filters">
            <label className="filter-field month-filter"><CalendarDays size={15} /><input type="month" aria-label="Filter bulan" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value })} /></label>
            <label className="filter-field"><select aria-label="Filter jenis" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select><ChevronDown size={14} /></label>
            <label className="filter-field category-filter"><select aria-label="Filter kategori" value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}><option value="">Semua kategori</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name} · {category.type === "income" ? "Masuk" : "Keluar"}</option>)}</select><ChevronDown size={14} /></label>
          </div>
        </div>
        {error && <div className="notice-error table-notice" role="alert">{error}</div>}
        <div className="table-wrap">
          <table>
            <thead><tr><th>TRANSAKSI</th><th>TANGGAL</th><th>KATEGORI</th><th>JENIS</th><th className="amount-column">NOMINAL</th><th aria-label="Aksi" /></tr></thead>
            <tbody>
              {transactions.map((transaction) => <tr key={transaction.id}>
                <td><div className="transaction-title"><span className={`transaction-type-icon ${transaction.type}`} >{transaction.type === "income" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><div><strong>{transaction.note || transaction.category}</strong><span>{transaction.note ? transaction.category : transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}</span></div></div></td>
                <td className="date-cell">{formatDate(transaction.date)}</td>
                <td><span className="category-pill">{transaction.category}</span></td>
                <td><span className={`type-label ${transaction.type}`}>{transaction.type === "income" ? "Pemasukan" : "Pengeluaran"}</span></td>
                <td className={`amount-cell ${transaction.type}`}>{transaction.type === "income" ? "+" : "−"}{formatRupiah(transaction.amount)}</td>
                <td><div className="row-actions"><button className="icon-button" aria-label="Edit transaksi" title="Edit transaksi" onClick={() => setEditing(transaction)}><Pencil size={15} /></button><button className="icon-button delete-action" aria-label="Hapus transaksi" title="Hapus transaksi" onClick={() => removeTransaction(transaction)}><Trash2 size={15} /></button></div></td>
              </tr>)}
              {!transactions.length && <tr><td colSpan="6"><div className="empty-table"><div className="empty-table-icon"><CalendarDays size={20} /></div><strong>Belum ada transaksi di periode ini</strong><span>Coba ubah filter atau catat transaksi pertamamu.</span><button className="button button-secondary" onClick={() => setShowForm(true)}><Plus size={16} /> Catat transaksi</button></div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Menampilkan <strong>{transactions.length}</strong> transaksi</span><span>Semua nominal dalam Rupiah</span></div>
      </section>
      {(showForm || editing) && <Modal title={editing ? "Edit transaksi" : "Catat transaksi"} onClose={closeForm}><TransactionForm key={editing?.id || "new"} categories={categories} transaction={editing} onCancel={closeForm} onSaved={() => { closeForm(); onChanged(); loadTransactions(); }} /></Modal>}
    </div>
  );
}
