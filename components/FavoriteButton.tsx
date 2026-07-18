"use client";

export function FavoriteButton({
  active,
  onToggle,
  className = "",
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      title={active ? "Remove from favorites" : "Add to favorites"}
      className={`leading-none transition-opacity ${
        active
          ? "opacity-100 text-yellow-400"
          : "opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[var(--text-faint)] hover:text-yellow-400"
      } ${className}`}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
