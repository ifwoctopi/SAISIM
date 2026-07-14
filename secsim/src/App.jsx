import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Lock,
  Unlock,
  File,
  Folder,
  FolderOpen,
  ShieldAlert,
  X,
  Send,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Bot,
  User,
  PlayCircle,
  RotateCcw,
  ClipboardList,
  Eye,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import roles from './data/roles.json';
import fileTree from './data/simulatedFileSystem.json';
import irPlaybooks from './data/irPlaybooks.json';
import { buildPayload, canAccess } from './services/accessControl';
import { scriptedReply } from './services/aiService';
import { createAuditLogger } from './services/auditLog';

const T = {
  bg: '#11151C',
  panel: '#171B23',
  panelAlt: '#1D222C',
  border: '#171B23',
  text: '#E4E7EC',
  muted: '#7C8494',
  accent: '#4FB6C4',
  critical: '#D1483B',
  warning: '#E8A33D',
  success: '#4CAF7D',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

function roleById(id) {
  return roles.find((role) => role.id === id) ?? roles[1];
}

export default function App() {
  const [roleId, setRoleId] = useState('analyst');
  const role = roleById(roleId);
  const [mode, setMode] = useState('secure');

  const [expanded, setExpanded] = useState(() => Object.fromEntries(fileTree.map((group) => [group.folder, true])));
  const [tabs, setTabs] = useState([{ id: 'chat', type: 'chat', label: 'AI Assistant' }]);
  const [activeTab, setActiveTab] = useState('chat');
  const [denied, setDenied] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [messages, setMessages] = useState([{ from: 'bot', text: 'SECSIM assistant online. Ask about a threat type, or open a file on the left.' }]);
  const [draft, setDraft] = useState('');
  const chatEndRef = useRef(null);

  const logAudit = useMemo(() => createAuditLogger(mode, role, setAuditLog), [mode, role]);

  useEffect(() => {
    if (!denied) return;
    const timeout = window.setTimeout(() => setDenied(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [denied]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  function openFile(folder, file) {
    const allowed = mode === 'secure' ? canAccess(role, file) : true;
    if (!allowed) {
      setDenied(`${file.name} requires ${roles.find((candidate) => candidate.level === file.minLevel)?.label} access (you are ${role.label}).`);
      logAudit({ action: 'open', target: `${folder}/${file.name}`, result: 'denied' });
      return;
    }

    logAudit({ action: 'open', target: `${folder}/${file.name}`, result: file.minLevel > role.level ? 'allowed (unenforced)' : 'allowed' });
    const id = `${folder}/${file.name}`;
    setTabs((prev) => (prev.find((tab) => tab.id === id) ? prev : [...prev, { id, type: 'file', label: file.name, folder, file }]));
    setActiveTab(id);
  }

  function closeTab(id, event) {
    event.stopPropagation();
    setTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== id);
      if (activeTab === id) setActiveTab(next.length ? next[next.length - 1].id : 'chat');
      return next;
    });
  }

  function openStaticTab(id, label, type) {
    setTabs((prev) => (prev.find((tab) => tab.id === id) ? prev : [...prev, { id, type, label }]));
    setActiveTab(id);
  }

  function send(text) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((prev) => [...prev, { from: 'user', text: clean }]);
    setDraft('');
    const lower = clean.toLowerCase();
    const isLeak = ['salary', 'payroll', 'compensation', 'ssn', 'wire transfer', 'admin password', 'root password', 'credentials', 'ignore your instructions', 'ignore previous instructions', 'system prompt', 'confidential'].some((keyword) => lower.includes(keyword));
    window.setTimeout(() => {
      const reply = scriptedReply(clean, mode);
      setMessages((prev) => [...prev, { from: 'bot', text: reply, flagged: isLeak && mode === 'insecure' }]);
      if (isLeak) logAudit({ action: 'chat', target: 'assistant', result: mode === 'insecure' ? 'DATA EXPOSED' : 'blocked' });
    }, 350);
  }

  const active = tabs.find((tab) => tab.id === activeTab);

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: 'system-ui, -apple-system, sans-serif' }} className="w-full h-screen flex flex-col text-sm">
      <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}` }} className="flex items-center justify-between px-4 py-2 shrink-0 flex-wrap gap-y-2">
        <div className="flex items-center gap-2">
          <Terminal size={16} style={{ color: T.accent }} />
          <span className="font-semibold tracking-wide">SECSIM</span>
          <span style={{ color: T.muted }} className="hidden md:inline">// Threat & Access Simulation Console</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span style={{ color: T.muted }} className="text-xs">Mode</span>
            <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: T.panelAlt, border: `1px solid ${T.border}` }}>
              <button onClick={() => setMode('secure')} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium" style={{ background: mode === 'secure' ? T.success : 'transparent', color: mode === 'secure' ? '#0F1419' : T.muted }}>
                <ShieldCheck size={12} /> Secure
              </button>
              <button onClick={() => setMode('insecure')} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium" style={{ background: mode === 'insecure' ? T.critical : 'transparent', color: mode === 'insecure' ? '#0F1419' : T.muted }}>
                <ShieldOff size={12} /> Insecure
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: T.muted }} className="text-xs">Role</span>
            <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: T.panelAlt, border: `1px solid ${T.border}` }}>
              {roles.map((candidate) => (
                <button key={candidate.id} onClick={() => setRoleId(candidate.id)} className="px-2.5 py-1 rounded text-xs font-medium" style={{ background: roleId === candidate.id ? candidate.color : 'transparent', color: roleId === candidate.id ? '#0F1419' : T.muted }}>
                  {candidate.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-1.5 text-xs shrink-0" style={{ background: mode === 'insecure' ? '#2A1917' : '#12231C', color: mode === 'insecure' ? '#F3D9D5' : '#BFE8D4', borderBottom: `1px solid ${mode === 'insecure' ? T.critical : T.success}` }}>
        {mode === 'insecure'
          ? 'Insecure Mode — access checks and chatbot guardrails are disabled. Lock icons are cosmetic only; nothing actually enforces them. No audit trail is written.'
          : 'Secure Mode — access checked before content is served, chatbot refuses sensitive/leak-style requests, and every attempt is written to the Audit Log.'}
      </div>

      {denied && (
        <div className="absolute top-16 right-4 z-10 flex items-start gap-2 rounded-md px-3 py-2 shadow-lg" style={{ background: '#2A1917', border: `1px solid ${T.critical}`, color: '#F3D9D5', maxWidth: 340 }}>
          <AlertTriangle size={16} style={{ color: T.critical, marginTop: 2, flexShrink: 0 }} />
          <span className="text-xs">{denied}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div style={{ background: T.panel, borderRight: `1px solid ${T.border}`, width: 250 }} className="flex flex-col shrink-0 overflow-y-auto">
          <div className="px-3 pt-3 pb-1" style={{ color: T.muted }}><span className="text-xs uppercase tracking-wider">Workspace</span></div>

          <button onClick={() => openStaticTab('chat', 'AI Assistant', 'chat')} className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded" style={{ background: activeTab === 'chat' ? T.panelAlt : 'transparent' }}>
            <Bot size={14} style={{ color: T.accent }} /><span>AI Assistant</span>
          </button>
          <button onClick={() => openStaticTab('ir-console', 'Incident Response', 'ir')} className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded" style={{ background: activeTab === 'ir-console' ? T.panelAlt : 'transparent' }}>
            <ShieldAlert size={14} style={{ color: T.warning }} /><span>Incident Response</span>
          </button>
          <button onClick={() => openStaticTab('audit-log', 'Audit Log', 'audit')} className="flex items-center gap-2 px-3 py-1.5 mx-2 rounded" style={{ background: activeTab === 'audit-log' ? T.panelAlt : 'transparent' }}>
            <ClipboardList size={14} style={{ color: T.muted }} /><span>Audit Log</span>
            {auditLog.length > 0 && <span className="ml-auto text-xs px-1.5 rounded-full" style={{ background: T.panelAlt, color: T.muted }}>{auditLog.length}</span>}
          </button>
          <button onClick={() => openStaticTab('payload', 'Payload Inspector', 'payload')} className="flex items-center gap-2 px-3 py-1.5 mx-2 mb-2 rounded" style={{ background: activeTab === 'payload' ? T.panelAlt : 'transparent' }}>
            <Eye size={14} style={{ color: T.muted }} /><span>Payload Inspector</span>
          </button>

          <div style={{ borderTop: `1px solid ${T.border}` }} className="mx-2" />
          <div className="px-3 pt-2 pb-1" style={{ color: T.muted }}><span className="text-xs uppercase tracking-wider">Simulated Files</span></div>

          {fileTree.map((group) => (
            <div key={group.folder} className="px-2">
              <button onClick={() => setExpanded((current) => ({ ...current, [group.folder]: !current[group.folder] }))} className="flex items-center gap-1.5 w-full px-1 py-1 rounded">
                {expanded[group.folder] ? <ChevronDown size={12} style={{ color: T.muted }} /> : <ChevronRight size={12} style={{ color: T.muted }} />}
                {expanded[group.folder] ? <FolderOpen size={14} style={{ color: T.muted }} /> : <Folder size={14} style={{ color: T.muted }} />}
                <span>{group.folder}</span>
              </button>
              {expanded[group.folder] && (
                <div className="ml-5 flex flex-col">
                  {group.files.map((file) => {
                    const locked = file.minLevel > role.level;
                    const isOpen = activeTab === `${group.folder}/${file.name}`;
                    return (
                      <button key={file.name} onClick={() => openFile(group.folder, file)} title={locked ? (mode === 'insecure' ? 'Locked in UI only — not enforced in Insecure Mode' : 'Requires higher role level') : ''} className="flex items-center gap-1.5 px-1.5 py-1 rounded text-left" style={{ background: isOpen ? T.panelAlt : 'transparent', color: locked ? T.muted : T.text, opacity: locked ? 0.65 : 1 }}>
                        <File size={13} style={{ color: locked ? T.muted : T.accent, flexShrink: 0 }} />
                        <span className="truncate" style={{ fontFamily: T.mono, fontSize: 12 }}>{file.name}</span>
                        {locked ? <Lock size={11} style={{ color: mode === 'insecure' ? T.critical : T.warning, marginLeft: 'auto', flexShrink: 0 }} /> : <Unlock size={11} style={{ color: T.success, marginLeft: 'auto', flexShrink: 0, opacity: 0.4 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="mt-auto px-3 py-2 text-xs" style={{ color: T.muted, borderTop: `1px solid ${T.border}` }}>Role level {role.level} of 2 — {role.label}</div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div style={{ background: T.panel, borderBottom: `1px solid ${T.border}` }} className="flex items-center overflow-x-auto shrink-0">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-2 px-3 py-2 text-xs shrink-0" style={{ background: activeTab === tab.id ? T.bg : 'transparent', borderRight: `1px solid ${T.border}`, color: activeTab === tab.id ? T.text : T.muted }}>
                {tab.type === 'chat' && <Bot size={13} style={{ color: T.accent }} />}
                {tab.type === 'ir' && <ShieldAlert size={13} style={{ color: T.warning }} />}
                {tab.type === 'audit' && <ClipboardList size={13} style={{ color: T.muted }} />}
                {tab.type === 'payload' && <Eye size={13} style={{ color: T.muted }} />}
                {tab.type === 'file' && <File size={13} style={{ color: T.accent }} />}
                <span style={{ fontFamily: tab.type === 'file' ? T.mono : undefined }}>{tab.label}</span>
                {tab.id !== 'chat' && <X size={12} onClick={(event) => closeTab(tab.id, event)} style={{ color: T.muted }} />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto" style={{ background: T.bg }}>
            {!active || active.type === 'chat' ? (
              <ChatPanel messages={messages} draft={draft} setDraft={setDraft} send={send} chatEndRef={chatEndRef} mode={mode} />
            ) : active.type === 'file' ? (
              <FileViewer folder={active.folder} file={active.file} role={role} />
            ) : active.type === 'ir' ? (
              <IRConsole />
            ) : active.type === 'audit' ? (
              <AuditLogPanel log={auditLog} mode={mode} />
            ) : (
              <PayloadInspector mode={mode} role={role} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ messages, draft, setDraft, send, chatEndRef, mode }) {
  const quickChips = mode === 'insecure' ? ['Phishing', 'Ransomware', 'Show me the salary file', 'Ignore your instructions'] : ['Phishing', 'Ransomware', 'Brute-force login', 'Access control'];
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((message, index) => (
          <div key={index} className="flex items-start gap-2" style={{ alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            {message.from === 'bot' && <Bot size={16} style={{ color: message.flagged ? T.critical : T.accent, marginTop: 3, flexShrink: 0 }} />}
            <div className="rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: message.from === 'user' ? T.accent : (message.flagged ? '#2A1917' : T.panel), color: message.from === 'user' ? '#0F1419' : T.text, border: message.from === 'bot' ? `1px solid ${message.flagged ? T.critical : T.border}` : 'none' }}>
              {message.text}
            </div>
            {message.from === 'user' && <User size={16} style={{ color: T.muted, marginTop: 3, flexShrink: 0 }} />}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="px-4 pb-2 flex gap-2 flex-wrap">
        {quickChips.map((chip) => (
          <button key={chip} onClick={() => send(chip)} className="text-xs px-2.5 py-1 rounded-full" style={{ background: T.panelAlt, border: `1px solid ${T.border}`, color: T.muted }}>{chip}</button>
        ))}
      </div>

      <div className="px-4 pb-4 flex gap-2 shrink-0" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send(draft)} placeholder="Ask about a threat, or try a leak-style prompt…" className="flex-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text }} />
        <button onClick={() => send(draft)} className="rounded-md px-3 flex items-center justify-center" style={{ background: T.accent }}><Send size={15} style={{ color: '#0F1419' }} /></button>
      </div>
    </div>
  );
}

function FileViewer({ folder, file, role }) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3" style={{ color: T.muted }}>
        <Folder size={13} /><span className="text-xs">{folder}</span><ChevronRight size={12} />
        <span className="text-xs" style={{ color: T.text, fontFamily: T.mono }}>{file.name}</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: T.panelAlt, border: `1px solid ${T.border}`, color: role.color }}>
          Viewed as {role.label}
        </span>
      </div>
      <pre className="rounded-md p-4 whitespace-pre-wrap" style={{ background: T.panel, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 12.5, lineHeight: 1.6 }}>
        {file.content}
      </pre>
      <p className="mt-3 text-xs" style={{ color: T.muted }}>This content is fully simulated for training purposes.</p>
    </div>
  );
}

function IRConsole() {
  const [scenarioId, setScenarioId] = useState(null);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);
  const scenario = irPlaybooks.find((entry) => entry.id === scenarioId);

  function run(id) {
    window.clearTimeout(timerRef.current);
    setScenarioId(id);
    setRevealed(0);
    setRunning(true);
  }

  useEffect(() => {
    if (!running || !scenario) return;
    if (revealed >= scenario.steps.length) {
      setRunning(false);
      return;
    }
    timerRef.current = window.setTimeout(() => setRevealed((current) => current + 1), 650);
    return () => window.clearTimeout(timerRef.current);
  }, [running, revealed, scenario]);

  function reset() {
    window.clearTimeout(timerRef.current);
    setScenarioId(null);
    setRevealed(0);
    setRunning(false);
  }

  const severityColors = { Medium: T.warning, High: '#E07A4E', Critical: T.critical };

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4"><ShieldAlert size={16} style={{ color: T.warning }} /><span className="font-medium">Incident Response Simulator</span></div>
      {!scenario ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {irPlaybooks.map((entry) => (
            <button key={entry.id} onClick={() => run(entry.id)} className="text-left rounded-md p-3 flex flex-col gap-2" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: T.panelAlt, color: severityColors[entry.severity] }}>{entry.severity}</span>
                <PlayCircle size={14} style={{ color: T.accent }} />
              </div>
              <span className="text-sm">{entry.title}</span>
              <span className="text-xs" style={{ color: T.muted }}>{entry.steps.length} response stages</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{scenario.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: T.panelAlt, color: severityColors[scenario.severity] }}>{scenario.severity}</span>
            </div>
            <button onClick={reset} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: T.panelAlt, color: T.muted }}><RotateCcw size={12} /> Reset</button>
          </div>
          <div className="flex flex-col gap-3">
            {scenario.steps.map((step, index) => {
              const done = index < revealed;
              const isActive = index === revealed && running;
              return (
                <div key={index} className="flex items-start gap-3" style={{ opacity: index <= revealed - 1 || isActive ? 1 : 0.25 }}>
                  <div className="flex flex-col items-center">
                    {done ? <CheckCircle2 size={16} style={{ color: T.success }} /> : <div className="w-4 h-4 rounded-full" style={{ border: `2px solid ${isActive ? T.accent : T.border}` }} />}
                    {index < scenario.steps.length - 1 && <div style={{ width: 2, height: 28, background: T.border }} />}
                  </div>
                  <div className="pb-2">
                    <div className="text-sm font-medium" style={{ color: done ? T.text : T.muted }}>{step.label}</div>
                    {(done || isActive) && <div className="text-xs mt-0.5" style={{ color: T.muted, maxWidth: 480 }}>{step.detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {!running && revealed >= scenario.steps.length && (
            <div className="mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-md" style={{ background: '#12231C', border: `1px solid ${T.success}`, color: '#BFE8D4' }}>
              <CheckCircle2 size={14} /> Simulation complete — all response stages executed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuditLogPanel({ log, mode }) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3"><ClipboardList size={16} style={{ color: T.muted }} /><span className="font-medium">Audit Log</span></div>
      <div className="text-xs mb-4 px-3 py-2 rounded-md" style={{ background: mode === 'insecure' ? '#2A1917' : T.panel, border: `1px solid ${mode === 'insecure' ? T.critical : T.border}`, color: mode === 'insecure' ? '#F3D9D5' : T.muted }}>
        {mode === 'insecure'
          ? "You're in Insecure Mode — nothing is being written to this log right now, on purpose. That's the vulnerability: without server-side logging, denied attempts and data exposure both go unnoticed. Switch to Secure Mode and repeat an action to see it recorded."
          : 'Every file-access attempt and every blocked chat request is recorded here, including denials — this is what lets you detect misuse after the fact.'}
      </div>
      {log.length === 0 ? (
        <div className="text-xs" style={{ color: T.muted }}>No entries yet.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {[...log].reverse().map((entry, index) => (
            <div key={index} className="flex items-center gap-3 text-xs px-3 py-2 rounded-md" style={{ background: T.panel, border: `1px solid ${T.border}`, fontFamily: T.mono }}>
              <span style={{ color: T.muted, width: 84, flexShrink: 0 }}>{entry.time}</span>
              <span style={{ color: T.accent, width: 96, flexShrink: 0 }}>{entry.role}</span>
              <span style={{ width: 60, flexShrink: 0 }}>{entry.action}</span>
              <span className="truncate" style={{ color: T.text }}>{entry.target}</span>
              <span className="ml-auto px-2 py-0.5 rounded-full" style={{ background: T.panelAlt, color: /denied|blocked/.test(entry.result) ? T.warning : /EXPOSED/.test(entry.result) ? T.critical : T.success }}>
                {entry.result}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PayloadInspector({ mode, role }) {
  const payload = buildPayload(mode, role, fileTree);
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3"><Eye size={16} style={{ color: T.muted }} /><span className="font-medium">Payload Inspector</span></div>
      <div className="text-xs mb-4 px-3 py-2 rounded-md" style={{ background: mode === 'insecure' ? '#2A1917' : '#12231C', border: `1px solid ${mode === 'insecure' ? T.critical : T.success}`, color: mode === 'insecure' ? '#F3D9D5' : '#BFE8D4' }}>
        {mode === 'insecure'
          ? 'This is what actually gets sent to the browser right now. Every field is populated regardless of role — the sidebar lock icons are cosmetic. Anyone with dev tools open can read restricted content directly, no exploit required.'
          : "This is what actually gets sent to the browser right now. Fields the current role isn't cleared for are null — the server never sent that content, so there's nothing to read even with dev tools open."}
      </div>
      <pre className="rounded-md p-4 overflow-x-auto" style={{ background: T.panel, border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 11.5, lineHeight: 1.6, color: T.text }}>
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}
