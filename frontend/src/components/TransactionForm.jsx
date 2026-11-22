import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { currentMonth } from "../utils/format.js";

export default function TransactionForm({ categories, transaction, onSaved, onCancel }) {
  const [form, setForm] = useState({
    date: transaction?.date || `${currentMonth()}-${String(new Date().getDate()).padStart(2, "0")}`,
    type: transaction?.type || "expense",
    categoryId: transaction?.categoryId ? String(transaction.categoryId) : "",
    amount: transaction?.amount ? String(transaction.amount) : "",
    note: transaction?.note || ""
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === form.type),
    [categories, form.type]
  );

  useEffect(() => {
    if (!filteredCategories.some((category) => String(category.id) === form.categoryId)) {
      setForm((current) => ({ ...current, categoryId: String(filteredCategories[0]?.id || "") }));
    }
  }, [filteredCategories, form.categoryId]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError("Nominal harus berupa angka bulat lebih dari 0.");
      return;
    }
    if (!form.categoryId) {
      setError("Tambahkan kategori untuk jenis transaksi ini terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      const data = { ...form, amount, categoryId: Number(form.categoryId) };
      if (transaction) await api.updateTransaction(transaction.id, data);
      else await api.createTransaction(data);
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="type-toggle" role="group" aria-label="Jenis transaksi">
        <button type="button" className={form.type === "expense" ? "selected expense-choice" : ""} onClick={() => update("type", "expense")}>Pengeluaran</button>
        <button type="button" className={form.type === "income" ? "selected income-choice" : ""} onClick={() => update("type", "income")}>Pemasukan</button>
      </div>
      <label className="field-label">Nominal
        <div className="amount-input"><span>Rp</span><input autoFocus type="number" min="1" step="1" max="1000000000000" placeholder="0" value={form.amount} onChange={(event) => update("amount", event.target.value)} required /></div>
      </label>
      <div className="form-grid">
        <label className="field-label">Tanggal<input type="date" value={form.date} onChange={(event) => update("date", event.target.value)} required /></label>
        <label className="field-label">Kategori
          <select value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)} required>
            {filteredCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
        </label>
      </div>
      <label className="field-label">Catatan <span className="optional">(opsional)</span>
        <textarea maxLength="500" rows="3" placeholder="Contoh: makan siang bersama teman" value={form.note} onChange={(event) => update("note", event.target.value)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="button button-quiet" onClick={onCancel}>Batal</button>
        <button type="submit" className="button button-primary" disabled={saving}>{saving ? "Menyimpan..." : transaction ? "Simpan perubahan" : "Simpan transaksi"}</button>
      </div>
    </form>
  );
}
