import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Tag } from "lucide-react";
import Modal from "../components/Modal.jsx";
import { api } from "../services/api.js";

const DEFAULT_CATEGORIES = new Set([
  "expense:Makan", "expense:Transport", "expense:Belanja", "expense:Tagihan",
  "expense:Kesehatan", "expense:Hiburan", "expense:Pendidikan", "expense:Lainnya",
  "income:Gaji", "income:Bonus", "income:Investasi", "income:Lainnya"
]);

export default function CategoriesPage({ categories, onChanged }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "expense" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const expenseCategories = categories.filter((category) => category.type === "expense");
  const incomeCategories = categories.filter((category) => category.type === "income");

  useEffect(() => {
    if (!showForm) {
      setForm({ name: "", type: "expense" });
      setError("");
    }
  }, [showForm]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.createCategory(form);
      setShowForm(false);
      onChanged();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function CategoryGroup({ title, type, items }) {
    return <article className="panel category-group">
      <div className="category-group-heading"><div className={`category-group-icon ${type}`}>{type === "income" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</div><div><div className="panel-kicker">{type === "income" ? "UANG MASUK" : "UANG KELUAR"}</div><h2>{title}</h2></div><span className="category-count">{items.length} kategori</span></div>
      <div className="category-list">{items.map((category, index) => <div className="category-item" key={category.id}><span className={`category-dot dot-${index % 6}`}><Tag size={15} /></span><strong>{category.name}</strong><span className="default-tag">{DEFAULT_CATEGORIES.has(`${category.type}:${category.name}`) ? "Bawaan" : "Kustom"}</span></div>)}</div>
    </article>;
  }

  return (
    <div className="page-stack">
      <section className="page-heading heading-row">
        <div><div className="eyebrow"><span /> KATEGORI</div><h1>Atur uang sesuai<br className="mobile-break" /> <em>caramu.</em></h1><p>Kelompokkan transaksi supaya kamu lebih mudah melihat polanya.</p></div>
        <button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Tambah kategori</button>
      </section>
      <div className="category-groups">
        <CategoryGroup title="Pengeluaran" type="expense" items={expenseCategories} />
        <CategoryGroup title="Pemasukan" type="income" items={incomeCategories} />
      </div>
      <div className="dashboard-footnote">Kategori bawaan siap digunakan. Buat kategori baru yang paling sesuai dengan keseharianmu.</div>
      {showForm && <Modal title="Tambah kategori" onClose={() => setShowForm(false)}>
        <form className="form-stack" onSubmit={submit}>
          <label className="field-label">Nama kategori<input autoFocus maxLength="40" minLength="2" placeholder="Contoh: Langganan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label className="field-label">Jenis kategori<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Batal</button><button className="button button-primary" disabled={saving}>{saving ? "Menyimpan..." : "Simpan kategori"}</button></div>
        </form>
      </Modal>}
    </div>
  );
}
