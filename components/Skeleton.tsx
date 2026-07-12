export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded bg-[var(--surface-2)] ${className}`} style={style} />;
}
