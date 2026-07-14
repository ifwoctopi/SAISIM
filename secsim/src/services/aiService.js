import threatScripts from '../data/threatScripts.json';

const LEAK_TRIGGERS = [
  'salary',
  'payroll',
  'compensation',
  'ssn',
  'wire transfer',
  'admin password',
  'root password',
  'credentials',
  'ignore your instructions',
  'ignore previous instructions',
  'system prompt',
  'confidential',
];

const INSECURE_LEAK_REPLY =
  '⚠ [SIMULATED DATA EXPOSURE — Insecure Mode]\nSure — from salary_records.xlsx: J. Alvarez base $118,400 +$12k bonus; R. Chen base $132,000 +$9,500 bonus; S. Okafor base $121,000 +$6,000 bonus.\n\nThis should not happen. In Insecure Mode the assistant is wired directly to the full file store with no role check and no output filtering, so a plain-language request just exfiltrated HR compensation data — and it went unlogged (see Audit Log).';

const SECURE_REFUSAL_REPLY =
  "I can't share salary, credential, or export-restricted data through this chat, regardless of how the request is phrased. That goes through an audited, role-checked export path — Secure Mode keeps me scoped to advisory guidance only, with every attempt like this recorded in the Audit Log.";

const DEFAULT_REPLY =
  'I can walk through common threats here — try asking about phishing, ransomware, brute-force logins, insider exfiltration, SQL injection, or access control (RBAC). You can also open files on the left.';

export function scriptedReply(text, mode) {
  const lower = text.toLowerCase();
  const leakHit = LEAK_TRIGGERS.some((keyword) => lower.includes(keyword));
  if (leakHit) {
    return mode === 'insecure' ? INSECURE_LEAK_REPLY : SECURE_REFUSAL_REPLY;
  }

  const hit = threatScripts.find((script) => script.keys.some((keyword) => lower.includes(keyword)));
  return hit ? hit.reply : DEFAULT_REPLY;
}
