"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchManagerOpenings } from "@/redux/features/Dashboard/hiringManagerSlice";
import { useRouter } from "next/navigation";
import {
  Users, MapPin, Briefcase, ChevronRight,
  Search, TrendingUp, CheckCircle, PauseCircle, Filter,
} from "lucide-react";

const statusConfig = {
  OPEN:    { color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500 dark:bg-emerald-400" },
  CLOSED:  { color: "text-red-500 dark:text-red-400",         bg: "bg-red-500/10 border-red-500/20",         dot: "bg-red-500 dark:bg-red-400" },
  ON_HOLD: { color: "text-amber-500 dark:text-amber-400",     bg: "bg-amber-500/10 border-amber-500/20",     dot: "bg-amber-500 dark:bg-amber-400" },
};

const contractConfig = {
  "Full-Time": "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Contract":  "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Part-Time": "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20",
};

function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border backdrop-blur-xl ${className}`}
      style={{
        background: "var(--aurora-surface)",
        borderColor: "var(--aurora-border)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, glow }) {
  return (
    <GlassCard className="p-5 flex items-center gap-4 transition-colors hover:opacity-90">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}
        style={{ boxShadow: `0 0 20px ${glow}` }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--aurora-text)" }}>
          {value}
        </p>
        <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: "var(--aurora-text-muted)" }}>
          {label}
        </p>
      </div>
    </GlassCard>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse" style={{ borderBottom: "1px solid var(--aurora-border-faint)" }}>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3.5 rounded-full w-3/4" style={{ background: "var(--aurora-skeleton)" }} />
        </td>
      ))}
    </tr>
  );
}

export default function HiringManagerOpeningsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { openings, loading } = useSelector((s) => s.hiringManager);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => { dispatch(fetchManagerOpenings()); }, [dispatch]);

  const filtered = openings.filter((o) => {
    const q = search.toLowerCase();
    return (
      (o.title.toLowerCase().includes(q) || o.location?.toLowerCase().includes(q)) &&
      (statusFilter === "ALL" || o.status === statusFilter)
    );
  });

  const stats = {
    total:    openings.length,
    open:     openings.filter((o) => o.status === "OPEN").length,
    onHold:   openings.filter((o) => o.status === "ON_HOLD").length,
    profiles: openings.reduce((s, o) => s + (o._count?.hiringProfiles || 0), 0),
  };

  return (
    <div className="aurora-bg relative min-h-screen p-6 space-y-6">
      <div className="aurora-grid" />

      {/* Header */}
      <div className="space-y-1 relative z-10">
        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
          Hiring Manager Portal
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--aurora-text)" }}>
          My Openings
        </h1>
        <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>
          Review AI-ranked candidates and make hiring decisions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 relative z-10">
        <StatCard icon={TrendingUp}  label="Total"    value={stats.total}    accent="bg-blue-500/20 text-blue-600 dark:text-blue-400"    glow="rgba(79,142,247,0.25)" />
        <StatCard icon={CheckCircle} label="Open"     value={stats.open}     accent="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" glow="rgba(34,197,94,0.25)" />
        <StatCard icon={PauseCircle} label="On Hold"  value={stats.onHold}   accent="bg-amber-500/20 text-amber-600 dark:text-amber-400"   glow="rgba(245,158,11,0.25)" />
        <StatCard icon={Users}       label="Profiles" value={stats.profiles} accent="bg-purple-500/20 text-purple-600 dark:text-purple-400" glow="rgba(124,92,252,0.25)" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap relative z-10">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--aurora-text-faint)" }}
          />
          <input
            type="text"
            placeholder="Search openings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: "var(--aurora-surface)",
              border: "1px solid var(--aurora-border)",
              color: "var(--aurora-text)",
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" style={{ color: "var(--aurora-text-faint)" }} />
          {["ALL", "OPEN", "ON_HOLD", "CLOSED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
              style={
                statusFilter === s
                  ? { background: "rgba(124,92,252,0.15)", color: "#a855f7", border: "1px solid rgba(124,92,252,0.35)" }
                  : { background: "transparent", color: "var(--aurora-text-muted)", border: "1px solid var(--aurora-border)" }
              }
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden relative z-10">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--aurora-border-subtle)" }}>
              {["Title", "Location", "Type", "Experience", "Profiles", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--aurora-text-faint)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-20 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "var(--aurora-surface)" }}
                  >
                    <Users className="w-6 h-6" style={{ color: "var(--aurora-text-faint)" }} />
                  </div>
                  <p className="text-sm" style={{ color: "var(--aurora-text-muted)" }}>No openings found</p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="text-purple-500 dark:text-purple-400 text-xs mt-2 hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((opening) => {
                const sc = statusConfig[opening.status];
                const profileCount = opening._count?.hiringProfiles || 0;
                return (
                  <tr
                    key={opening.id}
                    onClick={() => router.push(`/hiring-manager/openings/${opening.id}`)}
                    className="transition-colors cursor-pointer group"
                    style={{ borderBottom: "1px solid var(--aurora-border-faint)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--aurora-surface)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <Briefcase className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                        </div>
                        <span className="font-medium" style={{ color: "var(--aurora-text)" }}>
                          {opening.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--aurora-text-muted)" }}>
                        <MapPin className="w-3 h-3" />
                        {opening.location || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${contractConfig[opening.contractType] || ""}`}
                        style={!contractConfig[opening.contractType] ? { color: "var(--aurora-text-muted)", border: "1px solid var(--aurora-border)" } : {}}
                      >
                        {opening.contractType || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: "var(--aurora-text-muted)" }}>
                      {opening.experienceMin}{opening.experienceMax ? `–${opening.experienceMax}` : "+"} yrs
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: "var(--aurora-text-muted)" }}>{profileCount}</span>
                        {profileCount > 0 && (
                          <div className="w-16 rounded-full h-1" style={{ background: "var(--aurora-skeleton)" }}>
                            <div
                              className="bg-purple-500 dark:bg-purple-400 h-1 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (profileCount / 5) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {opening.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ChevronRight
                        className="w-4 h-4 transition-all group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:translate-x-0.5"
                        style={{ color: "var(--aurora-text-faint)" }}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </GlassCard>

      {filtered.length > 0 && (
        <p className="text-xs text-right relative z-10" style={{ color: "var(--aurora-text-faint)" }}>
          {filtered.length} of {openings.length} openings
        </p>
      )}
    </div>
  );
}