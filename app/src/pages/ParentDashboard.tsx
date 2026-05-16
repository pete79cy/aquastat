import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  YAxis,
} from "recharts";
import { Trophy, Calendar, TrendingDown, ChevronRight, Medal } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { childProgress as c } from "@/lib/mockData";
import { formatTime, formatDelta } from "@/lib/utils";

export default function ParentDashboard() {
  const { t } = useTranslation();
  const target = c.upcomingTarget;

  return (
    <div className="space-y-5 lg:max-w-3xl">
      <header>
        <div className="text-xs text-ink-subtle uppercase tracking-wider">{t("parentDashboard.title")}</div>
        <h1 className="mt-1 text-2xl lg:text-headline-lg font-semibold text-ink">{c.name}</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          {c.age} {t("parentDashboard.yearsOld")} · {c.category} · {t("parentDashboard.coach")}: {c.coach}
        </p>
      </header>

      {/* Top: latest + PB + next */}
      <div className="grid sm:grid-cols-3 gap-3 lg:gap-4">
        <Card>
          <CardBody className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              <span>{t("parentDashboard.latestResult")}</span>
              <Chip tone="primary">{c.latest.eventLabel}</Chip>
            </div>
            <div className="text-display-time text-primary tnum leading-none mt-1">
              {formatTime(c.latest.timeMs)}
            </div>
            <div className="flex items-center gap-1 text-sm text-achieved font-semibold mt-1">
              <TrendingDown className="w-4 h-4" />
              {formatDelta(c.latest.improvementMs)} {t("parentDashboard.improvement")}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              <span>{t("parentDashboard.personalBest")}</span>
              <Trophy className="w-4 h-4 text-tertiary-container" />
            </div>
            <div className="text-display-time text-ink tnum leading-none mt-1">{formatTime(c.pb.timeMs)}</div>
            <div className="text-xs text-ink-muted mt-1">
              <Medal className="w-3 h-3 inline mr-1 text-tertiary-container" />
              {new Date(c.pb.setOn).toLocaleDateString("el-CY")}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              <span>{t("parentDashboard.nextCompetition")}</span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="font-semibold text-primary leading-snug">{c.nextCompetition.name}</div>
            <div className="text-xs text-ink-muted">{c.nextCompetition.date}</div>
            <div className="mt-1.5">
              <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "60%" }} />
              </div>
              <div className="text-[11px] text-ink-muted mt-1 font-semibold uppercase tracking-wider">
                {c.nextCompetition.daysToGo} {t("parentDashboard.daysToGo")}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Progress chart */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-headline-md text-ink">{t("parentDashboard.progressOverTime")}</h2>
            <Chip tone="primary">{c.latest.eventLabel}</Chip>
          </div>
          <div className="h-56 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={c.progressChart}>
                <CartesianGrid stroke="#e6e8eb" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#70787e"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: "#bfc8ce" }}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 500", "dataMax + 500"]}
                  reversed
                  hide
                />
                <Tooltip
                  formatter={(v) => formatTime(Number(v))}
                  contentStyle={{ borderRadius: 8, border: "1px solid #bfc8ce", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="ms"
                  stroke="#00526f"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#00526f" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-ink-subtle italic text-center mt-1">
            {t("parentDashboard.lowerIsBetter")}
          </p>
        </CardBody>
      </Card>

      {/* Upcoming target */}
      <Card>
        <CardBody>
          <h2 className="text-headline-md text-ink mb-3">{t("parentDashboard.upcomingTarget")}</h2>
          <div className="rounded-md bg-primary-fixed/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  {target.eventLabel}
                </div>
              </div>
              <Chip tone="close">{t("athleteProfile.nearTarget")}</Chip>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  {t("parentDashboard.current")}
                </div>
                <div className="text-2xl font-bold text-primary tnum">{formatTime(target.currentMs)}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                  {t("parentDashboard.limit")}
                </div>
                <div className="text-2xl font-bold text-ink tnum">{formatTime(target.limitMs)}</div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${target.achievedPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-ink-muted mt-1.5 font-semibold uppercase tracking-wider">
              <span>{target.achievedPct}% ✓</span>
              <span>
                {(target.gapMs / 1000).toFixed(2)}s {t("parentDashboard.gapToQualify")}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent results */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-headline-md text-ink">{t("parentDashboard.recentResults")}</h2>
            <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              {t("parentDashboard.viewAll")} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <ul className="divide-y divide-outline-variant/50">
            {c.recentResults.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-surface-2 grid place-items-center shrink-0">
                  <Calendar className="w-4 h-4 text-ink-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink truncate">{r.meet}</div>
                  <div className="text-xs text-ink-muted">
                    {r.date} · {r.event}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-ink tnum">{formatTime(r.timeMs)}</div>
                  {"badge" in r && r.badge ? (
                    <Chip tone="achieved">{r.badge.label}</Chip>
                  ) : "delta" in r && r.delta !== undefined ? (
                    <Chip tone={r.delta <= 0 ? "achieved" : "close"} className="tnum">
                      {formatDelta(r.delta)}
                    </Chip>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
