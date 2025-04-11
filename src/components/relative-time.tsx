const rtf = new Intl.RelativeTimeFormat(navigator.language, {
  numeric: "auto",
});

const cutoffs = [60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity];

const units: Intl.RelativeTimeFormatUnit[] = [
  "second",
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
];

export default function RelativeTime({
  className = "",
  date,
  label = null,
}: {
  className: string;
  date: Date;
  label: string | null;
}) {
  const timeMs = typeof date === "number" ? date : date.getTime();
  const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);
  const unitIndex = cutoffs.findIndex(
    (cutoff) => cutoff > Math.abs(deltaSeconds),
  );
  const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1;
  const timeText = date.toLocaleString(navigator.language, {
    dateStyle: "long",
    timeStyle: "long",
  });

  return (
    <span
      className={className}
      title={`${label ? `${label}: ` : ""}${timeText}`}
    >
      {rtf.format(Math.floor(deltaSeconds / divisor), units[unitIndex])}
    </span>
  );
}
