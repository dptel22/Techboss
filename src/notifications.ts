export type NotificationCategory =
  | "POINTS"
  | "NOMINATION"
  | "EVICTION"
  | "CAPTAIN"
  | "TASK"
  | "TIMER"
  | "BROADCAST"
  | "SURVEILLANCE"
  | "SYSTEM";

export type NotificationSeverity = "urgent" | "warning" | "success" | "info";

export interface HouseNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const initialNotifications: HouseNotification[] = [
  {
    id: "notif-1",
    category: "BROADCAST",
    severity: "urgent",
    title: "Big Boss Proclamation",
    message: "Captaincy immunity is active for Isha. All housemates must observe quiet hours.",
    timestamp: "10m ago",
    read: false,
  },
  {
    id: "notif-2",
    category: "NOMINATION",
    severity: "warning",
    title: "Danger Zone Alert",
    message: "3 contestants placed on the nomination chopping block: Sana, Kabir, Dev.",
    timestamp: "22m ago",
    read: false,
  },
  {
    id: "notif-3",
    category: "TASK",
    severity: "info",
    title: "Live Task Commenced",
    message: "Spaghetti Bridge Challenge started for Team Alpha with 50 points on the line.",
    timestamp: "38m ago",
    read: true,
  },
  {
    id: "notif-4",
    category: "POINTS",
    severity: "success",
    title: "House Score Credited",
    message: "Aarav earned +15 points for completing early morning rations audit.",
    timestamp: "1h ago",
    read: true,
  },
];

export function playNotificationSound(severity: NotificationSeverity = "info") {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === "urgent" ? "sawtooth" : severity === "warning" ? "triangle" : "sine";
    const baseFreq =
      severity === "urgent" ? 880 : severity === "warning" ? 660 : severity === "success" ? 523.25 : 440;

    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    if (severity === "urgent") {
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15);
    } else if (severity === "success") {
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
    }

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (severity === "urgent" ? 0.35 : 0.25));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (severity === "urgent" ? 0.35 : 0.25));
  } catch {
    // Graceful fallback if browser policies block audio before user interaction
  }
}
