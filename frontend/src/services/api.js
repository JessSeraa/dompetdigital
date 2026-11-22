const API_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const token = localStorage.getItem("dompetku_token");
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem("dompetku_token");
      localStorage.removeItem("dompetku_user");
      window.dispatchEvent(new Event("dompetku:unauthorized"));
    }
    throw new Error(body.error || "Permintaan gagal. Silakan coba lagi.");
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request("/auth/me"),
  adminOverview: () => request("/admin/overview"),
  updateUserStatus: (id, isActive) => request(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive })
  }),
  dashboard: (month) => request(`/dashboard?month=${encodeURIComponent(month)}`),
  categories: () => request("/categories"),
  createCategory: (data) => request("/categories", { method: "POST", body: JSON.stringify(data) }),
  transactions: (filters) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/transactions${suffix}`);
  },
  createTransaction: (data) => request("/transactions", { method: "POST", body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: "DELETE" }),
  exportTransactions: async () => {
    const token = localStorage.getItem("dompetku_token");
    const response = await fetch(`${API_URL}/api/transactions/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "Ekspor transaksi gagal.");
    }
    return response.blob();
  }
};
