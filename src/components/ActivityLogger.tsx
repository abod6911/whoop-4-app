import React, { useState, useEffect } from 'react';
import type {
  SessionRecord,
  SessionType,
  LiveMetrics,
  HrZoneInfo,
} from '../types/whoop';
import { storageService } from '../services/StorageService';
import { metricsEngine } from '../services/MetricsEngine';
import {
  Dumbbell,
  Moon,
  Play,
  Square,
  Clock,
  Flame,
  Activity,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileCode,
  Award,
} from 'lucide-react';

interface ActivityLoggerProps {
  metrics: LiveMetrics;
  zones: HrZoneInfo[];
  sessions: SessionRecord[];
  onRefreshSessions: () => void;
}

export const ActivityLogger: React.FC<ActivityLoggerProps> = ({
  metrics,
  zones,
  sessions,
  onRefreshSessions,
}) => {
  const [activeSessionType, setActiveSessionType] = useState<SessionType | null>(null);
  const [sessionTitle, setSessionTitle] = useState('Workout');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [sessionSamples, setSessionSamples] = useState<Array<{ timestamp: number; hr: number; hrv: number }>>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    let interval: number | null = null;
    if (activeSessionType && sessionStartTime) {
      interval = window.setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSessionType, sessionStartTime]);

  useEffect(() => {
    if (activeSessionType && metrics.currentHr > 0) {
      setSessionSamples((prev) => [
        ...prev,
        {
          timestamp: Date.now(),
          hr: metrics.currentHr,
          hrv: metrics.currentHrv,
        },
      ]);
    }
  }, [metrics.timestamp, activeSessionType]);

  const handleStartSession = (type: SessionType) => {
    const defaultTitle = type === 'workout' ? 'Athletic Workout' : 'Sleep Tracking';
    setActiveSessionType(type);
    setSessionTitle(defaultTitle);
    setSessionStartTime(Date.now());
    setSessionSamples([]);
  };

  const handleStopAndSave = async () => {
    if (!activeSessionType || !sessionStartTime) return;

    const endTime = Date.now();
    const evaluated = metricsEngine.evaluateWorkoutSession(sessionStartTime, endTime, sessionSamples);

    const newRecord: SessionRecord = {
      id: `session-${Date.now()}`,
      type: activeSessionType,
      title: sessionTitle || (activeSessionType === 'workout' ? 'Workout' : 'Sleep Session'),
      ...evaluated,
      recoveryScore: activeSessionType === 'sleep' ? metrics.recoveryScore : undefined,
    };

    try {
      await storageService.saveSession(newRecord);
      onRefreshSessions();
    } catch (e) {
      console.error('Failed to save session:', e);
    }

    setActiveSessionType(null);
    setSessionStartTime(null);
    setSessionSamples([]);
  };

  const handleDiscard = () => {
    if (confirm('Discard current active session?')) {
      setActiveSessionType(null);
      setSessionStartTime(null);
      setSessionSamples([]);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('Are you sure you want to delete this recorded session?')) {
      await storageService.deleteSession(id);
      onRefreshSessions();
    }
  };

  const formatSec = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}m:${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-6">
      {/* Active Session Controller Banner */}
      <div className="p-5 rounded-2xl bg-whoop-card border border-whoop-border/80 shadow-lg">
        {!activeSessionType ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">Activity & Sleep Session Tracker</h2>
                <p className="text-xs text-whoop-muted">
                  Log dedicated workouts to calculate peak strain or track sleep curves for morning recovery
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Workout Button */}
              <button
                onClick={() => handleStartSession('workout')}
                className="group p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/30 hover:border-rose-500/60 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-whoop-crimson/20 border border-whoop-crimson/40 text-whoop-crimson flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">Start Workout</h3>
                    <p className="text-xs text-whoop-muted">Tracks strain, zone distribution & active calories</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-whoop-crimson text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
              </button>

              {/* Start Sleep Button */}
              <button
                onClick={() => handleStartSession('sleep')}
                className="group p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-cyan-500/30 hover:border-cyan-500/60 transition-all text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-whoop-cyan/20 border border-whoop-cyan/40 text-whoop-cyan flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Start Sleep Session</h3>
                    <p className="text-xs text-whoop-muted">Monitors nocturnal HR dips & HRV recovery baseline</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-whoop-cyan text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Active Recording View */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-whoop-border/60">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-whoop-crimson animate-ping" />
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="bg-transparent text-lg font-extrabold text-white border-b border-dashed border-slate-600 focus:outline-none focus:border-whoop-cyan"
                />
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-whoop-surface text-slate-300">
                  {activeSessionType}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiscard}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-whoop-surface hover:bg-whoop-hover text-slate-400 hover:text-white transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleStopAndSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-whoop-crimson hover:bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Stop & Save Session</span>
                </button>
              </div>
            </div>

            {/* Live Stats Counter Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-whoop-surface/80 border border-whoop-border/60">
                <div className="text-[10px] font-bold uppercase text-whoop-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Elapsed Time</span>
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {formatSec(elapsedSec)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-whoop-surface/80 border border-whoop-border/60">
                <div className="text-[10px] font-bold uppercase text-whoop-muted flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-whoop-crimson" />
                  <span>Current BPM</span>
                </div>
                <div className="text-2xl font-black font-mono text-whoop-crimson mt-1">
                  {metrics.currentHr}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-whoop-surface/80 border border-whoop-border/60">
                <div className="text-[10px] font-bold uppercase text-whoop-muted flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-whoop-cyan" />
                  <span>Session Samples</span>
                </div>
                <div className="text-2xl font-black font-mono text-whoop-cyan mt-1">
                  {sessionSamples.length}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-whoop-surface/80 border border-whoop-border/60">
                <div className="text-[10px] font-bold uppercase text-whoop-muted flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Active Cals</span>
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {metrics.activeCalories} <span className="text-xs text-slate-400">kcal</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Sessions List */}
      <div className="p-5 rounded-2xl bg-whoop-card border border-whoop-border/80 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-whoop-cyan" />
            <h3 className="text-base font-bold text-white tracking-wide">Saved Sessions & Logs</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {sessions.length} Recorded
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-whoop-muted rounded-xl bg-whoop-surface/50 border border-dashed border-whoop-border">
            <p>No activity sessions recorded yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Start a workout or sleep session above to record and export session telemetry.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => {
              const isExpanded = expandedSessionId === s.id;
              const dateStr = new Date(s.startTime).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={s.id}
                  className="rounded-xl bg-whoop-surface/60 border border-whoop-border/80 overflow-hidden transition-all hover:border-slate-600"
                >
                  <div className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        s.type === 'workout'
                          ? 'bg-rose-500/10 border-rose-500/30 text-whoop-crimson'
                          : s.type === 'sleep'
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-whoop-cyan'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-whoop-green'
                      }`}>
                        {s.type === 'workout' ? <Dumbbell className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{s.title}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-whoop-bg text-slate-400 uppercase">
                            {s.type}
                          </span>
                        </div>
                        <div className="text-xs text-whoop-muted mt-0.5">{dateStr}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="text-right">
                        <div className="text-slate-400 text-[10px]">Strain</div>
                        <div className="font-bold text-whoop-crimson">{s.strain}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-[10px]">Avg HR</div>
                        <div className="font-bold text-white">{s.avgHr} BPM</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-[10px]">Duration</div>
                        <div className="font-bold text-white">{formatSec(s.durationSec)}</div>
                      </div>

                      <button
                        onClick={() => setExpandedSessionId(isExpanded ? null : s.id)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-whoop-bg/50 border-t border-whoop-border/60 space-y-4">
                      <div>
                        <div className="text-xs font-bold text-slate-300 mb-2">Zone Distribution</div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {zones.map((z) => {
                            const zSec = s.zoneDistribution[z.zone] || 0;
                            const pct = s.durationSec > 0 ? Math.round((zSec / s.durationSec) * 100) : 0;
                            return (
                              <div key={z.zone} className="p-2 rounded-lg bg-whoop-card border border-whoop-border/60 text-center">
                                <div className="text-[10px] font-semibold" style={{ color: z.color }}>{z.name.split(':')[0]}</div>
                                <div className="text-xs font-mono font-bold text-white mt-0.5">{formatSec(zSec)}</div>
                                <div className="text-[10px] font-mono text-slate-500">{pct}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-whoop-border/40">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => storageService.exportSessionToCSV(s)}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-whoop-card hover:bg-whoop-hover text-slate-200 border border-whoop-border transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Export CSV</span>
                          </button>
                          <button
                            onClick={() => storageService.exportSessionToJSON(s)}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-whoop-card hover:bg-whoop-hover text-slate-200 border border-whoop-border transition-colors"
                          >
                            <FileCode className="w-3.5 h-3.5 text-whoop-cyan" />
                            <span>Export JSON</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
