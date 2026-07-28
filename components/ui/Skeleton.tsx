export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-neutral-soft rounded-lg animate-skeleton ${className}`} />;
}
