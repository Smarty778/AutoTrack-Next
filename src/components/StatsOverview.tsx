'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Car, 
  CalendarClock, 
  Radio, 
  UserX,
  RotateCw,
  ArchiveX
} from 'lucide-react';

export const StatsOverview: React.FC = () => {
  const { visibleRecords, records, currentUser, filters, setFilter } = useApp();

  const today = new Date().toISOString().split('T')[0];

  const baseList = currentUser.role === 'admin' ? records : visibleRecords;
  const totalCount = baseList.length;
  
  // Status counts
  const continuedCount = baseList.filter(r => r.status === 'Continued').length;
  const removalCount = baseList.filter(r => r.status === 'Removal').length;
  const removedCount = baseList.filter(r => r.status === 'Removed').length;

  // Tracker status counts (Active vs NR)
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 w-full">
      
      {/* 1. Total Fleet / Assigned Records */}
      <div 
        onClick={() => {
          setFilter('status', 'all');
          setFilter('dueDatePreset', 'all');
          setFilter('trackerStatus', 'all');
        }}
        className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-medium text-slate-500 truncate mr-1">
            {currentUser.role === 'admin' ? 'Total Fleet' : 'Assigned Fleet'}
          </span>
          <Car className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono-numbers tracking-tight">
            {totalCount}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400">vehicles</span>
        </div>
        <div className="mt-1 text-[10px] sm:text-[11px] text-slate-500 truncate">
          {currentUser.role === 'admin' ? 'Master sheet' : 'Your portfolio'}
        </div>
      </div>

      {/* 2. Continued Service Subscriptions */}
      <div 
        onClick={() => setFilter('status', filters.status === 'Continued' ? 'all' : 'Continued')}
        className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all shadow-2xs flex flex-col justify-between active:scale-[0.99] ${
          filters.status === 'Continued' ? 'border-emerald-400 bg-emerald-50/50' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-medium text-slate-500 truncate mr-1">Continued</span>
          <RotateCw className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono-numbers tracking-tight">
            {continuedCount}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400">active</span>
        </div>
        <div className="mt-1 text-[10px] sm:text-[11px] text-slate-500 truncate">
          Ongoing service
        </div>
      </div>

      {/* 3. Due Date Alert / Overdue */}
      <div 
        onClick={() => setFilter('dueDatePreset', filters.dueDatePreset === 'overdue' ? 'all' : 'overdue')}
        className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all shadow-2xs flex flex-col justify-between active:scale-[0.99] ${
          filters.dueDatePreset === 'overdue' ? 'border-red-400 bg-red-50/50' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-medium text-slate-500 truncate mr-1">Overdue Follow-ups</span>
          <CalendarClock className="w-4 h-4 text-red-500 shrink-0" />
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-xl sm:text-2xl font-bold text-red-600 font-mono-numbers tracking-tight">
            {overdueCount}
          </span>
          {dueTodayCount > 0 && (
            <span className="text-[10px] sm:text-xs font-medium text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded font-mono-numbers whitespace-nowrap">
              +{dueTodayCount} today
            </span>
          )}
        </div>
        <div className="mt-1 text-[10px] sm:text-[11px] text-red-600 font-medium truncate">
          Needs attention
        </div>
      </div>

      {/* 4. Active vs NR (Not Reporting) Trackers */}
      <div 
        onClick={() => setFilter('trackerStatus', filters.trackerStatus === 'NR' ? 'all' : 'NR')}
        className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all shadow-2xs flex flex-col justify-between active:scale-[0.99] ${
          filters.trackerStatus === 'NR' ? 'border-amber-400 bg-amber-50/50' : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-medium text-slate-500 truncate mr-1">Active vs NR</span>
          <Radio className="w-4 h-4 text-slate-500 shrink-0" />
        </div>
        <div className="mt-1 flex items-baseline gap-1 font-mono-numbers">
          <span className="text-base sm:text-xl font-bold text-emerald-600">
            {activeCount} <span className="text-[9px] font-normal text-slate-400">Live</span>
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-base sm:text-xl font-bold text-red-600">
            {nrCount} <span className="text-[9px] font-normal text-slate-400">NR</span>
          </span>
        </div>
        <div className="mt-1 text-[10px] sm:text-[11px] text-slate-500 truncate">
          Filter Not Reporting
        </div>
      </div>

      {/* 5. Removals / Pending / Unassigned (Full width on mobile phones for symmetry) */}
      {currentUser.role === 'admin' ? (
        <div 
          onClick={() => setFilter('salesPerson', filters.salesPerson === 'unassigned' ? 'all' : 'unassigned')}
          className={`col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all shadow-2xs flex flex-col justify-between active:scale-[0.99] ${
            filters.salesPerson === 'unassigned' ? 'border-purple-400 bg-purple-50/50' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 truncate mr-1">Unassigned Fleet</span>
            <UserX className="w-4 h-4 text-purple-600 shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-purple-700 font-mono-numbers tracking-tight">
              {unassignedCount}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">awaiting coordinator</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-purple-700 font-medium truncate">
            Tap to assign to team member
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setFilter('status', filters.status === 'Removal' ? 'all' : 'Removal')}
          className={`col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-xl border cursor-pointer transition-all shadow-2xs flex flex-col justify-between active:scale-[0.99] ${
            filters.status === 'Removal' || filters.status === 'Removed' ? 'border-rose-400 bg-rose-50/40' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 truncate mr-1">Removal Queue</span>
            <ArchiveX className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-rose-600 font-mono-numbers tracking-tight">
              {removalCount + removedCount}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">({removalCount} req / {removedCount} done)</span>
          </div>
          <div className="mt-1 text-[10px] sm:text-[11px] text-slate-500 truncate">
            De-installation queue
          </div>
        </div>
      )}

    </div>
  );
};