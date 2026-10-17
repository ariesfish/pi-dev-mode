// The badge row. Colors and radius come from theme.ts.
export function BadgeRow() {
  const badges = ["status", "review", "done"];
  return (
    <div className="badge-row">
      {badges.map((b) => (
        <span key={b} className="badge">
          {b}
        </span>
      ))}
    </div>
  );
}
