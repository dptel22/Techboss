import { useState, useMemo } from "react";
import type { HouseNotification, NotificationCategory, NotificationSeverity } from "./notifications";

interface NotificationDrawerProps {
  notifications: HouseNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDismiss: (id: string) => void;
  onSimulateEvent: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function VolumeIcon({ enabled, size = 16 }: { enabled: boolean; size?: number }) {
  if (!enabled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function ZapIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function CategoryIcon({ category, severity }: { category: NotificationCategory; severity: NotificationSeverity }) {
  const size = 16;
  if (severity === "urgent") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  switch (category) {
    case "POINTS":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
          <path d="M7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4" />
        </svg>
      );
    case "TASK":
    case "TIMER":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 16 14" />
        </svg>
      );
    case "BROADCAST":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11v2h4l5 4V7l-5 4H3Z" />
          <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
        </svg>
      );
    case "CAPTAIN":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 6 4 5 5-7 5 7 4-5-2 12H5L3 6Z" />
          <path d="M5 21h14" />
        </svg>
      );
    default:
      return <BellIcon size={size} />;
  }
}

export function NotificationDrawer({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDismiss,
  onSimulateEvent,
  soundEnabled,
  onToggleSound,
}: NotificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "urgent" | "tasks">("all");

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const urgentCount = useMemo(
    () => notifications.filter((n) => n.severity === "urgent").length,
    [notifications]
  );
  const taskCount = useMemo(
    () => notifications.filter((n) => n.category === "TASK" || n.category === "TIMER").length,
    [notifications]
  );

  const filtered = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "urgent":
        return notifications.filter((n) => n.severity === "urgent");
      case "tasks":
        return notifications.filter((n) => n.category === "TASK" || n.category === "TIMER");
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="notification-backdrop" onClick={onClose}>
      <aside className="notification-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="notification-header">
          <h3>
            <BellIcon size={19} />
            <span>House Event Feed</span>
            {unreadCount > 0 && (
              <span className="chip chip-danger" style={{ fontSize: "10px", padding: "2px 7px" }}>
                {unreadCount} new
              </span>
            )}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="icon-button"
              onClick={onToggleSound}
              title={soundEnabled ? "Mute notification chimes" : "Enable notification chimes"}
              aria-label="Toggle chimes"
            >
              <VolumeIcon enabled={soundEnabled} size={16} />
            </button>
            <button className="icon-button" onClick={onClose} aria-label="Close notification panel">
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="notification-tabs">
          <button
            className={`notification-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All ({notifications.length})
          </button>
          <button
            className={`notification-tab-btn ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`notification-tab-btn ${activeTab === "urgent" ? "active" : ""}`}
            onClick={() => setActiveTab("urgent")}
          >
            Urgent ({urgentCount})
          </button>
          <button
            className={`notification-tab-btn ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks ({taskCount})
          </button>
        </div>

        {/* Action bar */}
        <div className="notification-actions-bar">
          <span>{filtered.length} event{filtered.length === 1 ? "" : "s"} listed</span>
          <div style={{ display: "flex", gap: "12px" }}>
            {unreadCount > 0 && (
              <button className="notification-action-link" onClick={onMarkAllAsRead}>
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className="notification-action-link"
                onClick={onClearAll}
                style={{ color: "var(--red)" }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="notification-list">
          {filtered.length === 0 ? (
            <div className="notification-empty">
              <div style={{ display: "flex", justifyContent: "center", opacity: 0.5, marginBottom: "8px" }}>
                <BellIcon size={40} />
              </div>
              <strong>No notifications here</strong>
              <p>House actions and Big Boss updates will appear here automatically.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`notification-item severity-${item.severity} ${!item.read ? "unread" : ""}`}
                onClick={() => onMarkAsRead(item.id)}
              >
                <div className={`notification-icon-wrap notification-icon-${item.severity}`}>
                  <CategoryIcon category={item.category} severity={item.severity} />
                </div>
                <div className="notification-content">
                  <div className="notification-top-row">
                    <span className="notification-title">{item.title}</span>
                    <span className="notification-time">{item.timestamp}</span>
                  </div>
                  <p className="notification-message">{item.message}</p>
                  <span className="notification-category-tag">{item.category}</span>
                </div>
                <button
                  className="notification-dismiss-btn"
                  title="Dismiss notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(item.id);
                  }}
                >
                  <CloseIcon size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer with simulation trigger */}
        <div className="notification-footer">
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "8px" }}
            onClick={onSimulateEvent}
          >
            <ZapIcon size={15} />
            <span>Simulate Live House Drama</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
