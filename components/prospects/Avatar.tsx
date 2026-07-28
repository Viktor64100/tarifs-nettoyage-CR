const PALETTE = [
  { bg: "#E4F1EA", fg: "#075E42" },
  { bg: "#FAEFDA", fg: "#8A5A0C" },
  { bg: "#E4E9F1", fg: "#33507A" },
  { bg: "#F1E4EC", fg: "#7A3358" },
  { bg: "#EEF1F0", fg: "#5C6B66" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({
  firstName,
  lastName,
  size = 40,
}: {
  firstName: string;
  lastName?: string | null;
  size?: number;
}) {
  const initials = `${firstName.charAt(0)}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "?";
  const tone = PALETTE[hashString(firstName + (lastName ?? "")) % PALETTE.length];

  return (
    <div
      className="rounded-full flex items-center justify-center font-display font-semibold shrink-0"
      style={{ width: size, height: size, background: tone.bg, color: tone.fg, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}
