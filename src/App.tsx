import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ActivityLogEntry } from "./activityLog";
import { initialActivityLogs, simulatedSurveillanceEvents, formatNow } from "./activityLog";
import { ActivityLogPage, LiveActivityWidget } from "./ActivityLogComponents";
import type { HouseNotification, NotificationCategory, NotificationSeverity } from "./notifications";
import { initialNotifications, playNotificationSound } from "./notifications";
import { NotificationDrawer } from "./NotificationComponents";

type Team = "Alpha" | "Beta" | "Gamma" | "Delta";
type Status = "Active" | "Nominated" | "Immune" | "Captain" | "Evicted";
type Page = "Dashboard" | "Contestants" | "Tasks" | "Nominations" | "Announcements" | "Activity Log" | "Components";
type Role = "admin" | "user";

type AuthUser = {
  username: string;
  name: string;
  role: Role;
  title: string;
  avatarSeed: string;
};

const defaultUsers: Record<Role, AuthUser & { password: string }> = {
  admin: {
    username: "admin",
    name: "Big Boss Director",
    role: "admin",
    title: "Executive Admin",
    avatarSeed: "BB",
    password: "admin",
  },
  user: {
    username: "user",
    name: "Housemate Viewer",
    role: "user",
    title: "Viewer / Housemate",
    avatarSeed: "HM",
    password: "user",
  },
};

type Contestant = {
  id: number;
  name: string;
  team: Team;
  points: number;
  status: Status;
};

const seedContestants: Contestant[] = [
  { id: 1, name: "Aarav", team: "Alpha", points: 120, status: "Active" },
  { id: 2, name: "Meera", team: "Beta", points: 95, status: "Active" },
  { id: 3, name: "Rohan", team: "Gamma", points: 110, status: "Immune" },
  { id: 4, name: "Sana", team: "Delta", points: 80, status: "Nominated" },
  { id: 5, name: "Kabir", team: "Alpha", points: 70, status: "Nominated" },
  { id: 6, name: "Isha", team: "Beta", points: 130, status: "Captain" },
  { id: 7, name: "Dev", team: "Gamma", points: 60, status: "Nominated" },
  { id: 8, name: "Anaya", team: "Delta", points: 100, status: "Active" },
  { id: 9, name: "Vikram", team: "Alpha", points: 85, status: "Active" },
  { id: 10, name: "Tara", team: "Beta", points: 90, status: "Active" },
];

const palette = ["coral", "blue", "violet", "teal", "orange", "pink"];

const paths: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  check: <><polyline points="20 6 9 17 4 12" /></>,
  alert: <><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><polyline points="9 12 11 14 15 10" /></>,
  crown: <><path d="m3 6 4 5 5-7 5 7 4-5-2 12H5L3 6Z" /><path d="M5 21h14" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><line x1="12" y1="3" x2="12" y2="5" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H3v2a4 4 0 0 0 4 4M17 6h4v2a4 4 0 0 1-4 4" /></>,
  speaker: <><path d="M3 11v2h4l5 4V7l-5 4H3Z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></>,
  tasks: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3v4h6V3M8 12l2 2 4-4M8 18h8" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
  search: <><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.5" y2="16.5" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  play: <><polygon points="7 4 20 12 7 20 7 4" /></>,
  pause: <><line x1="9" y1="5" x2="9" y2="19" /><line x1="15" y1="5" x2="15" y2="19" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><polyline points="3 3 3 8 8 8" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  close: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  sliders: <><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></>,
  activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.grid}</svg>;
}

function Button({ children, variant = "default", icon, onClick, disabled, className = "" }: { children: ReactNode; variant?: string; icon?: string; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button className={`btn btn-${variant} ${className}`} onClick={onClick} disabled={disabled}>{icon && <Icon name={icon} size={16} />}<span>{children}</span></button>;
}

function Avatar({ name, size = "md", index = 0 }: { name: string; size?: "sm" | "md" | "lg" | "xl"; index?: number }) {
  return <div className={`avatar avatar-${size} avatar-${palette[index % palette.length]}`}>{name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</div>;
}

function Chip({ children, tone = "neutral", icon }: { children: ReactNode; tone?: string; icon?: string }) {
  return <span className={`chip chip-${tone}`}>{icon && <Icon name={icon} size={13} />}{children}</span>;
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

const statusTone: Record<Status, string> = { Active: "info", Nominated: "warning", Immune: "success", Captain: "gold", Evicted: "danger" };
const teamTone: Record<Team, string> = { Alpha: "danger", Beta: "violet", Gamma: "info", Delta: "success" };

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function LoginPage({ onLogin }: { onLogin: (u: AuthUser) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    if (cleanUser === "admin" && (cleanPass === "admin" || cleanPass === "admin123" || !cleanPass)) {
      onLogin(defaultUsers.admin);
    } else if (cleanUser === "user" && (cleanPass === "user" || cleanPass === "user123" || !cleanPass)) {
      onLogin(defaultUsers.user);
    } else {
      setError("Invalid credentials. Try 'admin' or 'user'");
    }
  };

  return (
    <div className="login-screen-wrap">
      <div className="login-card">
        <div className="login-brand-eye">
          <Icon name="eye" size={32} />
        </div>
        <h1>TechBoss Access Portal</h1>
        <p className="subtitle">Reality Command Center · Role-Based Security</p>

        <div className="quick-login-grid">
          <button className="quick-btn admin-btn" type="button" onClick={() => onLogin(defaultUsers.admin)}>
            <strong>👑 Admin Access</strong>
            <small>Full control · Modify points, evict, tasks, timer</small>
          </button>
          <button className="quick-btn user-btn" type="button" onClick={() => onLogin(defaultUsers.user)}>
            <strong>👤 User / Viewer</strong>
            <small>Read-only · Live leaderboard, stats, danger zone</small>
          </button>
        </div>

        <div className="login-divider">or sign in manually</div>

        {error && <div className="login-error" style={{ marginBottom: "14px" }}>{error}</div>}

        <form className="login-form" onSubmit={handleManualLogin}>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              placeholder="admin or user"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="admin or user"
              required
            />
          </label>
          <Button variant="primary" className="w-full justify-center" style={{ marginTop: "6px" }}>
            Sign In to Command Center
          </Button>
        </form>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("techboss_user");
    if (saved === "admin" || saved === "user") {
      return defaultUsers[saved as Role];
    }
    return defaultUsers.admin;
  });
  const [page, setPage] = useState<Page>("Dashboard");
  const [contestants, setContestants] = useState(seedContestants);
  const [modal, setModal] = useState<"announcement" | "contestant" | "evict" | "task" | null>(null);
  const [selected, setSelected] = useState<Contestant | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [toast, setToast] = useState<string | null>("Control center synchronized");
  const [timer, setTimer] = useState(24 * 60 + 36);
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused" | "done">("idle");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [evictedResult, setEvictedResult] = useState<string | null>(null);

  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => {
    const saved = localStorage.getItem("techboss_activity_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return initialActivityLogs;
  });
  const [isLogPaused, setIsLogPaused] = useState(false);

  const [notifications, setNotifications] = useState<HouseNotification[]>(() => {
    const saved = localStorage.getItem("techboss_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return initialNotifications;
  });
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    localStorage.setItem("techboss_notifications", JSON.stringify(notifications.slice(0, 50)));
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const dispatchNotification = (
    title: string,
    message: string,
    category: NotificationCategory,
    severity: NotificationSeverity = "info"
  ) => {
    const newNotif: HouseNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      severity,
      title,
      message,
      timestamp: "Just now",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
    if (soundEnabled) {
      playNotificationSound(severity);
    }
  };

  const handleSimulateLiveDrama = () => {
    const scenarios: { title: string; message: string; category: NotificationCategory; severity: NotificationSeverity }[] = [
      {
        title: "🚨 Emergency Evacuation Drill",
        message: "Big Boss sounds the alarm: all contestants must gather immediately in the garden area.",
        category: "BROADCAST",
        severity: "urgent",
      },
      {
        title: "⚡ Secret Mission Discovered",
        message: "Anaya was spotted receiving a secret instruction envelope from the confession box.",
        category: "SURVEILLANCE",
        severity: "warning",
      },
      {
        title: "🏆 Luxury Budget Credited",
        message: "Team Beta executed the ration storage protocol without violations: +35 points awarded.",
        category: "POINTS",
        severity: "success",
      },
      {
        title: "🔥 Nomination Confrontation",
        message: "Tense argument between Dev and Kabir following secret ballot nomination results.",
        category: "NOMINATION",
        severity: "warning",
      },
      {
        title: "📢 Daytime Sleeping Violation",
        message: "Microphone sensor detected unauthorized daytime slumber. House total docked 15 points.",
        category: "BROADCAST",
        severity: "urgent",
      },
    ];
    const chosen = scenarios[Math.floor(Math.random() * scenarios.length)];
    dispatchNotification(chosen.title, chosen.message, chosen.category, chosen.severity);
    setToast(chosen.title);
    addLog({
      category: chosen.category as any,
      severity: chosen.severity === "urgent" ? "critical" : chosen.severity === "warning" ? "warning" : "info",
      actor: "Big Boss Production",
      action: chosen.title,
      details: chosen.message,
      target: "House Telemetry",
    });
  };

  useEffect(() => {
    localStorage.setItem("techboss_activity_logs", JSON.stringify(logs.slice(0, 100)));
  }, [logs]);

  const addLog = (entry: Omit<ActivityLogEntry, "id" | "timestamp" | "timeAgo">) => {
    const newEntry: ActivityLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formatNow(),
      timeAgo: "Just now",
      ...entry,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 99)]);
  };

  useEffect(() => {
    if (isLogPaused) return;
    const interval = window.setInterval(() => {
      const randomEvent = simulatedSurveillanceEvents[Math.floor(Math.random() * simulatedSurveillanceEvents.length)];
      addLog({
        category: randomEvent.category,
        severity: randomEvent.severity,
        actor: randomEvent.actor,
        action: randomEvent.action,
        details: randomEvent.details,
        target: randomEvent.target,
      });
    }, 9000);
    return () => window.clearInterval(interval);
  }, [isLogPaused]);

  useEffect(() => {
    if (timerState !== "running") return;
    const id = window.setInterval(() => setTimer((value) => {
      if (value <= 1) {
        setTimerState("done");
        dispatchNotification(
          "Task Timer Finished",
          "The challenge countdown timer has reached zero! All house activities must cease immediately.",
          "TIMER",
          "urgent"
        );
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [timerState, soundEnabled]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={(u) => {
          setCurrentUser(u);
          localStorage.setItem("techboss_user", u.role);
          setToast(`Authenticated as ${u.name} (${u.role.toUpperCase()})`);
          addLog({
            category: "AUTH",
            severity: "info",
            actor: u.name,
            action: "Portal Authentication",
            details: `Logged into Command Center with ${u.title} privileges.`,
            target: u.role,
          });
        }}
      />
    );
  }

  const isAdmin = currentUser.role === "admin";

  const handleLogout = () => {
    addLog({
      category: "AUTH",
      severity: "info",
      actor: currentUser.name,
      action: "Sign Out",
      details: `${currentUser.name} signed out from Command Center.`,
      target: currentUser.username,
    });
    setCurrentUser(null);
    localStorage.removeItem("techboss_user");
    setToast("Signed out from Command Center");
  };

  const handleToggleRole = () => {
    const nextRole: Role = currentUser.role === "admin" ? "user" : "admin";
    const nextUser = defaultUsers[nextRole];
    setCurrentUser(nextUser);
    localStorage.setItem("techboss_user", nextRole);
    setToast(`Switched active role to ${nextUser.title} (${nextRole.toUpperCase()})`);
    addLog({
      category: "AUTH",
      severity: "info",
      actor: nextUser.name,
      action: "Active Role Switched",
      details: `Session role shifted to ${nextUser.title} (${nextRole.toUpperCase()}).`,
      target: nextRole,
    });
  };

  const active = contestants.filter((c) => c.status !== "Evicted");
  const sorted = [...active].sort((a, b) => b.points - a.points);
  const nominated = active.filter((c) => c.status === "Nominated");
  const filtered = contestants.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) && (filter === "All" || c.status === filter)
  );

  const adjustPoints = (id: number, amount: number) => {
    if (!isAdmin) {
      setToast("Action denied: Admin privileges required to modify points");
      return;
    }
    const targetC = contestants.find((c) => c.id === id);
    setContestants((items) => items.map((c) => c.id === id ? { ...c, points: c.points + amount } : c));
    setToast(`${amount > 0 ? "+" : ""}${amount} points applied`);
    addLog({
      category: "POINTS",
      severity: amount > 0 ? "success" : "warning",
      actor: currentUser.name,
      action: amount > 0 ? "Points Awarded" : "Points Deducted",
      details: `${amount > 0 ? "+" : ""}${amount} points applied to ${targetC?.name || "Contestant"} (Team ${targetC?.team || ""}).`,
      target: targetC?.name,
    });
    dispatchNotification(
      amount > 0 ? "Points Awarded" : "Points Deducted",
      `${amount > 0 ? "+" : ""}${amount} points applied to ${targetC?.name || "Contestant"} (Team ${targetC?.team || ""}).`,
      "POINTS",
      amount > 0 ? "success" : "warning"
    );
  };

  const evict = () => {
    if (!isAdmin) {
      setToast("Action denied: Admin privileges required to evict");
      return;
    }
    if (!selected) return;
    setContestants((items) => items.map((c) => c.id === selected.id ? { ...c, status: "Evicted" } : c));
    setModal(null);
    setEvictedResult(selected.name);
    addLog({
      category: "EVICTION",
      severity: "critical",
      actor: currentUser.name,
      action: "Official Eviction Executed",
      details: `CRITICAL: ${selected.name} has been officially evicted from the Tech House and archived.`,
      target: selected.name,
    });
    dispatchNotification(
      `Official Eviction: ${selected.name}`,
      `${selected.name} has been officially evicted from the Tech House and archived.`,
      "EVICTION",
      "urgent"
    );
  };

  const nominate = (contestant: Contestant) => {
    if (!isAdmin) {
      setToast("Action denied: Admin privileges required to nominate");
      return;
    }
    if (contestant.status === "Immune") {
      setToast("Cannot nominate: contestant has immunity");
      return;
    }
    setContestants((items) => items.map((c) => c.id === contestant.id ? { ...c, status: "Nominated" } : c));
    setToast(`${contestant.name} moved to the Danger Zone`);
    addLog({
      category: "NOMINATION",
      severity: "warning",
      actor: currentUser.name,
      action: "Danger Zone Nomination",
      details: `${contestant.name} (Team ${contestant.team}) nominated for eviction and placed in Danger Zone.`,
      target: contestant.name,
    });
    dispatchNotification(
      `Nominated: ${contestant.name}`,
      `${contestant.name} has entered the Danger Zone for eviction this week.`,
      "NOMINATION",
      "warning"
    );
  };

  const handleSetTimerState = (st: "idle" | "running" | "paused" | "done") => {
    setTimerState(st);
    addLog({
      category: "TIMER",
      severity: st === "done" ? "warning" : "info",
      actor: currentUser.name,
      action: "Challenge Timer " + (st === "running" ? "Started" : st === "paused" ? "Paused" : st === "done" ? "Expired" : "Reset"),
      details: `Challenge countdown timer set to ${st}.`,
      target: "Challenge Clock",
    });
  };

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        open={sidebarOpen}
        close={() => setSidebarOpen(false)}
        user={currentUser}
        onLogout={handleLogout}
      />
      <div className="workspace">
        <Topbar
          openMenu={() => setSidebarOpen(true)}
          announce={() => setModal("announcement")}
          user={currentUser}
          onLogout={handleLogout}
          onToggleRole={handleToggleRole}
          unreadCount={unreadCount}
          onOpenNotifications={() => setNotificationDrawerOpen(true)}
        />
        <main>
          {page === "Dashboard" && (
            <Dashboard
              contestants={contestants}
              sorted={sorted}
              nominated={nominated}
              setPage={setPage}
              adjustPoints={adjustPoints}
              timer={timer}
              timerState={timerState}
              setTimerState={handleSetTimerState}
              setTimer={setTimer}
              onEvict={(c) => { setSelected(c); setModal("evict"); }}
              user={currentUser}
              onToggleRole={handleToggleRole}
              logs={logs}
            />
          )}
          {page === "Contestants" && (
            <ContestantsPage
              contestants={filtered}
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              adjustPoints={adjustPoints}
              add={() => setModal("contestant")}
              nominate={nominate}
              evict={(c) => { setSelected(c); setModal("evict"); }}
              isAdmin={isAdmin}
            />
          )}
          {page === "Tasks" && (
            <TasksPage
              timer={timer}
              timerState={timerState}
              setTimerState={handleSetTimerState}
              setTimer={setTimer}
              addTask={() => setModal("task")}
              isAdmin={isAdmin}
            />
          )}
          {page === "Nominations" && (
            <NominationsPage
              contestants={active}
              nominated={nominated}
              nominate={nominate}
              remove={(id) => {
                const c = contestants.find((item) => item.id === id);
                setContestants((items) => items.map((item) => item.id === id ? { ...item, status: "Active" } : item));
                if (c) {
                  addLog({
                    category: "NOMINATION",
                    severity: "info",
                    actor: currentUser.name,
                    action: "Nomination Revoked",
                    details: `${c.name} was saved from the Danger Zone.`,
                    target: c.name,
                  });
                }
              }}
              evict={(c) => { setSelected(c); setModal("evict"); }}
              isAdmin={isAdmin}
            />
          )}
          {page === "Announcements" && (
            <AnnouncementsPage
              announce={() => setModal("announcement")}
              isAdmin={isAdmin}
            />
          )}
          {page === "Activity Log" && (
            <ActivityLogPage
              logs={logs}
              isAdmin={isAdmin}
              isPaused={isLogPaused}
              onTogglePause={() => setIsLogPaused((p) => !p)}
              onClearLogs={() => setLogs([])}
              onInjectTestEvent={() => {
                const randomEvent = simulatedSurveillanceEvents[Math.floor(Math.random() * simulatedSurveillanceEvents.length)];
                addLog({
                  category: randomEvent.category,
                  severity: randomEvent.severity,
                  actor: `${currentUser.name} (Manual Test)`,
                  action: `[TEST] ${randomEvent.action}`,
                  details: randomEvent.details,
                  target: randomEvent.target,
                });
                setToast("Test surveillance event injected into live stream");
              }}
              onToggleRole={handleToggleRole}
            />
          )}
          {page === "Components" && <ComponentsPage />}
        </main>
      </div>
      <MobileNav page={page} setPage={setPage} />
      {modal === "announcement" && (
        <AnnouncementModal
          value={announcement}
          setValue={setAnnouncement}
          close={() => setModal(null)}
          broadcast={() => {
            const text = announcement || "Attention housemates. Please gather in the living room.";
            setBroadcast(text);
            setModal(null);
            addLog({
              category: "BROADCAST",
              severity: "critical",
              actor: currentUser.name,
              action: "Emergency Broadcast Dispatched",
              details: `House-wide audio/visual takeover dispatched: "${text}"`,
              target: "All Housemates",
            });
            dispatchNotification(
              "Big Boss Announcement",
              text,
              "BROADCAST",
              "urgent"
            );
          }}
        />
      )}
      {modal === "contestant" && (
        <SimpleModal
          title="Add contestant"
          close={() => setModal(null)}
          confirmLabel="Add contestant"
          onConfirm={() => {
            setModal(null);
            setToast("New contestant added");
            addLog({
              category: "CONTESTANT",
              severity: "info",
              actor: currentUser.name,
              action: "New Contestant Added",
              details: "New contestant registered into the house roster.",
            });
            dispatchNotification(
              "New Contestant Enrolled",
              "A new contestant has been admitted to the house roster.",
              "SYSTEM",
              "info"
            );
          }}
        >
          <Field label="Full name" placeholder="Enter contestant name" />
          <Field label="Team" placeholder="Select team" />
          <Field label="Starting points" placeholder="0" />
        </SimpleModal>
      )}
      {modal === "task" && (
        <SimpleModal
          title="Assign new task"
          close={() => setModal(null)}
          confirmLabel="Assign task"
          onConfirm={() => {
            setModal(null);
            setToast("Task assigned successfully");
            addLog({
              category: "TASK",
              severity: "info",
              actor: currentUser.name,
              action: "Task Assigned",
              details: "New challenge task created and assigned to housemates.",
            });
            dispatchNotification(
              "New Task Assigned",
              "A new challenge task has been scheduled on the house board.",
              "TASK",
              "info"
            );
          }}
        >
          <Field label="Task title" placeholder="Enter task title" />
          <Field label="Assign to" placeholder="Choose team or contestants" />
          <div className="field-row">
            <Field label="Reward points" placeholder="50" />
            <Field label="Duration" placeholder="30 min" />
          </div>
        </SimpleModal>
      )}
      {modal === "evict" && selected && <EvictionModal contestant={selected} close={() => setModal(null)} confirm={evict} />}
      {broadcast && <AnnouncementOverlay message={broadcast} dismiss={() => setBroadcast("")} />}
      {evictedResult && <EvictionResult name={evictedResult} close={() => setEvictedResult(null)} />}
      {toast && <div className="toast"><span className="toast-icon"><Icon name="check" size={15} /></span><div><strong>Big Boss update</strong><p>{toast}</p></div><button className="icon-button" onClick={() => setToast(null)} aria-label="Close"><Icon name="close" size={16} /></button></div>}
      <NotificationDrawer
        notifications={notifications}
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        onMarkAsRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        onMarkAllAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClearAll={() => setNotifications([])}
        onDismiss={(id) =>
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
        onSimulateEvent={handleSimulateLiveDrama}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />
    </div>
  );
}

function Sidebar({ page, setPage, open, close, user, onLogout }: {
  page: Page; setPage: (p: Page) => void; open: boolean; close: () => void;
  user: AuthUser; onLogout: () => void;
}) {
  const items: { label: Page; icon: string; adminOnly?: boolean }[] = [
    { label: "Dashboard", icon: "grid" },
    { label: "Contestants", icon: "users" },
    { label: "Tasks", icon: "tasks" },
    { label: "Nominations", icon: "target" },
    { label: "Announcements", icon: "speaker" },
    { label: "Activity Log", icon: "activity", adminOnly: true },
    { label: "Components", icon: "sliders" },
  ];
  return <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
    <div className="brand"><div><strong>bigboss</strong><span>command center</span></div><button className="collapse-button"><Icon name="close" size={14} /></button></div>
    <div style={{ padding: "12px 24px 0" }}>
      <span className={`role-badge ${user.role}`}>
        {user.role === "admin" ? "👑 Admin Access" : "👤 Viewer Access"}
      </span>
    </div>
    <nav>
      <span className="nav-label">General</span>
      {items.slice(0, 2).map((item) => (
        <button key={item.label} className={page === item.label ? "active" : ""} onClick={() => { setPage(item.label); close(); }}>
          <Icon name={item.icon} /><span>{item.label}</span>
        </button>
      ))}
      <span className="nav-label">House tools</span>
      {items.slice(2).map((item) => {
        const isLocked = item.adminOnly && user.role !== "admin";
        return (
          <button
            key={item.label}
            className={`${page === item.label ? "active" : ""} ${isLocked ? "nav-locked" : ""}`}
            onClick={() => { setPage(item.label); close(); }}
            title={isLocked ? "Admin Clearance Required" : undefined}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
            {item.label === "Nominations" && <b>3</b>}
            {item.label === "Activity Log" && <span className="live-dot" style={{ marginLeft: "auto", width: "6px", height: "6px" }} />}
          </button>
        );
      })}
    </nav>
    <div className="side-status"><span className="live-dot" /><div><strong>House systems</strong><small>All systems operational</small></div></div>
    <button className="side-logout" onClick={onLogout}><Icon name="logout" /><span>Sign out ({user.username})</span></button>
  </aside>;
}

function Topbar({
  openMenu,
  announce,
  user,
  onLogout,
  onToggleRole,
  unreadCount,
  onOpenNotifications,
}: {
  openMenu: () => void;
  announce: () => void;
  user: AuthUser;
  onLogout: () => void;
  onToggleRole: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
}) {
  return (
    <header className="topbar">
      <button className="menu-button" onClick={openMenu}>
        <Icon name="sliders" />
      </button>
      <div className="global-search">
        <button>
          <Icon name="search" />
        </button>
        <input placeholder="Search the house..." />
        <div>
          <span>Contestants</span>
          <span>Tasks</span>
          <span>Announcements</span>
        </div>
      </div>
      <div className="top-actions">
        <span className={`role-badge ${user.role}`}>
          {user.role === "admin" ? "👑 ADMIN" : "👤 VIEWER"}
        </span>
        <button className="role-toggle-btn" onClick={onToggleRole} title="Quick Switch Role">
          <Icon name="sliders" size={13} />
          <span>Switch to {user.role === "admin" ? "User" : "Admin"}</span>
        </button>
        {user.role === "admin" && (
          <button className="top-circle" onClick={announce} title="Make Announcement">
            <Icon name="speaker" />
          </button>
        )}
        <button
          className="top-circle notification-bell-btn"
          onClick={onOpenNotifications}
          title="Event Notifications"
          aria-label="Event Notifications"
        >
          <Icon name="bell" />
          {unreadCount > 0 && (
            <span className="notification-count-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button className="top-circle profile-circle" title={`${user.name} (${user.role})`}>
          {user.avatarSeed}
        </button>
        <button className="top-circle" onClick={onLogout} title="Sign Out">
          <Icon name="logout" />
        </button>
      </div>
    </header>
  );
}

function Dashboard({ contestants, sorted, nominated, setPage, adjustPoints, timer, timerState, setTimerState, setTimer, onEvict, user, onToggleRole, logs }: {
  contestants: Contestant[]; sorted: Contestant[]; nominated: Contestant[]; setPage: (p: Page) => void; adjustPoints: (id: number, amount: number) => void;
  timer: number; timerState: string; setTimerState: (s: "idle" | "running" | "paused" | "done") => void; setTimer: (n: number) => void; onEvict: (c: Contestant) => void;
  user: AuthUser; onToggleRole: () => void; logs: ActivityLogEntry[];
}) {
  const [focused, setFocused] = useState(sorted[0]);
  const isAdmin = user.role === "admin";
  return <div className="page dashboard-page">
    <div className="dashboard-greeting">
      <span>Day 14 · Live house · {user.title}</span>
      <h1>{isAdmin ? "Good evening, Big Boss" : "Welcome, Housemate"}</h1>
      <p>{activeCount(contestants)} contestants in the house. {nominated.length} are in the danger zone. 1 task is running.</p>
    </div>

    {!isAdmin && (
      <div className="role-banner">
        <div className="role-banner-text">
          <div className="role-banner-icon">
            <Icon name="eye" size={18} />
          </div>
          <div>
            <strong>Viewer Surveillance Mode Active</strong>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
              You are browsing in read-only surveillance mode. Point modifications, nominations, captaincy, and evictions require Big Boss Admin privileges.
            </p>
          </div>
        </div>
        <button className="role-toggle-btn" onClick={onToggleRole}>
          Switch to Admin Mode 👑
        </button>
      </div>
    )}

    <div className="editorial-layout">
      <div className="editorial-main">
        <div className="pastel-stats">
          <Panel className="editorial-card contestants-stat"><Decor shape="plus" /><h2>Contestants:</h2><div className="three-stats"><Metric value={activeCount(contestants)} label="Active" /><Metric value={nominated.length} label="Nominated" /><Metric value={contestants.filter((c) => c.status === "Evicted").length} label="Evicted" /></div><div className="bar-chart">{sorted.map((c, i) => <i key={c.id} className={`${c.status === "Nominated" ? "outlined" : ""} ${i === 0 ? "top-bar" : ""}`} style={{ height: `${28 + c.points / 3}px` }} />)}</div></Panel>
          <Panel className="editorial-card points-stat"><Decor shape="eye" /><h2>Points trend:</h2><div className="three-stats"><Metric value="Isha" label="Highest" /><Metric value="94" label="Average" /><Metric value="940" label="Total" /></div><div className="line-chart"><svg viewBox="0 0 340 74" preserveAspectRatio="none"><path d="M0 58 C45 57 57 20 102 35 S174 65 211 35 S284 8 340 23" /><line x1="285" y1="0" x2="285" y2="74" /><circle cx="285" cy="18" r="5" /></svg></div></Panel>
          <Panel className="editorial-card immunity-stat"><Decor shape="shield" /><h2>Immunity:</h2><div className="three-stats"><Metric value="1" label="Protected" /><Metric value="Rohan" label="Immune" /><Metric value="Isha" label="Captain" /></div><p>Protection remains active until the next nomination cycle.</p></Panel>
          <Panel className="editorial-card tasks-stat"><Decor shape="burst" /><h2>Tasks:</h2><div className="three-stats"><Metric value="5" label="Completed" /><Metric value="1" label="Running" /><Metric value="2" label="Pending" /></div><p>Bridge Builder is currently in progress for Team Alpha.</p></Panel>
        </div>
        <div className="leader-detail-grid">
          <Panel className="editorial-leaderboard"><SectionTitle title="Leaderboard" action={<button className="black-pill">Today <Icon name="more" size={14} /></button>} /><div className="editorial-leader-list">{sorted.slice(0, 7).map((c, i) => <button className={focused.id === c.id ? "selected" : ""} onClick={() => setFocused(c)} key={c.id}><span className="rank-number">{i + 1}</span><Avatar name={c.name} size="sm" index={c.id} /><span className="row-copy"><strong>{c.name}</strong><small>Team {c.team}</small></span><span className="row-status">{c.status === "Captain" && <Icon name="crown" size={15} />}{c.status === "Immune" && <Icon name="shield" size={15} />}{c.status === "Nominated" && <Icon name="alert" size={15} />}</span><b className={`points-pill place-${i + 1}`}>{c.points} pts</b></button>)}</div></Panel>
          <ContestantDetails contestant={focused} adjustPoints={adjustPoints} onEvict={onEvict} isAdmin={isAdmin} />
        </div>
        <DangerZone nominees={nominated} onEvict={onEvict} isAdmin={isAdmin} />
      </div>
      <aside className="dashboard-rail">
        <Timer timer={timer} state={timerState} setState={setTimerState} reset={() => { setTimer(24 * 60 + 36); setTimerState("idle"); }} isAdmin={isAdmin} />
        <div className="rail-buttons">
          {isAdmin ? (
            <Button variant="default" icon="speaker">Make announcement</Button>
          ) : (
            <span className="admin-lock-tag"><Icon name="alert" size={12} /> Announcements Admin Only</span>
          )}
          <button className="refresh-button"><Icon name="reset" /></button>
        </div>
        <LiveActivityWidget logs={logs} onViewAll={() => setPage("Activity Log")} />
        <Timeline />
      </aside>
    </div>
  </div>;
}

function activeCount(contestants: Contestant[]) {
  return contestants.filter((c) => c.status !== "Evicted").length;
}

function Metric({ value, label }: { value: ReactNode; label: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function Decor({ shape }: { shape: string }) {
  return <div className={`decor decor-${shape}`}>{shape === "eye" && <Icon name="eye" size={62} />}{shape === "shield" && <Icon name="shield" size={66} />}{shape === "triangle" && <Icon name="alert" size={120} />}</div>;
}

function ContestantDetails({ contestant, adjustPoints, onEvict, isAdmin }: {
  contestant: Contestant; adjustPoints: (id: number, amount: number) => void; onEvict: (c: Contestant) => void; isAdmin: boolean;
}) {
  return <div className="detail-wrap"><Panel className="contestant-details"><div className="detail-head"><div><span>Contestant details</span><h2>{contestant.name}</h2><p>Team {contestant.team}</p></div><Avatar name={contestant.name} size="lg" index={contestant.id} /></div><div className="detail-score"><Metric value={contestant.points} label="House points" /><span className="id-pill">BB-{String(contestant.id).padStart(3, "0")}</span></div><div className="detail-chips"><Chip tone={statusTone[contestant.status]}>{contestant.status}</Chip><Chip tone={teamTone[contestant.team]}>Team {contestant.team}</Chip></div><dl><div><dt>Last task</dt><dd>Bridge Builder</dd></div><div><dt>Notes</dt><dd>Strong performance, calm leadership</dd></div><div><dt>Point history</dt><dd>+10 task bonus · 42 min ago</dd></div></dl></Panel>
  <div className="detail-actions">
    {isAdmin ? (
      <>
        <button onClick={() => adjustPoints(contestant.id, 10)}>+10</button>
        <button onClick={() => adjustPoints(contestant.id, -10)}>−10</button>
        <button>Custom</button>
        <button><Icon name="crown" size={14} />Captain</button>
        <button><Icon name="shield" size={14} />Immunity</button>
        <button className={contestant.status === "Immune" ? "disabled" : ""} title={contestant.status === "Immune" ? "Immune contestants cannot be nominated" : ""}><Icon name="alert" size={14} />Nominate</button>
        <button className="evict-action" onClick={() => onEvict(contestant)}>Evict</button>
      </>
    ) : (
      <div style={{ padding: "10px", width: "100%", textAlign: "center", color: "var(--muted)", fontSize: "12px" }}>
        <Icon name="shield" size={14} /> View Only · Point changes & evictions restricted to Admin
      </div>
    )}
  </div></div>;
}

function Timeline() {
  const items = [
    { time: "07:00", title: "Morning wake-up", subtitle: "Announcement · All housemates", icon: "speaker", tone: "yellow", past: true },
    { time: "07:30", title: "Silent Hour", subtitle: "Task completed · +30 points", icon: "check", tone: "green", past: true },
    { time: "09:15", title: "Bridge Builder", subtitle: "Task in progress · Team Alpha", icon: "tasks", tone: "blue" },
    { time: "10:30", title: "Nominations close", subtitle: "3 contestants in danger", icon: "alert", tone: "coral" },
  ];
  return <div className="timeline"><div className="timeline-head"><div><h2>Today’s timeline:</h2><p>Day 14 house schedule</p></div><span>Now</span></div><div className="timeline-list">{items.map((item, i) => <div className={`timeline-item ${item.past ? "past" : ""}`} key={item.time}><time>{item.time}</time><i className={`timeline-icon timeline-${item.tone}`}><Icon name={item.icon} size={16} /></i><div><strong>{item.title}</strong><span>{item.subtitle}</span></div>{i === 2 && <b>10:42</b>}</div>)}</div><button className="timeline-button">View all details <Icon name="more" size={15} /></button></div>;
}

function PageHeading({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: ReactNode }) {
  return <div className="page-heading"><div><span>{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>;
}

function Leaderboard({ contestants }: { contestants: Contestant[] }) {
  return <Panel className="leaderboard"><SectionTitle title="Live leaderboard" subtitle="Updates in real time" action={<span className="live-label"><i /> LIVE</span>} /><div className="leader-list">{contestants.slice(0, 7).map((c, i) => <div className={`leader-row rank-${i + 1}`} key={c.id}><span className="rank">{i + 1}</span><Avatar name={c.name} size="sm" index={c.id} /><div className="leader-name"><strong>{c.name}</strong><span>Team {c.team}</span></div><div className="leader-status">{c.status === "Captain" && <Icon name="crown" size={15} />}{c.status === "Immune" && <Icon name="shield" size={15} />}{c.status === "Nominated" && <Icon name="alert" size={15} />}</div><b>{c.points}<small> PTS</small></b></div>)}</div></Panel>;
}

function Captain({ contestant }: { contestant: Contestant }) {
  return <Panel className="captain-card"><div className="captain-label"><Icon name="crown" size={17} /> House captain</div><div className="captain-body"><Avatar name={contestant.name} size="lg" index={contestant.id} /><div><strong>{contestant.name}</strong><span>Team {contestant.team}</span><small>{contestant.points} points</small></div></div><Button variant="light">Change captain</Button></Panel>;
}

function TaskList({ compact = false }: { compact?: boolean }) {
  const tasks = [
    { title: "Build a bridge from spaghetti", meta: "Team Alpha · 50 points", state: "In progress", tone: "info" },
    { title: "Code Sprint", meta: "Team Gamma · 75 points", state: "Pending", tone: "warning" },
    { title: "Silent Hour", meta: "All housemates · 30 points", state: "Completed", tone: "success" },
  ];
  return <Panel className={`task-list ${compact ? "task-list-compact" : ""}`}><SectionTitle title="House tasks" action={<Button variant="text">View all</Button>} /><div>{tasks.map((task, i) => <div className={`task-row ${i === 2 ? "completed" : ""}`} key={task.title}><span className="task-check">{i === 2 && <Icon name="check" size={14} />}</span><div><strong>{task.title}</strong><small>{task.meta}</small></div><Chip tone={task.tone}>{task.state}</Chip></div>)}</div></Panel>;
}

function Timer({ timer, state, setState, reset, isAdmin = true }: {
  timer: number; state: string; setState: (s: "idle" | "running" | "paused" | "done") => void; reset: () => void; isAdmin?: boolean;
}) {
  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");
  return <Panel className={`timer-card timer-${state}`}><SectionTitle title="Task timer" subtitle="Current challenge" action={<Chip tone={state === "running" ? "success" : state === "done" ? "danger" : "info"}>{state === "done" ? "Time's up" : state}</Chip>} /><div className="timer-task">Bridge Builder</div><div className="timer-ring"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="61" /><circle className="timer-progress" cx="70" cy="70" r="61" /></svg><div><strong>{mm}:{ss}</strong><span>MIN : SEC</span></div></div><div className="timer-actions">{isAdmin ? (<><Button variant="success" icon="play" onClick={() => setState("running")}>Start</Button><Button variant="warning" icon="pause" onClick={() => setState("paused")}>Pause</Button><Button variant="ghost" icon="reset" onClick={reset}>Reset</Button></>) : (<div style={{ color: "var(--muted)", fontSize: "11px", textAlign: "center", width: "100%" }}>Timer controls are Admin only</div>)}</div></Panel>;
}

function DangerZone({ nominees, onEvict, compact = false, isAdmin = true }: {
  nominees: Contestant[]; onEvict: (c: Contestant) => void; compact?: boolean; isAdmin?: boolean;
}) {
  return <Panel className={`danger-zone ${compact ? "danger-compact" : ""}`}><Decor shape="triangle" /><div className="danger-header"><div><Icon name="alert" /><div><strong>Danger zone:</strong><span>Eviction candidates</span></div></div><Chip tone="danger">{nominees.length} nominated</Chip></div>{nominees.length ? <div className="danger-list">{nominees.map((c) => <div className="danger-person" key={c.id}><Avatar name={c.name} size={compact ? "sm" : "lg"} index={c.id} /><div><strong>{c.name}</strong><span>Team {c.team} · {c.points} pts</span></div>{isAdmin && <Button variant="danger" onClick={() => onEvict(c)}>Evict</Button>}</div>)}</div> : <div className="empty-state"><Icon name="shield" size={30} /><strong>No one is in danger... yet.</strong></div>}</Panel>;
}

function ContestantsPage({ contestants, search, setSearch, filter, setFilter, adjustPoints, add, nominate, evict, isAdmin }: {
  contestants: Contestant[]; search: string; setSearch: (s: string) => void; filter: string; setFilter: (s: string) => void; adjustPoints: (id: number, n: number) => void; add: () => void; nominate: (c: Contestant) => void; evict: (c: Contestant) => void; isAdmin: boolean;
}) {
  return <div className="page"><PageHeading eyebrow="House directory" title="Contestants" text="Manage points, status, immunity, and house privileges." action={isAdmin ? <Button variant="primary" icon="plus" onClick={add}>Add contestant</Button> : undefined} />
    <div className="toolbar"><label className="search-box"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contestants..." /></label><div className="filter-chips">{["All", "Active", "Nominated", "Immune", "Evicted"].map((item) => <button className={filter === item ? "selected" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div></div>
    <div className="contestant-grid">{contestants.map((c) => <Panel className={`contestant-card ${c.status === "Evicted" ? "is-evicted" : ""} ${c.status === "Immune" ? "is-immune" : ""}`} key={c.id}>{c.status === "Evicted" && <div className="evicted-stamp">Evicted</div>}<div className="card-top"><Avatar name={c.name} size="lg" index={c.id} /><button className="icon-button"><Icon name="more" /></button></div><div className="contestant-name"><h3>{c.name}</h3><Chip tone={teamTone[c.team]}>Team {c.team}</Chip></div><div className="points-line"><div><strong>{c.points}</strong><span>House points</span></div><Chip tone={statusTone[c.status]} icon={c.status === "Immune" ? "shield" : c.status === "Captain" ? "crown" : undefined}>{c.status}</Chip></div><div className="point-buttons"><Button variant="success" onClick={() => adjustPoints(c.id, 10)} disabled={!isAdmin || c.status === "Evicted"}>+10</Button><Button variant="ghost" onClick={() => adjustPoints(c.id, -10)} disabled={!isAdmin || c.status === "Evicted"}>−10</Button><Button variant="ghost" disabled={!isAdmin || c.status === "Evicted"}>Custom</Button></div><div className="card-actions"><Button variant="text" icon="crown" disabled={!isAdmin || c.status === "Evicted"}>Captain</Button><Button variant="text" icon="shield" disabled={!isAdmin || c.status === "Evicted"}>Immunity</Button><Button variant="text-danger" icon="alert" onClick={() => nominate(c)} disabled={!isAdmin || c.status === "Evicted" || c.status === "Immune"}>Nominate</Button><Button variant="text-danger" icon="logout" onClick={() => evict(c)} disabled={!isAdmin || c.status === "Evicted"}>Evict</Button></div></Panel>)}</div>
  </div>;
}

function TasksPage({ timer, timerState, setTimerState, setTimer, addTask, isAdmin }: {
  timer: number; timerState: string; setTimerState: (s: "idle" | "running" | "paused" | "done") => void; setTimer: (n: number) => void; addTask: () => void; isAdmin: boolean;
}) {
  return <div className="page"><PageHeading eyebrow="Challenge control" title="Tasks & Timer" text="Assign challenges, track progress, and control the house clock." action={isAdmin ? <Button variant="primary" icon="plus" onClick={addTask}>Assign new task</Button> : undefined} /><div className="tasks-layout"><div><TaskList /><Panel className="task-detail"><SectionTitle title="Build a bridge from spaghetti" subtitle="In progress · started 18 minutes ago" action={<Chip tone="info">Team Alpha</Chip>} /><p>Build a free-standing bridge using only spaghetti, tape, and string. The structure must hold a 1kg weight for ten seconds.</p><div className="task-meta"><div><span>Reward</span><strong>50 points</strong></div><div><span>Duration</span><strong>45 minutes</strong></div><div><span>Assigned</span><strong>4 contestants</strong></div></div>{isAdmin && <Button variant="success" icon="check">Mark complete</Button>}</Panel></div><Timer timer={timer} state={timerState} setState={setTimerState} reset={() => { setTimer(24 * 60 + 36); setTimerState("idle"); }} isAdmin={isAdmin} /></div></div>;
}

function NominationsPage({ contestants, nominated, nominate, remove, evict, isAdmin }: {
  contestants: Contestant[]; nominated: Contestant[]; nominate: (c: Contestant) => void; remove: (id: number) => void; evict: (c: Contestant) => void; isAdmin: boolean;
}) {
  const eligible = contestants.filter((c) => c.status !== "Nominated");
  return <div className="page"><PageHeading eyebrow="Eviction control" title="Nominations" text="Nominate housemates and manage this week’s eviction list." /><div className="nomination-layout"><Panel className="nominate-panel"><SectionTitle title="Nominate a contestant" subtitle={isAdmin ? "Immune contestants cannot be nominated" : "Nomination controls restricted to Admin"} /><div className="nominee-options">{eligible.map((c) => <button key={c.id} className={!isAdmin || c.status === "Immune" ? "disabled" : ""} onClick={() => isAdmin && nominate(c)} disabled={!isAdmin}><Avatar name={c.name} size="sm" index={c.id} /><span>{c.name}<small>Team {c.team}</small></span>{c.status === "Immune" ? <Icon name="shield" /> : <Icon name="plus" />}</button>)}</div></Panel><Panel className="nominees-panel"><SectionTitle title="Current nominees" subtitle={`${nominated.length} contestants face eviction`} /><div className="nominee-chips">{nominated.map((c) => <div><Avatar name={c.name} size="sm" index={c.id} /><span>{c.name}</span>{isAdmin && <button onClick={() => remove(c.id)}><Icon name="close" size={14} /></button>}</div>)}</div><div className="rule-note"><Icon name="shield" /><div><strong>Immunity rule</strong><p>Immune contestants are protected from nomination until the next cycle.</p></div></div></Panel></div><DangerZone nominees={nominated} onEvict={evict} isAdmin={isAdmin} /></div>;
}

function AnnouncementsPage({ announce, isAdmin }: { announce: () => void; isAdmin: boolean }) {
  return <div className="page"><PageHeading eyebrow="Broadcast center" title="Announcements" text="Send house-wide messages and review broadcast history." action={isAdmin ? <Button variant="primary" icon="speaker" onClick={announce}>New announcement</Button> : undefined} /><Panel className="feed"><SectionTitle title="Broadcast history" subtitle="All times shown in house time" />{[
    ["10:14 PM", "Housemates, the nomination window is now open.", "Big Boss"],
    ["08:30 PM", "The spaghetti bridge task has officially begun.", "Big Boss"],
    ["06:00 PM", "All housemates must gather in the living room.", "Production"],
  ].map((item, i) => <div className="feed-item" key={item[0]}><span className={`feed-icon feed-${i}`}><Icon name="speaker" /></span><div><strong>{item[1]}</strong><p>{item[2]} · {item[0]} · Day 14</p></div></div>)}</Panel></div>;
}

function ComponentsPage() {
  return <div className="page"><PageHeading eyebrow="Design system" title="Command UI Kit" text="Core tokens and reusable components used across the control center." /><div className="component-grid"><Panel><SectionTitle title="Color tokens" /><div className="swatches">{["Navy 900", "Slate 800", "Signal Red", "Captain Gold", "Info Blue", "Success Green"].map((name, i) => <div><i className={`swatch swatch-${i}`} /><span>{name}</span></div>)}</div></Panel><Panel><SectionTitle title="Buttons" /><div className="component-row"><Button variant="primary">Primary</Button><Button variant="success">Success</Button><Button variant="warning">Warning</Button><Button variant="danger">Danger</Button><Button variant="ghost">Secondary</Button><Button disabled>Disabled</Button></div></Panel><Panel><SectionTitle title="Status chips" /><div className="component-row"><Chip tone="success">Immune</Chip><Chip tone="warning">Nominated</Chip><Chip tone="gold">Captain</Chip><Chip tone="info">In progress</Chip><Chip tone="danger">Evicted</Chip></div></Panel><Panel><SectionTitle title="Inputs" /><div className="field-row"><Field label="Contestant name" placeholder="Enter a name" /><Field label="Team" placeholder="Select a team" /></div></Panel><Panel className="type-specimen"><SectionTitle title="Typography" /><h1>Display / Poppins SemiBold</h1><h2>Section heading / Poppins</h2><p>Body copy uses Roboto for fast, comfortable reading throughout dense control surfaces.</p></Panel><Panel><SectionTitle title="Toast & alerts" /><div className="inline-alert success"><Icon name="check" /><span><strong>Success</strong> Captain has been updated.</span></div><div className="inline-alert warning"><Icon name="alert" /><span><strong>Attention</strong> Three contestants face eviction.</span></div></Panel></div></div>;
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <label className="field"><span>{label}</span><input placeholder={placeholder} /></label>;
}

function SimpleModal({ title, close, children, confirmLabel, onConfirm }: { title: string; close: () => void; children: ReactNode; confirmLabel: string; onConfirm: () => void }) {
  return <div className="modal-scrim"><div className="modal"><div className="modal-head"><div><span>Big Boss controls</span><h2>{title}</h2></div><button className="icon-button" onClick={close}><Icon name="close" /></button></div><div className="modal-body">{children}</div><div className="modal-actions"><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button></div></div></div>;
}

function AnnouncementModal({ value, setValue, close, broadcast }: { value: string; setValue: (v: string) => void; close: () => void; broadcast: () => void }) {
  const templates = ["Nominations are open!", "New task incoming!", "Someone is being evicted tonight!"];
  return <div className="modal-scrim"><div className="modal announcement-modal"><div className="modal-head"><div><span>House-wide message</span><h2>Make announcement</h2></div><button className="icon-button" onClick={close}><Icon name="close" /></button></div><div className="modal-body"><label className="field"><span>Message</span><textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Big Boss has something to say..." /></label><span className="field-caption">Quick templates</span><div className="template-list">{templates.map((item) => <button onClick={() => setValue(item)} key={item}>{item}</button>)}</div></div><div className="modal-actions"><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" icon="speaker" onClick={broadcast}>Broadcast now</Button></div></div></div>;
}

function EvictionModal({ contestant, close, confirm }: { contestant: Contestant; close: () => void; confirm: () => void }) {
  return <div className="modal-scrim"><div className="modal eviction-modal"><div className="evict-icon"><Icon name="alert" size={30} /></div><Avatar name={contestant.name} size="xl" index={contestant.id} /><h2>Evict {contestant.name}?</h2><p>This action will remove {contestant.name} from the active house and live leaderboard. Their profile will move to the eviction archive.</p><div className="modal-actions"><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="danger" icon="logout" onClick={confirm}>Evict contestant</Button></div></div></div>;
}

function AnnouncementOverlay({ message, dismiss }: { message: string; dismiss: () => void }) {
  return <div className="broadcast-overlay"><div className="broadcast-eye"><Icon name="eye" size={64} /><i /></div><span>Attention housemates</span><h2>Big Boss speaks</h2><p>{message}</p><Button variant="light" onClick={dismiss}>Dismiss broadcast</Button></div>;
}

function EvictionResult({ name, close }: { name: string; close: () => void }) {
  return <div className="eviction-result"><div className="evicted-mark">Evicted</div><span>Day 14 · Official result</span><h2>{name} has been evicted<br />from the Tech House</h2><p>The contestant profile is now available in the eviction archive.</p><Button variant="light" onClick={close}>Return to command center</Button></div>;
}

function MobileNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const items: { label: Page; icon: string; short: string }[] = [
    { label: "Dashboard", icon: "grid", short: "Home" },
    { label: "Contestants", icon: "users", short: "House" },
    { label: "Tasks", icon: "tasks", short: "Tasks" },
    { label: "Nominations", icon: "alert", short: "Danger" },
    { label: "Activity Log", icon: "activity", short: "Logs" },
  ];
  return <nav className="mobile-nav">{items.map((item) => <button className={page === item.label ? "active" : ""} onClick={() => setPage(item.label)} key={item.label}><Icon name={item.icon} /><span>{item.short}</span></button>)}</nav>;
}

export default App;
