export type Theme = "light" | "dark";

const KEY = "w6.theme";

export function loadTheme(): Theme {
  const stored = localStorage.getItem(KEY);
  return stored === "dark" ? "dark" : "light";
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
}
