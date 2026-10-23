'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  X, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { filters, setFilter, resetFilters, activeFilterCount, users, currentUser, records } = useApp();
  const cityMap = new Map<string, string>();
  records.forEach((record) => { const city = (record.instCity || '').trim(); if (city) cityMap.set(city.toLowerCase(), city); });
  const cityOptions = Array.from(cityMap.values());
  if (filters.instCity !== 'all' && filters.instCity && !cityOptions.some((city) => city.toLowerCase() === filters.instCity.toLowerCase())) cityOptions.push(filters.instCity);
  cityOptions.sort((a, b) => a.localeCompare(b));
  const [mobileExpanded, setMobileExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs w-full">
      
      {/* Search Input Row */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search Reg No., Customer, Contact #1, Chassis, Order..."
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-800 placeholder-slate-400 min-h-[40px]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile controls & Reset button row */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className={`md:hidden flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors min-h-[40px] cursor-pointer ${
              activeFilterCount > 0 || mobileExpanded
                ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            {mobileExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap min-h-[40px] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Structured Filter Selectors Grid */}
      <div className={`${mobileExpanded ? 'grid' : 'hidden md:grid'} grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 pt-3 mt-3 border-t border-slate-100 w-full animate-in fade-in duration-100`}>
        
        {/* 1. SALES PERSON FILTER */}
        <div>
          <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Sales Person
          </label>
          {currentUser.role === 'admin' ? (
            <select
              value={filters.salesPerson}
              onChange={(e) => setFilter('salesPerson', e.target.value)}
              className="w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 min-h-[38px] cursor-pointer"
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
            <div className="text-xs py-2 px-2 bg-slate-100 border border-slate-200 rounded-md text-slate-600 font-medium truncate min-h-[38px] flex items-center">
              {currentUser.name} (Assigned Only)
            </div>
          )}
        </div>

        {/* 2. OPERATIONAL STATUS FILTER */}
        <div>
          <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Service Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 min-h-[38px] cursor-pointer"
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
          <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Due Date / Deadline
          </label>
          <select
            value={filters.dueDatePreset}
            onChange={(e) => setFilter('dueDatePreset', e.target.value as any)}
            className={`w-full text-xs py-2 px-2 bg-slate-50 border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 min-h-[38px] cursor-pointer ${
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

        {/* 4. TRACKER STATUS FILTER */}
        <div>
          <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tracker Status
          </label>
          <select
            value={filters.trackerStatus}
            onChange={(e) => setFilter('trackerStatus', e.target.value)}
            className="w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 font-medium min-h-[38px] cursor-pointer"
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
          <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Install Date
          </label>
          <select
            value={filters.instDatePreset}
            onChange={(e) => setFilter('instDatePreset', e.target.value as any)}
            className="w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 min-h-[38px] cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Installed Today</option>
            <option value="this_week">Past 7 Days</option>
            <option value="this_month">This Month</option>
          </select>
        </div>

        {/* 6. INSTALLATION CITY FILTER */}
        <div>
          <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            City
          </label>
          <select
            value={filters.instCity}
            onChange={(e) => setFilter('instCity', e.target.value)}
            className="w-full text-xs py-2 px-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800 min-h-[38px] cursor-pointer"
          >
            <option value="all">All Cities</option>
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

      </div>

    </div>
  );
};