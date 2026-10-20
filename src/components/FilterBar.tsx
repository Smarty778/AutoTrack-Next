'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  X, 
  RotateCcw
} from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { filters, setFilter, resetFilters, activeFilterCount, users, currentUser } = useApp();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs w-full">
      
      {/* Search Input Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-3.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search by Reg No., Customer Name, Contact #1, Chassis, Engine, CNIC, Order No..."
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap self-start md:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''}</span>
          </button>
        )}
      </div>

      {/* Structured Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 w-full">
        
        {/* 1. SALES PERSON FILTER */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sales Person
          </label>
          {currentUser.role === 'admin' ? (
            <select
              value={filters.salesPerson}
              onChange={(e) => setFilter('salesPerson', e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
            >
              <option value="all">All Sales Persons</option>
              <option value="unassigned">⚠️ Unassigned Fleet</option>
              <optgroup label="Active Sales Reps">
                {users.filter(u => u.role === 'user').map(u => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.city?.split(' ')[0] || 'Sales'})
                  </option>
                ))}
              </optgroup>
            </select>
          ) : (
            <div className="text-xs py-1.5 px-2 bg-slate-100 border border-slate-200 rounded-md text-slate-600 font-medium truncate">
              {currentUser.name} (Assigned Only)
            </div>
          )}
        </div>

        {/* 2. OPERATIONAL STATUS FILTER (Continued / Pending / Removal) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Service Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="Continued">Continued</option>
            <option value="Pending">Pending</option>
            <option value="Removal">Removal</option>
            <option value="Removed">Removed</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>

        {/* 3. DUE DATE FILTER */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Due Date / Deadline
          </label>
          <select
            value={filters.dueDatePreset}
            onChange={(e) => setFilter('dueDatePreset', e.target.value as any)}
            className={`w-full text-xs py-1.5 px-2 bg-slate-50 border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 ${
              filters.dueDatePreset === 'overdue' ? 'border-red-300 text-red-700 bg-red-50/40 font-semibold' : 'border-slate-200 text-slate-800'
            }`}
          >
            <option value="all">All Due Dates</option>
            <option value="overdue">🚨 Overdue Only</option>
            <option value="today">📅 Due Today</option>
            <option value="next_7_days">🗓️ Due In Next 7 Days</option>
            <option value="has_due_date">Has Due Date</option>
            <option value="no_due_date">No Due Date</option>
          </select>
        </div>

        {/* 4. TRACKER STATUS FILTER (Active vs NR) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tracker Status
          </label>
          <select
            value={filters.trackerStatus}
            onChange={(e) => setFilter('trackerStatus', e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 font-medium"
          >
            <option value="all">All Tracker States</option>
            <option value="Active">🟢 Active (Reporting)</option>
            <option value="NR">🔴 NR (Not Reporting)</option>
            <option value="Testing">🟡 Testing</option>
            <option value="Standby">Standby</option>
            <option value="Removed">Removed</option>
            <option value="Decommissioned">Decommissioned</option>
          </select>
        </div>

        {/* 5. DATE OF INSTALLATION FILTER */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Installation Date
          </label>
          <select
            value={filters.instDatePreset}
            onChange={(e) => setFilter('instDatePreset', e.target.value as any)}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Install Dates</option>
            <option value="today">Installed Today</option>
            <option value="this_week">Past 7 Days</option>
            <option value="this_month">This Month</option>
          </select>
        </div>

        {/* 6. INSTALLATION CITY FILTER */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            City
          </label>
          <select
            value={filters.instCity}
            onChange={(e) => setFilter('instCity', e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
          >
            <option value="all">All Cities</option>
            <option value="Karachi">Karachi</option>
            <option value="Lahore">Lahore</option>
            <option value="Islamabad">Islamabad</option>
            <option value="Rawalpindi">Rawalpindi</option>
            <option value="Faisalabad">Faisalabad</option>
            <option value="Multan">Multan</option>
            <option value="Peshawar">Peshawar</option>
          </select>
        </div>

      </div>

    </div>
  );
};
