export default function StampBadge({ status, disposalStatus, days }) {
  if (status === "expired") {
    if (disposalStatus === "disposed") {
      return <span className="stamp-disposed">✓ disposed</span>;
    }
    return <span className="stamp-expired">⛔ quarantined</span>;
  }
  if (status === "critical") return <span className="stamp-critical">⚠ critical{days !== undefined && ` · ${days}d`}</span>;
  if (status === "warning") return <span className="stamp-warning">◆ warning{days !== undefined && ` · ${days}d`}</span>;
  if (status === "safe") return <span className="stamp-safe">✓ safe{days !== undefined && ` · ${days}d`}</span>;
  return null;
}
