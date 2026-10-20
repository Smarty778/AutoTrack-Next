'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Car, 
  CalendarClock, 
  Radio, 
  UserX,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  ArchiveX
} from 'lucide-react';

export const StatsOverview: React.FC = () => {
  const { visibleRecords, records, currentUser, filters, setFilter } = useApp();

  const today = new Date().toISOString().split('T')[0];

  const baseList = currentUser.role === 'admin' ? records : visibleRecords;
  const totalCount = baseList.length;
  
  // Status counts (Continued, Pending, Removal, Removed, In Progress)
  const continuedCount = baseList.filter(r => r.status === 'Continued').length;
  const pendingCount = baseList.filter(r => r.status === 'Pending').length;
  const removalCount = baseList.filter(r => r.status === 'Removal').length;
  const removedCount = baseList.filter(r => r.status === 'Removed').length;
  const inProgressCount = baseList.filter(r => r.status === 'In Progress').length;

  // Tracker status counts (Active vs NR - Not Reporting)
  const activeCount = baseList.filter(r => r.trackerStatus === 'Active').length;
  const nrCount = baseList.filter(r => r.trackerStatus === 'NR').length;

  // Overdue Due Dates
  const overdueCount = baseList.filter(
    r => r.dueDate && r.dueDate < today && r.status !== 'Continued' && r.status !== 'Removed' && r.status !== 'Removal'
  ).length;

  const dueTodayCount = baseList.filter(
    r => r.dueDate === today && r.status !== 'Continued' && r.status !== 'Removed' && r.status !== 'Removal'
  ).length;

  const unassignedCount = records.filter(
    r => !r.assignedToUserId || r.salesPerson.toLowerCase() === 'unassigned'
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
      
      {/* 1. Total Fleet / Assigned Records */}
      <div 
        onClick={() => {
          setFilter('status', 'all');
          setFilter('dueDatePreset', 'all');
          setFilter('trackerStatus', 'all');
        }}
        className="bg-white p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            {currentUser.role === 'admin' ? 'Total Fleet Records' : 'My Assigned Fleet'}
          </span>
          <Car className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 font-mono-numbers tracking-tight">
            {totalCount}
          </span>
          <span className="text-[11px] text-slate-400">vehicles</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          {currentUser.role === 'admin' ? 'Master tracker spreadsheet' : 'Allocated to your user ID'}
        </div>
      </div>

      {/* 2. Continued Service Subscriptions */}
      <div 
        onClick={() => setFilter('status', filters.status === 'Continued' ? 'all' : 'Continued')}
        className={`bg-white p-4 rounded-xl border cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
          filters.status === 'Continued' ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Continued Services</span>
          <RotateCw className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-600 font-mono-numbers tracking-tight">
            {continuedCount}
          </span>
          <span className="text-[11px] text-slate-400">continued</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Active ongoing subscriptions
        </div>
      </div>

      {/* 3. Due Date Alert / Overdue */}
      <div 
        onClick={() => setFilter('dueDatePreset', filters.dueDatePreset === 'overdue' ? 'all' : 'overdue')}
        className={`bg-white p-4 rounded-xl border cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
          filters.dueDatePreset === 'overdue' ? 'border-red-400 bg-red-50/30' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Overdue Follow-ups</span>
          <CalendarClock className="w-4 h-4 text-red-500" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-red-600 font-mono-numbers tracking-tight">
            {overdueCount}
          </span>
          {dueTodayCount > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded font-mono-numbers">
              +{dueTodayCount} due today
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-red-600 font-medium">
          Requires urgent attention
        </div>
      </div>

      {/* 4. Active vs NR (Not Reporting) Trackers */}
      <div 
        onClick={() => setFilter('trackerStatus', filters.trackerStatus === 'NR' ? 'all' : 'NR')}
        className={`bg-white p-4 rounded-xl border cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
          filters.trackerStatus === 'NR' ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Active vs NR (Offline)</span>
          <Radio className="w-4 h-4 text-slate-500" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-xl font-bold text-emerald-600 font-mono-numbers">
            {activeCount} <span className="text-xs font-normal text-slate-400">Active</span>
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-xl font-bold text-red-600 font-mono-numbers">
            {nrCount} <span className="text-xs font-normal text-slate-400">NR</span>
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Click to filter NR (Not Reporting)
        </div>
      </div>

      {/* 5. Removals / Pending / Unassigned */}
      {currentUser.role === 'admin' ? (
        <div 
          onClick={() => setFilter('salesPerson', filters.salesPerson === 'unassigned' ? 'all' : 'unassigned')}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
            filters.salesPerson === 'unassigned' ? 'border-purple-400 bg-purple-50/30' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Unassigned Vehicles</span>
            <UserX className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700 font-mono-numbers tracking-tight">
              {unassignedCount}
            </span>
            <span className="text-[11px] text-slate-400">need assignment</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-700 font-medium">
            Click to allocate to sales rep
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setFilter('status', filters.status === 'Removal' ? 'all' : 'Removal')}
          className={`bg-white p-4 rounded-xl border cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
            filters.status === 'Removal' || filters.status === 'Removed' ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Removal / Removed</span>
            <ArchiveX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono-numbers tracking-tight">
              {removalCount + removedCount}
            </span>
            <span className="text-[11px] text-slate-400">({removalCount} req / {removedCount} done)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            De-installation queue
          </div>
        </div>
      )}

    </div>
  );
};
