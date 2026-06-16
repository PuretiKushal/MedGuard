export default function StatusBadge({ status, days }) {
  if (status === "critical") return (
    <span className="badge-critical">
      <span className="pulse-dot" />
      CRITICAL {days !== undefined && `· ${days}d`}
    </span>
  );
  if (status === "warning") return (
    <span className="badge-warning">
      ◆ WARNING {days !== undefined && `· ${days}d`}
    </span>
  );
  if (status === "safe") return (
    <span className="badge-safe">
      ✓ SAFE {days !== undefined && `· ${days}d`}
    </span>
  );
  if (status === "expired") return (
    <span className="badge-expired">
      ✕ EXPIRED
    </span>
  );
  return null;
}
