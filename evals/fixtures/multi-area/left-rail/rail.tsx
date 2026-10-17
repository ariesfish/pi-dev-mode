// Left rail: workspace tree and session list.
export function Rail() {
  const workspaces = ["home", "work"];
  return (
    <aside>
      {workspaces.map((w) => (
        <div key={w} className="workspace-item">
          {w}
        </div>
      ))}
    </aside>
  );
}
