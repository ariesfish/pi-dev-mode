// A button whose hover handling trips the typechecker.
export function Button() {
  return (
    <button>
      {({ hovered }) => {
        return hovered ? "hover" : "idle";
      }}
    </button>
  );
}
