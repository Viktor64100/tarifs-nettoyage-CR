export default function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block mb-2.5 ${className}`}>
      <div className="text-sm text-sub mb-1.5 font-medium">{label}</div>
      {children}
    </label>
  );
}
