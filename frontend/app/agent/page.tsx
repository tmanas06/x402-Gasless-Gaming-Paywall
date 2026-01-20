"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Wallet, Receipt, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Payment = {
  game: string;
  amount: number;
  currency: string;
  status: "success" | "pending" | "failed";
};

type AgentStats = {
  balance: number;
  todaysSpend: number;
  dailyLimit: number;
  currency: string;
  payments: Payment[];
  updatedAt?: number;
};

async function fetchAgentStats(): Promise<AgentStats> {
  const res = await fetch("/api/agent/stats", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch agent stats: ${res.status}`);
  return res.json();
}

export default function AgentDashboardPage() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastUpdatedLabel = useMemo(() => {
    if (!stats?.updatedAt) return null;
    const d = new Date(stats.updatedAt);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [stats?.updatedAt]);

  const loadStats = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const data = await fetchAgentStats();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agent stats");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Keep the dashboard dynamic by polling for updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats();
    }, 10_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatAmount = (value: number, currency: string) =>
    `${value.toFixed(2)} ${currency}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-indigo-950 pt-24 pb-10 px-4 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Agent Dashboard
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-300">
              Monitor your gasless gaming payments and auto-pay allowance in real time.
            </p>
            {error ? (
              <p className="mt-2 text-sm text-red-300">
                {error}
              </p>
            ) : lastUpdatedLabel ? (
              <p className="mt-2 text-xs text-gray-400">
                Last updated: {lastUpdatedLabel}
              </p>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className="border-emerald-400/60 text-emerald-300 bg-emerald-500/10 flex items-center gap-1"
          >
            <ShieldCheck className="h-4 w-4" />
            Auto-pay enabled
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gray-900/70 border-blue-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Agent Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-200">
                {stats
                  ? formatAmount(stats.balance, stats.currency)
                  : isLoading
                  ? "Loading..."
                  : "--"}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Funds available to sponsor player gas fees.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-purple-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Today&apos;s Spend
              </CardTitle>
              <Receipt className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-200">
                {stats
                  ? formatAmount(stats.todaysSpend, stats.currency)
                  : isLoading
                  ? "Loading..."
                  : "--"}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Total sponsored gas for players in the last 24 hours.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/70 border-emerald-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Auto-pay Limit
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-200">
                {stats
                  ? formatAmount(stats.dailyLimit, stats.currency)
                  : isLoading
                  ? "Loading..."
                  : "--"}
              </div>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                Auto-pay up to{" "}
                {stats
                  ? formatAmount(stats.dailyLimit, stats.currency)
                  : "0.10 USDC"}
                /day
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-950/80 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base md:text-lg text-gray-100">
                Payment History
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">
                Latest gasless payments made on behalf of your players.
              </p>
            </div>
            <button
              onClick={loadStats}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-800 transition-colors",
                isRefreshing && "opacity-70 cursor-wait"
              )}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isRefreshing && "animate-spin text-blue-400"
                )}
              />
              Refresh
            </button>
          </CardHeader>
          <CardContent>
            {isLoading && !stats ? (
              <p className="text-sm text-gray-400">Loading payments...</p>
            ) : !stats || stats.payments.length === 0 ? (
              <p className="text-sm text-gray-400">
                No payments recorded yet. Once players start using the arcade, you&apos;ll
                see their sponsored transactions here.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {stats.payments.map((payment, idx) => (
                  <div
                    key={`${payment.game}-${idx}`}
                    className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-900/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">
                        {payment.game}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatAmount(payment.amount, payment.currency)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        payment.status === "success"
                          ? "text-emerald-400"
                          : payment.status === "pending"
                          ? "text-yellow-300"
                          : "text-red-300"
                      )}
                    >
                      <span className="text-xs">
                        {payment.status === "success"
                          ? "✓"
                          : payment.status === "pending"
                          ? "…"
                          : "×"}
                      </span>
                      <span className="text-xs">
                        {payment.status === "success"
                          ? "Success"
                          : payment.status === "pending"
                          ? "Pending"
                          : "Failed"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

