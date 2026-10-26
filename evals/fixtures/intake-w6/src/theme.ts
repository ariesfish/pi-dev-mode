export type Theme = "light" | "dark";

const SAVE_KEY = "w6.theme";
// Reported symptom: the saved theme comes back default. This read uses a key
// nobody writes — the defect the incoming report describes.
const LOAD_KEY = "w6.theme.current";

export function loadTheme(): Theme {
  const stored = localStorage.getItem(LOAD_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(SAVE_KEY, theme);
}
