export const APP_NAME = "Burnix";

export const navLinks = [
  { label: "Login", href: "/login" },
  { label: "Cadastro", href: "/register" },
  { label: "Dashboard", href: "/dashboard" },
] as const;

export const dashboardNavLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Eventos", href: "/contracts" },
  { label: "Pagamentos", href: "/payments" },
  { label: "Configurações", href: "/settings" },
] as const;
