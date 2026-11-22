import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import Modal from "../components/Modal.jsx";
import TransactionForm from "../components/TransactionForm.jsx";
import { api } from "../services/api.js";
import { currentMonth, formatMonth, formatRupiah } from "../utils/format.js";

const COLORS = ["#4c765f", "#85a78f", "#e7a46d", "#8d9dc3", "#d9c46b", "#bb8b9b", "#86b6b3", "#b2aa9c"];
const axisMoney = (value) => `Rp ${new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;

function ChartTooltip({ active, payload, label, currency = true }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((entry) => <div key={entry.name}><i style={{ background: entry.color || entry.fill }} />{entry.name}: {currency ? formatRupiah(entry.value) : formatRupiah(entry.value)}</div>)}</div>;
}

export default function DashboardPage({ categories, refreshKey, onChanged }) {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    setError("");
    api.dashboard(month)
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [month, refreshKey]);

  const monthInput = (
    <label className="month-picker"><span>Periode</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
  );

  return (
    <div className="page-stack">
      <section className="page-heading heading-row">
        <div><div className="eyebrow"><span /> DASHBOARD</div><h1>Uangmu, dalam<br className="mobile-break" /> <em>gambaran besar.</em></h1><p>Ini ringkasan perjalanan keuanganmu di bulan {formatMonth(month)}.</p></div>
        <div className="heading-actions">{monthInput}<button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Catat transaksi</button></div>
      </section>
      {error && <div className="notice-error" role="alert">{error}</div>}
      {!data && !error && <div className="loading-card">Menyiapkan ringkasan keuanganmu...</div>}
      {data && <>
        <section className="summary-grid">
          <article className="summary-card balance-card">
            <div className="summary-label"><span>Saldo bulan ini</span><div className="summary-icon"><Wallet size={18} /></div></div>
            <strong className="summary-amount">{formatRupiah(data.summary.balance)}</strong>
            <div className="summary-caption"><span className="balance-indicator" /> Selisih pemasukan & pengeluaran</div>
            <div className="balance-decoration" />
          </article>
          <article className="summary-card">
            <div className="summary-label"><span>Total pemasukan</span><div className="summary-icon icon-income"><ArrowDownLeft size={18} /></div></div>
            <strong className="summary-amount">{formatRupiah(data.summary.income)}</strong>
            <div className="summary-caption">Uang yang masuk bulan ini</div>
          </article>
          <article className="summary-card">
            <div className="summary-label"><span>Total pengeluaran</span><div className="summary-icon icon-expense"><ArrowUpRight size={18} /></div></div>
            <strong className="summary-amount">{formatRupiah(data.summary.expense)}</strong>
            <div className="summary-caption">Uang yang keluar bulan ini</div>
          </article>
        </section>
        <section className="charts-grid">
          <article className="panel trend-panel">
            <div className="panel-header"><div><div className="panel-kicker">ENAM BULAN TERAKHIR</div><h2>Arus keuangan</h2></div><div className="legend"><span><i className="legend-income" /> Pemasukan</span><span><i className="legend-expense" /> Pengeluaran</span></div></div>
            <div className="chart-area trend-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrend} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={5}>
                  <CartesianGrid vertical={false} stroke="#edf0eb" strokeDasharray="3 5" />
                  <XAxis dataKey="month" tickFormatter={(value) => new Date(`${value}-01T00:00:00`).toLocaleDateString("id-ID", { month: "short" })} axisLine={false} tickLine={false} tick={{ fill: "#919b91", fontSize: 11 }} dy={10} />
                  <YAxis width={67} tickFormatter={axisMoney} axisLine={false} tickLine={false} tick={{ fill: "#919b91", fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="income" name="Pemasukan" fill="#6f9a7a" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#e9ad78" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="panel category-panel">
            <div className="panel-header"><div><div className="panel-kicker">BULAN INI</div><h2>Pengeluaran per kategori</h2></div></div>
            {data.categoryExpenses.length ? <>
              <div className="chart-area pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={data.categoryExpenses} dataKey="amount" nameKey="category" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none">{data.categoryExpenses.map((item, index) => <Cell key={item.categoryId} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart>
                </ResponsiveContainer>
                <div className="pie-center"><span>Total keluar</span><strong>{formatRupiah(data.summary.expense)}</strong></div>
              </div>
              <div className="category-legend">{data.categoryExpenses.slice(0, 5).map((item, index) => <div key={item.categoryId}><span><i style={{ background: COLORS[index % COLORS.length] }} />{item.category}</span><strong>{formatRupiah(item.amount)}</strong></div>)}</div>
            </> : <div className="empty-chart"><div className="empty-chart-icon"><Wallet size={19} /></div><strong>Belum ada pengeluaran</strong><span>Transaksimu akan muncul di sini.</span></div>}
          </article>
        </section>
        <div className="dashboard-footnote">Ada <strong>{data.summary.transactionCount} transaksi</strong> tercatat bulan ini. Sedikit demi sedikit, jadi berarti.</div>
      </>}
      {showForm && <Modal title="Catat transaksi" onClose={() => setShowForm(false)}><TransactionForm categories={categories} onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); onChanged(); }} /></Modal>}
    </div>
  );
}
