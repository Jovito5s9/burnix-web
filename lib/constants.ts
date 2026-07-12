export const APP_NAME = "Burnix";

export const navLinks = [
  { label: "Login", href: "/login" },
  { label: "Cadastro", href: "/register" },
  { label: "Visão geral", href: "/dashboard" },
] as const;

export const dashboardNavLinks = [
  { label: "Visão geral", href: "/dashboard" },
  { label: "Eventos e inscrições", href: "/contracts" },
  { label: "Pagamentos", href: "/payments" },
  { label: "Configurações", href: "/settings" },
] as const;

export const adminDashboardNavLink = { label: "Administração", href: "/admin" } as const;
