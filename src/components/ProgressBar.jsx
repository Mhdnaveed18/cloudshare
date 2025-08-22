export default function ProgressBar({ value = 0 }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-gray-200/70 h-2">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-[--color-brand] to-[--color-brand-2] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
