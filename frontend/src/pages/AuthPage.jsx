import { useState } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Wallet } from "lucide-react";
import { api } from "../services/api.js";

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = mode === "login"
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      onAuthenticated(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-brand"><div className="brand-mark"><Wallet size={21} /></div><span>dompet<span className="brand-light">ku</span></span></div>
        <div className="story-copy">
          <div className="eyebrow"><span /> KEUANGAN YANG LEBIH SADAR</div>
          <h1>Uangmu, ceritamu.<br /><em>Kelola dengan tenang.</em></h1>
          <p>Kenali ke mana uangmu pergi, rayakan yang kamu capai, dan bangun masa depan finansialmu satu hari demi satu hari.</p>
        </div>
        <div className="story-footer"><ShieldCheck size={17} /> Data pribadimu selalu terlindungi</div>
        <div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" />
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><div className="brand-mark"><Wallet size={20} /></div><span>dompet<span className="brand-light">ku</span></span></div>
          <div className="auth-heading">
            <div className="auth-step">{mode === "login" ? "SELAMAT DATANG KEMBALI" : "MULAI PERJALANANMU"}</div>
            <h2>{mode === "login" ? "Senang melihatmu lagi." : "Buat akun baru."}</h2>
            <p>{mode === "login" ? "Masuk untuk melihat kondisi keuanganmu." : "Hanya butuh sebentar untuk memulai."}</p>
          </div>
          <form className="auth-form form-stack" onSubmit={submit}>
            {mode === "register" && <label className="field-label">Nama lengkap<input autoComplete="name" placeholder="Nama kamu" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength="2" maxLength="80" /></label>}
            <label className="field-label">Alamat email<input type="email" autoComplete="email" placeholder="nama@email.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
            <label className="field-label">Kata sandi
              <div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Minimal 8 karakter" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength="8" maxLength="72" /><button type="button" className="icon-button" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="button button-primary auth-submit" disabled={busy}>{busy ? "Memproses..." : mode === "login" ? "Masuk ke akun" : "Buat akun"}<ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Daftar sekarang" : "Masuk"}</button></p>
          <div className="demo-hint"><span className="demo-badge">DEMO</span><p>Coba akun demo: <strong>demo@dompetku.id</strong><br />Kata sandi: <strong>Demo123!</strong></p></div>
        </div>
      </section>
    </main>
  );
}
