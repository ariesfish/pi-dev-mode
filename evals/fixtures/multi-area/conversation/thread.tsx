// Conversation surface: thought rows, tool rows, markdown, mermaid.
export function Thread() {
  const entries = [
    { kind: "thought", text: "thinking…" },
    { kind: "tool", text: "read file.ts" },
    { kind: "markdown", text: "## heading" },
  ];
  return (
    <main>
      {entries.map((e) => (
        <div key={e.kind} className={`row row-${e.kind}`}>
          {e.text}
        </div>
      ))}
    </main>
  );
}
