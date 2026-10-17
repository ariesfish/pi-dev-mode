// A fake typechecker: reports the two deliberate type errors in this
// fixture and exits 2, exactly like a red `tsc --noEmit`.
const fs = require("node:fs");

const checks = [
  { file: "src/button.tsx", needle: "hovered", label: "TS2339: Property 'hovered' does not exist on type 'PressableProps'" },
  { file: "src/header.tsx", needle: "hovered", label: "TS2345: Argument of type '{ hovered: boolean }' is not assignable" },
];

let errors = 0;
for (const c of checks) {
  const text = fs.readFileSync(c.file, "utf8");
  if (text.includes(c.needle)) {
    const line = text.split("\n").findIndex((l) => l.includes(c.needle)) + 1;
    console.log(`${c.file}:${line}: ${c.label}`);
    errors++;
  }
}
if (errors === 0) console.log("typecheck clean");
process.exit(errors === 0 ? 0 : 2);
