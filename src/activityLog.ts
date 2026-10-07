export type LogCategory =
  | "POINTS"
  | "NOMINATION"
  | "EVICTION"
  | "CAPTAIN"
  | "IMMUNITY"
  | "TASK"
  | "TIMER"
  | "BROADCAST"
  | "CONTESTANT"
  | "AUTH"
  | "SURVEILLANCE";

export type LogSeverity = "critical" | "danger" | "warning" | "success" | "info";

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  timeAgo: string;
  category: LogCategory;
  severity: LogSeverity;
  actor: string;
  action: string;
  details: string;
  target?: string;
}

export const initialActivityLogs: ActivityLogEntry[] = [
  {
    id: "log-1",
    timestamp: "14:00:45",
    timeAgo: "9m ago",
    category: "AUTH",
    severity: "info",
    actor: "Security Engine",
    action: "Role-Based Access Control Initialized",
    details: "RBAC security layer active. Dual role permissions (Admin Director / Housemate Viewer) verified.",
    target: "System Gateway",
  },
  {
    id: "log-2",
    timestamp: "13:54:12",
    timeAgo: "15m ago",
    category: "POINTS",
    severity: "success",
    actor: "Big Boss Director",
    action: "Points Awarded",
    details: "+30 points awarded to Aarav (Team Alpha) for Silent Hour challenge completion.",
    target: "Aarav",
  },
  {
    id: "log-3",
    timestamp: "13:42:00",
    timeAgo: "27m ago",
    category: "CAPTAIN",
    severity: "success",
    actor: "Big Boss Director",
    action: "House Captain Appointed",
    details: "Isha (Team Beta) crowned House Captain. Automatic nomination immunity shield activated.",
    target: "Isha",
  },
  {
    id: "log-4",
    timestamp: "13:30:18",
    timeAgo: "39m ago",
    category: "NOMINATION",
    severity: "warning",
    actor: "Big Boss Director",
    action: "Danger Zone Nomination",
    details: "Kabir (Team Alpha) moved to the Danger Zone for the upcoming eviction cycle.",
    target: "Kabir",
  },
  {
    id: "log-5",
    timestamp: "13:15:00",
    timeAgo: "54m ago",
    category: "TASK",
    severity: "info",
    actor: "Big Boss Director",
    action: "House Challenge Assigned",
    details: "Challenge 'Build a bridge from spaghetti' assigned to Team Alpha with 50 point reward.",
    target: "Team Alpha",
  },
  {
    id: "log-6",
    timestamp: "12:45:22",
    timeAgo: "1h ago",
    category: "BROADCAST",
    severity: "critical",
    actor: "Big Boss Director",
    action: "House-Wide Emergency Broadcast",
    details: "Announcement: 'Attention housemates. The living area is now open. Silent Hour begins immediately.'",
    target: "All Housemates",
  },
  {
    id: "log-7",
    timestamp: "12:10:05",
    timeAgo: "2h ago",
    category: "IMMUNITY",
    severity: "success",
    actor: "Big Boss Director",
    action: "Immunity Shield Granted",
    details: "Rohan (Team Gamma) granted immunity badge until next eviction ceremony.",
    target: "Rohan",
  },
  {
    id: "log-8",
    timestamp: "11:20:40",
    timeAgo: "3h ago",
    category: "SURVEILLANCE",
    severity: "info",
    actor: "Surveillance Sensor AI",
    action: "Area Telemetry Sync",
    details: "Camera 04 detected 6 housemates gathered in Lounge Area. Decibel telemetry normal (42 dB).",
    target: "Lounge Area",
  },
];

export const simulatedSurveillanceEvents = [
  {
    category: "SURVEILLANCE" as LogCategory,
    severity: "info" as LogSeverity,
    actor: "Cam 03 Optical",
    action: "Movement Detected",
    details: "Kitchen pantry access logged by Tanvi. Provision check verified.",
    target: "Kitchen",
  },
  {
    category: "SURVEILLANCE" as LogCategory,
    severity: "info" as LogSeverity,
    actor: "Audio Matrix",
    action: "Acoustic Spike",
    details: "Loud conversation detected in Beta Bedroom. Noise gate stabilized.",
    target: "Beta Bedroom",
  },
  {
    category: "SYSTEM" as LogCategory,
    severity: "info" as LogSeverity,
    actor: "Telemetry Core",
    action: "House Display Sync",
    details: "Live Leaderboard synced across 8 house OLED surveillance monitors.",
    target: "Main Hall Displays",
  },
  {
    category: "SURVEILLANCE" as LogCategory,
    severity: "warning" as LogSeverity,
    actor: "Boundary Sensor",
    action: "Proximity Alert",
    details: "Housemate lingered near Confession Room airlock for over 3 minutes.",
    target: "Confession Air-lock",
  },
  {
    category: "SYSTEM" as LogCategory,
    severity: "info" as LogSeverity,
    actor: "Biometric AI",
    action: "Badge Authenticated",
    details: "Captain Isha verified access to Captain's Private Suite.",
    target: "Captain Suite",
  },
  {
    category: "SURVEILLANCE" as LogCategory,
    severity: "info" as LogSeverity,
    actor: "House Pulse AI",
    action: "Heartbeat Scan",
    details: "All 10 housemate wearable telemetry bands transmitting valid vitals.",
    target: "All Housemates",
  },
];

export function formatNow(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0];
}

export function exportLogsToCSV(logs: ActivityLogEntry[]): void {
  const headers = ["ID", "Timestamp", "Category", "Severity", "Actor", "Action", "Target", "Details"];
  const rows = logs.map((l) => [
    l.id,
    l.timestamp,
    l.category,
    l.severity,
    `"${l.actor.replace(/"/g, '""')}"`,
    `"${l.action.replace(/"/g, '""')}"`,
    `"${(l.target || "").replace(/"/g, '""')}"`,
    `"${l.details.replace(/"/g, '""')}"`,
  ]);
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `techboss_activity_logs_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportLogsToJSON(logs: ActivityLogEntry[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `techboss_activity_logs_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
