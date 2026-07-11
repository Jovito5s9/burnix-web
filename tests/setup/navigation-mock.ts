import { vi } from "vitest";

export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const navigationMock = {
  router: routerMock,
  pathname: "/eventos/10",
  searchParams: new URLSearchParams(),
  setPathname(pathname: string) {
    this.pathname = pathname;
  },
  setSearchParams(value: string | URLSearchParams) {
    this.searchParams =
      typeof value === "string" ? new URLSearchParams(value) : value;
  },
  reset() {
    this.pathname = "/eventos/10";
    this.searchParams = new URLSearchParams();
    Object.values(routerMock).forEach((mock) => mock.mockReset());
  },
};
