import { useState, useMemo, type ReactNode } from "react";
import type { ActivityLogEntry, LogCategory, LogSeverity } from "./activityLog";
import { exportLogsToCSV, exportLogsToJSON } from "./activityLog";

interface ActivityLogPageProps {
  logs: ActivityLogEntry[];
  isAdmin: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  onClearLogs: () => void;
  onInjectTestEvent: () => void;
  onToggleRole: () => void;
}

const categoryTones: Record<LogCategory, string> = {
  POINTS: "violet",
  NOMINATION: "warning",
  EVICTION: "danger",
  CAPTAIN: "gold",
  IMMUNITY: "success",
  TASK: "info",
  TIMER: "neutral",
  BROADCAST: "danger",
  CONTESTANT: "info",
  AUTH: "gold",
  SURVEILLANCE: "neutral",
};

const severityBadges: Record<LogSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: "CRITICAL", color: "#ff416c", bg: "rgba(255, 65, 108, 0.15)" },
  danger: { label: "DANGER", color: "#e9435e", bg: "rgba(233, 67, 94, 0.15)" },
  warning: { label: "WARNING", color: "#f5a623", bg: "rgba(245, 166, 35, 0.15)" },
  success: { label: "SUCCESS", color: "#34c98b", bg: "rgba(52, 201, 139, 0.15)" },
  info: { label: "INFO", color: "#48a9f8", bg: "rgba(72, 169, 248, 0.15)" },
};

export function ActivityLogPage({
  logs,
  isAdmin,
  isPaused,
  onTogglePause,
  onClearLogs,
  onInjectTestEvent,
  onToggleRole,
}: ActivityLogPageProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");

  const categories: string[] = [
    "All",
    "POINTS",
    "NOMINATION",
    "EVICTION",
    "CAPTAIN",
    "TASK",
    "BROADCAST",
    "TIMER",
    "AUTH",
    "SURVEILLANCE",
  ];

  const severities: string[] = ["All", "critical", "warning", "success", "info"];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !search ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        (log.target && log.target.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = selectedCategory === "All" || log.category === selectedCategory;
      const matchSeverity = selectedSeverity === "All" || log.severity === selectedSeverity;

      return matchSearch && matchCategory && matchSeverity;
    });
  }, [logs, search, selectedCategory, selectedSeverity]);

  const criticalCount = useMemo(() => logs.filter((l) => l.severity === "critical" || l.severity === "danger").length, [logs]);
  const pointsCount = useMemo(() => logs.filter((l) => l.category === "POINTS").length, [logs]);
  const evictionNomCount = useMemo(() => logs.filter((l) => l.category === "EVICTION" || l.category === "NOMINATION").length, [logs]);

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="access-denied-panel panel">
          <div className="denied-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2>Admin Clearance Required</h2>
          <p className="subtitle">Real-Time Surveillance & Audit Logs are strictly restricted to Big Boss Directors.</p>
          <div className="denied-explanation">
            <p>Your current session is authenticated as <strong>Viewer (Housemate)</strong>. You have read-only surveillance access to public leaderboards and tasks, but internal administrative decisions and telemetries require Executive Admin clearance.</p>
          </div>
          <button className="btn btn-primary" onClick={onToggleRole} style={{ marginTop: "16px" }}>
            Switch to Big Boss Director (Admin) 👑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page activity-log-page">
      <div className="page-heading">
        <div>
          <span>Big Boss Surveillance · Real-Time Audit Log</span>
          <h1>House Activity Stream</h1>
          <p>Live real-time feed of all administrative commands, point adjustments, nominations, evictions, and house telemetries.</p>
        </div>
        <div className="log-header-actions">
          <div className={`live-status-pill ${isPaused ? "paused" : "active"}`}>
            <span className="live-status-dot" />
            <span>{isPaused ? "STREAM PAUSED" : "LIVE FEED ACTIVE"}</span>
          </div>
          <button className={`btn ${isPaused ? "btn-success" : "btn-warning"}`} onClick={onTogglePause}>
            {isPaused ? "▶ Resume Stream" : "⏸ Pause Stream"}
          </button>
          <button className="btn btn-ghost" onClick={onInjectTestEvent} title="Inject simulated event to test live stream">
            ⚡ Test Event
          </button>
          <div className="export-dropdown">
            <button className="btn btn-ghost" onClick={() => exportLogsToCSV(logs)} title="Download CSV">
              📥 CSV
            </button>
            <button className="btn btn-ghost" onClick={() => exportLogsToJSON(logs)} title="Download JSON">
              📥 JSON
            </button>
          </div>
          <button className="btn btn-text-danger" onClick={onClearLogs} title="Clear all log items">
            Clear
          </button>
        </div>
      </div>

      <div className="log-stats-bar">
        <div className="log-stat-card">
          <span className="log-stat-number">{logs.length}</span>
          <span className="log-stat-label">Total Events Logged</span>
        </div>
        <div className="log-stat-card red-stat">
          <span className="log-stat-number">{criticalCount}</span>
          <span className="log-stat-label">High Priority / Evictions</span>
        </div>
        <div className="log-stat-card violet-stat">
          <span className="log-stat-number">{pointsCount}</span>
          <span className="log-stat-label">Points Interventions</span>
        </div>
        <div className="log-stat-card orange-stat">
          <span className="log-stat-number">{evictionNomCount}</span>
          <span className="log-stat-label">Danger Zone Changes</span>
        </div>
      </div>

      <div className="log-toolbar panel">
        <div className="log-search-wrap">
          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
          <input
            type="text"
            placeholder="Search activity by action, contestant, or actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        <div className="log-filters-row">
          <div className="filter-group">
            <span className="filter-label">Category:</span>
            <div className="filter-chips">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={selectedCategory === cat ? "selected" : ""}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Severity:</span>
            <div className="filter-chips">
              {severities.map((sev) => (
                <button
                  key={sev}
                  className={selectedSeverity === sev ? "selected" : ""}
                  onClick={() => setSelectedSeverity(sev)}
                >
                  {sev.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="log-stream panel">
        <div className="stream-header">
          <div className="stream-col-time">Time</div>
          <div className="stream-col-category">Category</div>
          <div className="stream-col-actor">Actor</div>
          <div className="stream-col-desc">Event Description & Impact</div>
          <div className="stream-col-badge">Severity</div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="empty-stream">
            <div className="empty-icon">📡</div>
            <strong>No activity matches current filters</strong>
            <p>Try clearing your search query or selecting a different category.</p>
          </div>
        ) : (
          <div className="stream-body">
            {filteredLogs.map((entry) => {
              const sev = severityBadges[entry.severity] || severityBadges.info;
              const isCrit = entry.severity === "critical" || entry.severity === "danger";
              return (
                <div key={entry.id} className={`stream-row ${isCrit ? "critical-row" : ""}`}>
                  <div className="stream-col-time">
                    <span className="time-code">{entry.timestamp}</span>
                    <span className="time-ago">{entry.timeAgo}</span>
                  </div>

                  <div className="stream-col-category">
                    <span className={`category-tag tag-${categoryTones[entry.category] || "neutral"}`}>
                      {entry.category}
                    </span>
                  </div>

                  <div className="stream-col-actor">
                    <span className="actor-badge">
                      {entry.actor.includes("Admin") || entry.actor.includes("Director") ? "👑 " : "⚙️ "}
                      {entry.actor}
                    </span>
                  </div>

                  <div className="stream-col-desc">
                    <div className="event-headline">
                      <strong>{entry.action}</strong>
                      {entry.target && <span className="target-pill">Target: {entry.target}</span>}
                    </div>
                    <p className="event-detail">{entry.details}</p>
                  </div>

                  <div className="stream-col-badge">
                    <span
                      className="severity-pill"
                      style={{ color: sev.color, backgroundColor: sev.bg, borderColor: sev.color }}
                    >
                      {sev.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function LiveActivityWidget({
  logs,
  onViewAll,
}: {
  logs: ActivityLogEntry[];
  onViewAll: () => void;
}) {
  const recent = logs.slice(0, 4);

  return (
    <div className="panel live-activity-widget">
      <div className="widget-header">
        <div className="widget-title">
          <span className="live-pulse-dot" />
          <div>
            <h3>Live Activity Stream</h3>
            <p>Surveillance feed in real time</p>
          </div>
        </div>
        <button className="view-all-link" onClick={onViewAll}>
          View Admin Log →
        </button>
      </div>

      <div className="widget-list">
        {recent.map((entry) => {
          const isCrit = entry.severity === "critical" || entry.severity === "danger";
          return (
            <div key={entry.id} className={`widget-row ${isCrit ? "widget-crit" : ""}`}>
              <div className="widget-time">{entry.timestamp}</div>
              <div className="widget-content">
                <strong>{entry.action}</strong>
                <p>{entry.details}</p>
              </div>
              <span className={`widget-tag tag-${categoryTones[entry.category] || "neutral"}`}>
                {entry.category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
