import { useCallback, useEffect, useState } from "react";
import AppShell from "./components/AppShell.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { api } from "./services/api.js";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dompetku_user") || "null");
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("dompetku_token"));
  const [page, setPage] = useState("dashboard");
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const logout = useCallback(() => {
    localStorage.removeItem("dompetku_token");
    localStorage.removeItem("dompetku_user");
    setToken(null);
    setUser(null);
    setCategories([]);
  }, []);

  useEffect(() => {
    window.addEventListener("dompetku:unauthorized", logout);
    return () => window.removeEventListener("dompetku:unauthorized", logout);
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    api.me()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        localStorage.setItem("dompetku_user", JSON.stringify(currentUser));
      })
      .catch(() => logout());
  }, [token, logout]);

  useEffect(() => {
    if (user?.role !== "admin" && page === "admin") setPage("dashboard");
  }, [user, page]);

  useEffect(() => {
    if (!token) return;
    api.categories()
      .then(({ categories: result }) => setCategories(result))
      .catch((error) => console.error("Gagal memuat kategori:", error));
  }, [token, refreshKey]);

  function authenticated(result) {
    localStorage.setItem("dompetku_token", result.token);
    localStorage.setItem("dompetku_user", JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
    setPage("dashboard");
  }

  if (!token || !user) return <AuthPage onAuthenticated={authenticated} />;

  const onChanged = () => setRefreshKey((current) => current + 1);
  return (
    <AppShell user={user} activePage={page} onNavigate={setPage} onLogout={logout}>
      {page === "dashboard" && <DashboardPage categories={categories} refreshKey={refreshKey} onChanged={onChanged} />}
      {page === "transactions" && <TransactionsPage categories={categories} refreshKey={refreshKey} onChanged={onChanged} />}
      {page === "categories" && <CategoriesPage categories={categories} onChanged={onChanged} />}
      {page === "admin" && user.role === "admin" && <AdminPage currentUser={user} refreshKey={refreshKey} />}
    </AppShell>
  );
}
