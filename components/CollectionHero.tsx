import { accentColorByValue } from "@/lib/accent-colors";
import { isIconImagePath } from "@/lib/collection-tree";

export function CollectionHero({
  name,
  icon,
  color,
  count,
}: {
  name: string;
  icon: string | null;
  color: string | null;
  count: number;
}) {
  const { hex, hexStrong } = color ? accentColorByValue(color) : { hex: null, hexStrong: null };

  return (
    <div
      className="mx-4 mt-4 sm:mx-6 sm:mt-6 rounded-xl border border-[var(--border)] px-5 py-6 sm:px-7 sm:py-8 flex items-center gap-4"
      style={
        hex
          ? { background: `linear-gradient(135deg, ${hex}, ${hexStrong})` }
          : { background: "linear-gradient(135deg, var(--surface-2), var(--surface-1))" }
      }
    >
      <div
        className={`flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl text-3xl sm:text-4xl leading-none ${
          hex ? "bg-white/15" : "bg-[var(--surface-0-a80)]"
        }`}
      >
        {isIconImagePath(icon) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-full w-full rounded-xl object-cover" />
        ) : (
          icon || "📁"
        )}
      </div>
      <div className="min-w-0">
        <h1
          className={`text-xl sm:text-2xl font-semibold truncate ${hex ? "text-white" : "text-[var(--text-primary)]"}`}
        >
          {name}
        </h1>
        <p className={`text-xs sm:text-sm ${hex ? "text-white/80" : "text-[var(--text-faint)]"}`}>
          {count} bookmark{count === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
