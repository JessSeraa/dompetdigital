export const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value || 0);

export const currentMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

export const formatMonth = (month) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })
    .format(new Date(`${month}-01T00:00:00`));

export const formatDate = (date) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${date}T00:00:00`));
