'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AuditLogEntry } from '../types';
import { CalendarDays, History, Search, User, Clock, RotateCcw } from 'lucide-react';

type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'this_month' | 'custom';
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const actionStyle = (action: string) => {
  const value = action.toLowerCase();
  if (value.includes('delete') || value.includes('remov') || value.includes('factory reset')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (value.includes('create') || value.includes('register') || value.includes('completed')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (value.includes('permission') || value.includes('preset') || value.includes('access')) return 'bg-violet-50 text-violet-700 border-violet-200';
  if (value.includes('password') || value.includes('login') || value.includes('logout')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (value.includes('status') || value.includes('assign') || value.includes('update')) return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApp();
  const [logSearch, setLogSearch] = useState('');
  const [remoteLogs, setRemoteLogs] = useState<AuditLogEntry[] | null>(null);
  const [remoteTotal, setRemoteTotal] = useState<number | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const now = new Date();
    const startOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const endOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    let from = '';
    let to = '';
    if (datePreset === 'today') { from = startOf(now); to = endOf(now); }
    if (datePreset === 'yesterday') { from = startOf(yesterday); to = endOf(yesterday); }
    if (datePreset === 'last7') { const first = new Date(now); first.setDate(first.getDate() - 6); from = startOf(first); to = endOf(now); }
    if (datePreset === 'this_month') { from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); to = endOf(now); }
    if (datePreset === 'custom') {
      if (fromDate) from = new Date(`${fromDate}T00:00:00`).toISOString();
      if (toDate) to = new Date(`${toDate}T23:59:59.999`).toISOString();
    }
    const params = new URLSearchParams({ take: '5000' });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (logSearch.trim()) params.set('search', logSearch.trim());
    const timer = window.setTimeout(() => {
      fetch(`/api/audit-logs?${params.toString()}`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error('Audit API unavailable');
          return response.json();
        })
        .then((data) => {
          if (cancelled) return;
          if (data?.success && Array.isArray(data.logs)) {
            setRemoteLogs(data.logs);
            setRemoteTotal(typeof data.total === 'number' ? data.total : data.logs.length);
          } else if (Array.isArray(data)) {
            setRemoteLogs(data);
            setRemoteTotal(data.length);
          }
        })
        .catch((error) => { if (!cancelled && error?.name !== 'AbortError') { setRemoteLogs(null); setRemoteTotal(null); } });
    }, 180);
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); };
  }, [datePreset, fromDate, toDate, logSearch]);

  const sourceLogs = remoteLogs ?? auditLogs;

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const today = dateKey(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = dateKey(yesterdayDate);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const needle = logSearch.trim().toLowerCase();

    return sourceLogs.filter((log) => {
      const matchesSearch = !needle || [log.action, log.actorName, log.details, log.recordRegNo || '']
        .some((part) => part.toLowerCase().includes(needle));
      if (!matchesSearch) return false;
      const date = new Date(log.timestamp);
      if (Number.isNaN(date.getTime())) return datePreset === 'all';
      const key = dateKey(date);
      switch (datePreset) {
        case 'today': return key === today;
        case 'yesterday': return key === yesterday;
        case 'last7': return key >= dateKey(weekStart) && key <= today;
        case 'this_month': return key >= monthStart && key <= today;
        case 'custom': return (!fromDate || key >= fromDate) && (!toDate || key <= toDate);
        default: return true;
      }
    });
  }, [sourceLogs, logSearch, datePreset, fromDate, toDate]);

  const datePills: { value: DatePreset; label: string; cls: string }[] = [
    { value: 'all', label: 'All dates', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'today', label: 'Today', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    { value: 'yesterday', label: 'Yesterday', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    { value: 'last7', label: 'Last 7 days', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'this_month', label: 'This month', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    { value: 'custom', label: 'Custom range', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ];

  return (
    <section className="audit-view w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <header className="w-full border-b border-slate-200 bg-slate-50/90 p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
              <History className="h-4 w-4 shrink-0 text-slate-700" />
              <span>Audit Trail &amp; Record History</span>
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">{filteredLogs.length}</span>
            </h2>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500">Search user actions and review activity by date.</p>
          </div>
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={logSearch}
              onChange={(event) => setLogSearch(event.target.value)}
              placeholder="Search user, action, or Reg #…"
              className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" aria-label="Audit date filters">
          {datePills.map((pill) => (
            <button
              type="button"
              key={pill.value}
              onClick={() => setDatePreset(pill.value)}
              aria-pressed={datePreset === pill.value}
              className={`min-h-[32px] rounded-full border px-3 py-1 text-[10px] sm:text-[11px] font-semibold transition-colors ${pill.cls} ${datePreset === pill.value ? 'ring-2 ring-offset-1 ring-slate-400 shadow-sm' : 'opacity-75 hover:opacity-100'}`}
            >
              {pill.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setLogSearch(''); setDatePreset('all'); setFromDate(''); setToDate(''); }}
            className="ml-auto inline-flex min-h-[32px] items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>

        {datePreset === 'custom' && (
          <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:max-w-lg" aria-label="Custom date range">
            <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              From date
              <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-normal text-slate-800" />
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              To date
              <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="min-h-[38px] w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-normal text-slate-800" />
            </label>
          </div>
        )}
      </header>

      <div className="md:hidden max-h-[62dvh] min-h-0 space-y-2 overflow-y-auto bg-slate-50/60 p-2.5">
        {filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-400">No activity logs match these filters.</div>
        ) : filteredLogs.map((log) => {
          const date = new Date(log.timestamp);
          const time = Number.isNaN(date.getTime()) ? log.timestamp : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          return (
            <article key={log.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-900"><User className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{log.actorName}</span></div>
                <span className={`shrink-0 max-w-[56%] break-words rounded-md border px-2 py-1 text-[10px] font-semibold ${actionStyle(log.action)}`}>{log.action}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
                {log.recordRegNo && <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono font-semibold text-blue-700">{log.recordRegNo}</span>}
              </div>
              <p className="border-t border-slate-100 pt-2 leading-relaxed text-slate-600">{log.details}</p>
            </article>
          );
        })}
      </div>

      <div className="hidden md:block w-full overflow-x-auto overflow-y-auto max-h-[min(66dvh,760px)]">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-slate-700 select-none">
            <tr>
              <th className="w-48 px-4 py-3 font-semibold">Timestamp</th>
              <th className="w-44 px-4 py-3 font-semibold">Actor (User)</th>
              <th className="w-52 px-4 py-3 font-semibold">Action</th>
              <th className="w-36 px-4 py-3 font-semibold">Reg No.</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No activity logs match these filters.</td></tr>
            ) : filteredLogs.map((log) => {
              const date = new Date(log.timestamp);
              const time = Number.isNaN(date.getTime()) ? log.timestamp : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              return (
                <tr key={log.id} className="transition-colors hover:bg-sky-50/40">
                  <td className="whitespace-nowrap px-4 py-3 font-mono-numbers text-slate-500">{time}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{log.actorName}</td>
                  <td className="px-4 py-3"><span className={`inline-flex max-w-full rounded-md border px-2 py-1 text-[11px] font-semibold ${actionStyle(log.action)}`}>{log.action}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono-numbers font-semibold text-blue-700">{log.recordRegNo || '—'}</td>
                  <td className="px-4 py-3 leading-relaxed text-slate-600">{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500 sm:px-4">
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Showing up to 5,000 matching entries from the database.</span>
        <span className="font-medium text-slate-600">{filteredLogs.length} shown{remoteTotal !== null && remoteTotal > filteredLogs.length ? ` of ${remoteTotal}` : ''} {filteredLogs.length === 1 ? 'entry' : 'entries'}</span>
      </footer>
    </section>
  );
};
