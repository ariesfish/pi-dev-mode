import { loadTheme, saveTheme, type Theme } from "./theme";

export function renderSettings(root: HTMLElement): void {
  const current: Theme = loadTheme();
  root.innerHTML = `
    <form id="settings">
      <label>Theme
        <select name="theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <button type="submit">Save</button>
    </form>`;
  const form = root.querySelector<HTMLFormElement>("#settings")!;
  form.theme.value = current;
  form.addEventListener("submit", () => {
    saveTheme(form.theme.value as Theme);
  });
}
