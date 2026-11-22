import { useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChartNoAxesCombined, CircleUserRound, LayoutDashboard, LogOut, Menu, ShieldCheck, Wallet, X } from "lucide-react";

const userNavigation = [
  { id: "dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { id: "transactions", label: "Transaksi", icon: ArrowLeftRight },
  { id: "categories", label: "Kategori", icon: ChartNoAxesCombined }
];

export default function AppShell({ user, activePage, onNavigate, onLogout, children }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigation = user?.role === "admin"
    ? [...userNavigation, { id: "admin", label: "Admin", icon: ShieldCheck }]
    : userNavigation;
  return (
    <div className="app-shell">
      {mobileMenu && <button className="mobile-scrim" aria-label="Tutup menu" onClick={() => setMobileMenu(false)} />}
      <aside className={`sidebar${mobileMenu ? " sidebar-open" : ""}`}>
        <div className="brand-lockup"><div className="brand-mark"><Wallet size={21} strokeWidth={2.2} /></div><span>dompet<span className="brand-light">ku</span></span><button className="mobile-close icon-button" aria-label="Tutup menu" onClick={() => setMobileMenu(false)}><X size={19} /></button></div>
        <div className="workspace-label">MENU UTAMA</div>
        <nav className="side-nav">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item${activePage === id ? " nav-active" : ""}`} onClick={() => { onNavigate(id); setMobileMenu(false); }}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icons"><ArrowDownLeft size={16} /><ArrowUpRight size={16} /></div>
            <p>Catat setiap langkah kecil. Kebiasaan baik dimulai hari ini.</p>
            <span>KEUANGAN LEBIH TENANG ✦</span>
          </div>
          <div className="profile-row">
            <div className="avatar">{(user?.name || "U").slice(0, 1).toUpperCase()}</div>
            <div className="profile-info"><strong>{user?.name}</strong><span>{user?.email}</span></div>
            <button className="icon-button logout-button" onClick={onLogout} aria-label="Keluar" title="Keluar"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Buka menu" onClick={() => setMobileMenu(true)}><Menu size={21} /></button>
          <div className="topbar-kicker">RUANG KEUANGAN PRIBADIMU</div>
          <div className="topbar-right"><span className="online-dot" /> Semua data tersimpan aman <CircleUserRound size={18} /></div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
