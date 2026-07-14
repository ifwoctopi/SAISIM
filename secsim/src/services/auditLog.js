export function createAuditLogger(mode, role, setAuditLog) {
  return function logAudit(entry) {
    if (mode !== 'secure') return;
    setAuditLog((prev) => [...prev, { ...entry, time: new Date().toLocaleTimeString(), role: role.label }]);
  };
}
