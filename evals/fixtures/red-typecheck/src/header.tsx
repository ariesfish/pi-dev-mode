// A header whose pressable style trips the typechecker.
export function Header() {
  return (
    <div
      style={pressableStyle({ hovered: false, pressed: false })}
    >
      Title
    </div>
  );
}
