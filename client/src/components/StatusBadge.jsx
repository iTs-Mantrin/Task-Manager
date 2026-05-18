function StatusBadge({ value, kind = 'status' }) {
  const normalized = String(value || '').toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge ${kind} ${normalized}`}>{value}</span>;
}

export default StatusBadge;
