import fs from "fs";
import path from "path";

export type AgentPaymentStatus = "success" | "pending" | "failed";

export type AgentPayment = {
  game: string;
  amount: number; // USDC (human units)
  currency: string; // e.g. "USDC"
  status: AgentPaymentStatus;
  timestamp: number; // ms
};

export type AgentDashboardStats = {
  balance: number; // USDC (human units)
  todaysSpend: number; // USDC (human units)
  dailyLimit: number; // USDC (human units)
  currency: string;
  payments: AgentPayment[];
  updatedAt: number;
};

type PersistedAgentDashboardState = {
  currency: string;
  dailyLimit: number;
  balance: number;
  payments: AgentPayment[];
};

const DEFAULT_STATE: PersistedAgentDashboardState = {
  currency: "USDC",
  dailyLimit: 0.1,
  balance: 0.25,
  payments: [],
};

export class AgentDashboardService {
  private dataFilePath: string;

  constructor(dataDir = path.join(process.cwd(), "data")) {
    this.dataFilePath = path.join(dataDir, "agent-dashboard.json");
  }

  private ensureDataDirExists() {
    const dir = path.dirname(this.dataFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  private readState(): PersistedAgentDashboardState {
    this.ensureDataDirExists();
    if (!fs.existsSync(this.dataFilePath)) {
      // Seed initial demo data (still dynamic because it's served by API and can be updated)
      const now = Date.now();
      const seeded: PersistedAgentDashboardState = {
        ...DEFAULT_STATE,
        payments: [
          { game: "SnakeGame", amount: 0.01, currency: "USDC", status: "success", timestamp: now - 60_000 },
          { game: "CryptoDodger", amount: 0.01, currency: "USDC", status: "success", timestamp: now - 40_000 },
          { game: "GuessTheMarket", amount: 0.01, currency: "USDC", status: "success", timestamp: now - 20_000 },
        ],
      };
      this.writeState(seeded);
      return seeded;
    }

    try {
      const raw = fs.readFileSync(this.dataFilePath, "utf-8");
      const parsed = JSON.parse(raw) as PersistedAgentDashboardState;
      return {
        currency: parsed.currency || DEFAULT_STATE.currency,
        dailyLimit:
          typeof parsed.dailyLimit === "number"
            ? parsed.dailyLimit
            : DEFAULT_STATE.dailyLimit,
        balance:
          typeof parsed.balance === "number" ? parsed.balance : DEFAULT_STATE.balance,
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  private writeState(state: PersistedAgentDashboardState) {
    this.ensureDataDirExists();
    fs.writeFileSync(this.dataFilePath, JSON.stringify(state, null, 2), "utf-8");
  }

  private getTodayStartMs(now = Date.now()) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  getStats(): AgentDashboardStats {
    const state = this.readState();
    const todayStart = this.getTodayStartMs();
    const todaysSpend = state.payments
      .filter((p) => p.status === "success" && p.timestamp >= todayStart)
      .reduce((sum, p) => sum + (Number.isFinite(p.amount) ? p.amount : 0), 0);

    // Return latest first, cap list size to keep payload small
    const payments = [...state.payments]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    return {
      balance: state.balance,
      todaysSpend,
      dailyLimit: state.dailyLimit,
      currency: state.currency,
      payments,
      updatedAt: Date.now(),
    };
  }

  addPayment(input: Omit<AgentPayment, "timestamp"> & { timestamp?: number }) {
    const state = this.readState();
    state.payments.push({
      ...input,
      timestamp: input.timestamp ?? Date.now(),
    });
    this.writeState(state);
  }

  updateConfig(partial: Partial<Pick<PersistedAgentDashboardState, "balance" | "dailyLimit" | "currency">>) {
    const state = this.readState();
    if (typeof partial.balance === "number") state.balance = partial.balance;
    if (typeof partial.dailyLimit === "number") state.dailyLimit = partial.dailyLimit;
    if (typeof partial.currency === "string") state.currency = partial.currency;
    this.writeState(state);
  }
}

