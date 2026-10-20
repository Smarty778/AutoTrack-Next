'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TrackerRecord } from '../types';
import { SPREADSHEET_COLUMNS } from '../data/mockData';
import { 
  Phone, 
  MessageSquare, 
  Edit3, 
  Printer, 
  UserCheck, 
  ExternalLink,
  Calendar,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Check,
  Shield,
  Lock,
  Clock
} from 'lucide-react';

interface RecordTableProps {
  onEditRecord: (record: TrackerRecord) => void;
  onPrintJobCard: (record: TrackerRecord) => void;
  onOpenPermissionsModal?: () => void;
}

export const RecordTable: React.FC<RecordTableProps> = ({
  onEditRecord,
  onPrintJobCard,
  onOpenPermissionsModal,
}) => {
  const { 
    visibleRecords, 
    selectedRecordIds, 
    toggleSelectRecord, 
    selectAllRecords,
    currentUser,
    users,
    assignRecords,
    updateRecord,
    agentPermissions,
    lastStatusChange
  } = useApp();

  const [columnVisibilityMenuOpen, setColumnVisibilityMenuOpen] = useState(false);
  const [visibleColKeys, setVisibleColKeys] = useState<string[]>(
    SPREADSHEET_COLUMNS.map(c => c.key)
  );

  const today = new Date().toISOString().split('T')[0];
  const canEditStatus = currentUser.role === 'admin' || agentPermissions.canEditStatus;

  const allSelected = visibleRecords.length > 0 && visibleRecords.every(r => selectedRecordIds.includes(r.id));
  const someSelected = visibleRecords.some(r => selectedRecordIds.includes(r.id)) && !allSelected;

  const toggleColumn = (key: string) => {
    setVisibleColKeys(prev => 
      prev.includes(key) 
        ? (prev.length > 3 ? prev.filter(k => k !== key) : prev) 
        : [...prev, key]
    );
  };

  const getStatusRowClass = (status: TrackerRecord['status']) => {
    switch (status) {
      case 'Continued':
        return 'bg-emerald-100/75 hover:bg-emerald-200/70 border-l-4 border-l-emerald-600 text-slate-900';
      case 'Pending':
        return 'bg-amber-100/75 hover:bg-amber-200/70 border-l-4 border-l-amber-600 text-slate-900';
      case 'Removal':
        return 'bg-orange-100/75 hover:bg-orange-200/70 border-l-4 border-l-orange-600 text-slate-900';
      case 'Removed':
        return 'bg-rose-200/95 hover:bg-rose-300 border-l-4 border-l-rose-800 text-rose-950 font-medium';
      case 'In Progress':
        return 'bg-sky-100/75 hover:bg-sky-200/70 border-l-4 border-l-sky-600 text-slate-900';
      default:
        return 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent text-slate-800';
    }
  };

  // 100% Opaque backgrounds for sticky freeze columns to completely prevent horizontal scrolling text bleed-through & overlapping
  const getStickyColBg = (status: TrackerRecord['status'], isSelected: boolean) => {
    if (isSelected) return 'bg-[#bfdbfe]'; // blue-200 solid
    switch (status) {
      case 'Continued':
        return 'bg-[#d1fae5]'; // emerald-100 solid
      case 'Pending':
        return 'bg-[#fef3c7]'; // amber-100 solid
      case 'Removal':
        return 'bg-[#ffedd5]'; // orange-100 solid
      case 'Removed':
        return 'bg-[#fecdd3]'; // rose-200 solid (darker tone)
      case 'In Progress':
        return 'bg-[#e0f2fe]'; // sky-100 solid
      default:
        return 'bg-white';
    }
  };

  const getStatusDropdownClass = (status: TrackerRecord['status']) => {
    switch (status) {
      case 'Continued':
        return 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200';
      case 'Pending':
        return 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200';
      case 'Removal':
        return 'bg-orange-100 text-orange-900 border-orange-400 hover:bg-orange-200';
      case 'Removed':
        return 'bg-rose-400 text-rose-950 border-rose-600 font-black hover:bg-rose-500 line-through';
      case 'In Progress':
        return 'bg-sky-100 text-sky-900 border-sky-400 hover:bg-sky-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusBadgeClass = (status: TrackerRecord['status']) => {
    switch (status) {
      case 'Continued':
        return 'text-emerald-800 font-bold bg-emerald-100/90 px-2 py-0.5 rounded text-[11px] border border-emerald-300 shadow-2xs whitespace-nowrap';
      case 'Pending':
        return 'text-amber-800 font-bold bg-amber-100/90 px-2 py-0.5 rounded text-[11px] border border-amber-300 shadow-2xs whitespace-nowrap';
      case 'Removal':
        return 'text-orange-800 font-bold bg-orange-100/90 px-2 py-0.5 rounded text-[11px] border border-orange-300 shadow-2xs whitespace-nowrap';
      case 'Removed':
        return 'text-rose-950 font-black bg-rose-300/90 px-2 py-0.5 rounded text-[11px] border border-rose-500 shadow-2xs whitespace-nowrap line-through';
      case 'In Progress':
        return 'text-sky-800 font-bold bg-sky-100/90 px-2 py-0.5 rounded text-[11px] border border-sky-300 shadow-2xs whitespace-nowrap';
      default:
        return 'text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]';
    }
  };

  const formatStatusTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Today, ${timeStr}`;
      }
      const dateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
      return `${dateStr}, ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  const getTrackerStatusClass = (tStatus: TrackerRecord['trackerStatus']) => {
    switch (tStatus) {
      case 'Active':
        return 'text-emerald-700 font-semibold';
      case 'NR':
        return 'text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[11px] border border-red-200';
      case 'Testing':
        return 'text-amber-700 font-medium';
      case 'Standby':
        return 'text-slate-600 font-medium';
      case 'Removed':
        return 'text-rose-700 font-medium';
      case 'Decommissioned':
        return 'text-slate-400';
      default:
        return 'text-slate-500';
    }
  };

  // WhatsApp quick launcher
  const openWhatsApp = (phone: string, record: TrackerRecord) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum ${record.customerName}, this is regarding your vehicle tracker (${record.make} ${record.model} - Reg ${record.regNo}) with AutoTrack.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full flex flex-col">
      
      {/* Table Header Controls bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            {currentUser.role === 'admin' ? 'Master Spreadsheet View' : `Assigned Leads (${currentUser.name})`}
          </span>
          <span className="text-slate-400">&middot;</span>
          <span className="font-mono-numbers text-slate-500 font-medium">
            Showing {visibleRecords.length} record{visibleRecords.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Agent Permissions quick badge / button */}
          {currentUser.role === 'admin' && onOpenPermissionsModal && (
            <button
              type="button"
              onClick={onOpenPermissionsModal}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md font-medium transition-colors cursor-pointer shadow-2xs"
              title="Admin Access Control: Configure what fields agents are permitted to edit"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Agent Rights Policy</span>
            </button>
          )}

          {currentUser.role === 'user' && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md shadow-2xs">
              <Shield className="w-3 h-3 text-blue-600" />
              <span>
                Edit Rights: {agentPermissions.canEditStatus ? 'Status' : ''}
                {agentPermissions.canEditRemarks ? ' &middot; Notes' : ''}
                {agentPermissions.canEditDueDate ? ' &middot; Due Date' : ''}
                {agentPermissions.canEditVehicleSpecs ? ' &middot; Specs' : ''}
                {!agentPermissions.canEditStatus && !agentPermissions.canEditRemarks && !agentPermissions.canEditVehicleSpecs && 'Read-Only'}
              </span>
            </div>
          )}

          {/* Column Visibility Manager */}
          <button
            type="button"
            onClick={() => setColumnVisibilityMenuOpen(!columnVisibilityMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Customize Columns ({visibleColKeys.length}/26)</span>
          </button>

          {columnVisibilityMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setColumnVisibilityMenuOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-1.5 w-72 max-h-80 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-30">
                <div className="flex items-center justify-between px-2 py-1 pb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-800 text-xs">Spreadsheet Columns</span>
                  <button 
                    onClick={() => setVisibleColKeys(SPREADSHEET_COLUMNS.map(c => c.key))}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Show All
                  </button>
                </div>
                <div className="py-1">
                  {SPREADSHEET_COLUMNS.map(col => {
                    const isChecked = visibleColKeys.includes(col.key);
                    return (
                      <label 
                        key={col.key}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded text-slate-900 focus:ring-slate-900 border-slate-300 w-3.5 h-3.5"
                        />
                        <span className="text-slate-700 truncate">{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Last Status Change Activity Banner */}
      {lastStatusChange && (
        <div className="px-4 py-2 bg-slate-900 text-white border-b border-slate-750 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Latest Status Activity:
            </span>
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono-numbers">
              <span className="text-slate-400 text-[10px]">Record ID:</span>
              <span className="font-bold text-amber-300">#{lastStatusChange.recordId}</span>
              <span className="text-slate-200 font-semibold font-sans">({lastStatusChange.regNo})</span>
            </div>
            <span className="text-slate-500">&rarr;</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getStatusDropdownClass(lastStatusChange.newStatus)}`}>
              {lastStatusChange.newStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono-numbers text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded">
              <span className="text-slate-400 text-[10px]">Changed By User ID:</span>
              <span className="font-bold text-sky-300">@{lastStatusChange.changedByUsername || lastStatusChange.changedByUserId}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatStatusTimestamp(lastStatusChange.timestamp)}</span>
            </div>
          </div>
        </div>
      )}

      {/* High-Density Spreadsheet Container with Horizontal & Vertical Scroll - Fit to Screen */}
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] min-h-[420px] w-full">
        <table className="min-w-full w-max text-left text-xs border-collapse">
          
          {/* Header Row */}
          <thead className="bg-slate-100 text-slate-700 sticky top-0 z-30 border-b border-slate-200 select-none">
            <tr>
              {/* Checkbox Header (Sticky Left) */}
              <th className="w-11 min-w-[44px] max-w-[44px] px-2 py-2.5 text-center sticky left-0 z-40 bg-slate-100 border-r border-slate-200">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => selectAllRecords(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  title="Select / Deselect all visible records"
                />
              </th>

              {/* Actions Header (Sticky Left) */}
              <th className="w-28 min-w-[112px] max-w-[112px] px-2 py-2.5 font-semibold text-slate-700 border-r border-slate-300 text-center sticky left-[44px] z-40 bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)]">
                Actions
              </th>

              {/* 26 Exact Spreadsheet Headers */}
              {SPREADSHEET_COLUMNS.filter(c => visibleColKeys.includes(c.key)).map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap ${col.width}`}
                >
                  <span className="leading-tight">{col.label}</span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleRecords.length === 0 ? (
              <tr>
                <td 
                  colSpan={visibleColKeys.length + 2} 
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <SlidersHorizontal className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">No records found matching filters</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {currentUser.role === 'user'
                        ? 'No records currently assigned to your salesperson ID.'
                        : 'Try adjusting your search query, salesperson selection, or status filters.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleRecords.map((rec) => {
                const isSelected = selectedRecordIds.includes(rec.id);
                const isOverdue = rec.dueDate && rec.dueDate < today && rec.status !== 'Continued' && rec.status !== 'Removed' && rec.status !== 'Removal';
                const isDueToday = rec.dueDate === today && rec.status !== 'Continued' && rec.status !== 'Removed' && rec.status !== 'Removal';
                const rowColorClass = getStatusRowClass(rec.status);
                const isRemoved = rec.status === 'Removed';
                const textStrikeClass = isRemoved ? 'line-through decoration-rose-900/70 decoration-2' : '';
                const stickyBg = getStickyColBg(rec.status, isSelected);

                return (
                  <tr
                    key={rec.id}
                    className={`transition-colors h-11 ${rowColorClass} ${
                      isSelected ? 'ring-2 ring-inset ring-blue-500 font-semibold' : ''
                    }`}
                  >
                    {/* Checkbox (Sticky Left) */}
                    <td className={`w-11 min-w-[44px] max-w-[44px] px-2 py-2 text-center sticky left-0 z-20 border-r border-slate-200 ${stickyBg}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRecord(rec.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </td>

                    {/* Action buttons (Sticky Left) */}
                    <td className={`w-28 min-w-[112px] max-w-[112px] px-2 py-2 border-r border-slate-300 sticky left-[44px] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] ${stickyBg}`}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditRecord(rec)}
                          className="p-1 rounded text-slate-700 hover:text-slate-950 hover:bg-black/10 transition-colors cursor-pointer"
                          title={
                            currentUser.role === 'admin'
                              ? 'View / Edit All 26 Fields'
                              : Object.values(agentPermissions).some(Boolean)
                              ? 'Edit Permitted Fields'
                              : 'View Vehicle Record (Read-Only)'
                          }
                        >
                          {currentUser.role === 'admin' || Object.values(agentPermissions).some(Boolean) ? (
                            <Edit3 className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onPrintJobCard(rec)}
                          className="p-1 rounded text-slate-700 hover:text-slate-950 hover:bg-black/10 transition-colors"
                          title="Print Technician Work Order / Job Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {rec.contact1 && (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(rec.contact1, rec)}
                            className="p-1 rounded text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/50 transition-colors"
                            title="Direct WhatsApp Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Columns rendered according to visibility */}
                    {visibleColKeys.includes('regNo') && (
                      <td className={`px-3 py-2 font-mono-numbers font-semibold text-slate-900 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.regNo}
                      </td>
                    )}

                    {visibleColKeys.includes('customerName') && (
                      <td className={`px-3 py-2 font-medium text-slate-900 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.customerName}
                      </td>
                    )}

                    {visibleColKeys.includes('make') && (
                      <td className={`px-3 py-2 text-slate-700 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.make}
                      </td>
                    )}

                    {visibleColKeys.includes('model') && (
                      <td className={`px-3 py-2 text-slate-700 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.model}
                      </td>
                    )}

                    {visibleColKeys.includes('year') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-600 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.year}
                      </td>
                    )}

                    {visibleColKeys.includes('color') && (
                      <td className={`px-3 py-2 text-slate-600 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.color}
                      </td>
                    )}

                    {visibleColKeys.includes('contact1') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-700 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        <div className="flex items-center gap-1.5">
                          <span>{rec.contact1}</span>
                          <a 
                            href={`tel:${rec.contact1.replace(/[^0-9+]/g, '')}`} 
                            className="text-slate-400 hover:text-blue-600 p-0.5 no-underline"
                            title="Call Phone"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    )}

                    {visibleColKeys.includes('contactPerson') && (
                      <td className={`px-3 py-2 text-slate-600 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.contactPerson || '-'}
                      </td>
                    )}

                    {visibleColKeys.includes('engine') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-600 whitespace-nowrap border-r border-slate-100 text-[11px] ${textStrikeClass}`}>
                        {rec.engine}
                      </td>
                    )}

                    {visibleColKeys.includes('chassis') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-600 whitespace-nowrap border-r border-slate-100 text-[11px] ${textStrikeClass}`}>
                        {rec.chassis}
                      </td>
                    )}

                    {visibleColKeys.includes('insurance') && (
                      <td className={`px-3 py-2 text-slate-600 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.insurance}
                      </td>
                    )}

                    {visibleColKeys.includes('date') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-600 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.date}
                      </td>
                    )}

                    {/* Sales Person Column */}
                    {visibleColKeys.includes('salesPerson') && (
                      <td className={`px-3 py-2 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        <span className={`font-medium ${
                          !rec.salesPerson || rec.salesPerson === 'Unassigned' 
                            ? 'text-slate-400' 
                            : 'text-slate-800'
                        }`}>
                          {rec.salesPerson || '-'}
                        </span>
                      </td>
                    )}

                    {visibleColKeys.includes('technicianName') && (
                      <td className={`px-3 py-2 text-slate-700 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.technicianName}
                      </td>
                    )}

                    {visibleColKeys.includes('orderNo') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-600 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.orderNo}
                      </td>
                    )}

                    {visibleColKeys.includes('instCity') && (
                      <td className={`px-3 py-2 text-slate-700 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.instCity}
                      </td>
                    )}

                    {visibleColKeys.includes('showroom') && (
                      <td className={`px-3 py-2 text-slate-600 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.showroom}
                      </td>
                    )}

                    {visibleColKeys.includes('cnicNo') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-600 whitespace-nowrap border-r border-slate-100 text-[11px] ${textStrikeClass}`}>
                        {rec.cnicNo || '-'}
                      </td>
                    )}

                    {visibleColKeys.includes('insStatus') && (
                      <td className={`px-3 py-2 text-slate-600 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.insStatus}
                      </td>
                    )}

                    {visibleColKeys.includes('dateOfInstallation') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-700 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.dateOfInstallation || '-'}
                      </td>
                    )}

                    {/* Due Date Column with Overdue / Today alert styling */}
                    {visibleColKeys.includes('dueDate') && (
                      <td className={`px-3 py-2 font-mono-numbers whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        <div className="flex items-center gap-1">
                          <span className={
                            isOverdue 
                              ? 'text-red-700 font-bold bg-red-100/70 px-1 py-0.5 rounded' 
                              : isDueToday 
                              ? 'text-amber-800 font-bold bg-amber-100/70 px-1 py-0.5 rounded' 
                              : 'text-slate-600'
                          }>
                            {rec.dueDate || '-'}
                          </span>
                          {isOverdue && <span className="text-[10px] text-red-600 font-sans font-bold no-underline">OVERDUE</span>}
                          {isDueToday && <span className="text-[10px] text-amber-700 font-sans font-bold no-underline">TODAY</span>}
                        </div>
                      </td>
                    )}

                    {/* Status Column with Inline Dropdown */}
                    {visibleColKeys.includes('status') && (
                      <td className="px-3 py-1.5 whitespace-nowrap border-r border-slate-100 no-underline">
                        <div className="flex items-center">
                          {canEditStatus ? (
                            <select
                              value={rec.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as TrackerRecord['status'];
                                updateRecord(rec.id, { 
                                  status: newStatus,
                                  statusChangedAt: new Date().toISOString(),
                                  statusChangedBy: currentUser.username || currentUser.name,
                                  statusChangedByUserId: currentUser.id,
                                  statusChangedRecordId: rec.id,
                                });
                              }}
                              className={`text-[11px] font-bold py-1 px-2.5 rounded-md border cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors shadow-2xs ${getStatusDropdownClass(rec.status)}`}
                              title={rec.statusChangedAt ? `Status: ${rec.status} | Last Changed: ${new Date(rec.statusChangedAt).toLocaleString()} by @${rec.statusChangedBy || 'admin'}` : `Click to change status for ${rec.regNo}`}
                            >
                              <option value="Continued" className="bg-white text-emerald-800 font-semibold no-underline">Continued</option>
                              <option value="Pending" className="bg-white text-amber-800 font-semibold no-underline">Pending</option>
                              <option value="Removal" className="bg-white text-orange-800 font-semibold no-underline">Removal</option>
                              <option value="Removed" className="bg-white text-rose-800 font-semibold no-underline">Removed</option>
                              <option value="In Progress" className="bg-white text-sky-800 font-semibold no-underline">In Progress</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-1.5" title={rec.statusChangedAt ? `Status locked. Last changed: ${new Date(rec.statusChangedAt).toLocaleString()} by @${rec.statusChangedBy || 'admin'}` : 'Status change locked by administrator'}>
                              <span className={getStatusBadgeClass(rec.status)}>
                                {rec.status}
                              </span>
                              <Lock className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Dedicated Column: Last Status Updated (Time & ID) */}
                    {visibleColKeys.includes('statusChangedAt') && (
                      <td className={`px-3 py-2 font-mono-numbers text-[11px] whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.statusChangedAt ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{formatStatusTimestamp(rec.statusChangedAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="bg-slate-100/90 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                Record ID: #{rec.id}
                              </span>
                              <span className="text-slate-400">&middot;</span>
                              <span className="text-blue-700 font-bold" title={`Actor User ID: ${rec.statusChangedBy || 'admin'}`}>
                                By: @{rec.statusChangedBy || 'admin'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Initial Setup (No status change)</span>
                        )}
                      </td>
                    )}

                    {/* Coordinated by Column with Matching Inline Dropdown (No Unassigned) */}
                    {visibleColKeys.includes('coordinatedBy') && (
                      <td className="px-3 py-2 whitespace-nowrap border-r border-slate-100 no-underline">
                        {currentUser.role === 'admin' ? (
                          <select
                            value={rec.assignedToUserId || users.find(u => u.name.toLowerCase() === (rec.coordinatedBy || '').toLowerCase())?.id || users[0]?.id}
                            onChange={(e) => {
                              const newUserId = e.target.value;
                              const targetUser = users.find(u => u.id === newUserId);
                              if (targetUser) {
                                assignRecords([rec.id], targetUser.id, targetUser.name);
                              }
                            }}
                            className="text-[11px] font-semibold py-1 px-2 rounded-md border border-slate-300 bg-white text-slate-800 hover:border-slate-400 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors shadow-2xs"
                            title="Click to directly assign coordinator"
                          >
                            {users.filter(u => u.active).map(u => (
                              <option key={u.id} value={u.id} className="text-slate-800 bg-white font-medium">
                                {u.name} ({u.role.toUpperCase()})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className={`flex items-center gap-1.5 ${textStrikeClass}`}>
                            <span className="font-semibold text-slate-800">
                              {rec.coordinatedBy || users.find(u => u.id === rec.assignedToUserId)?.name || '-'}
                            </span>
                            <Lock className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                      </td>
                    )}

                    {visibleColKeys.includes('remarks') && (
                      <td className={`px-3 py-2 text-slate-500 whitespace-nowrap border-r border-slate-100 max-w-xs truncate ${textStrikeClass}`} title={rec.remarks}>
                        {rec.remarks || '-'}
                      </td>
                    )}

                    {visibleColKeys.includes('unit') && (
                      <td className={`px-3 py-2 font-mono-numbers text-slate-700 whitespace-nowrap border-r border-slate-100 ${textStrikeClass}`}>
                        {rec.unit}
                      </td>
                    )}

                    {visibleColKeys.includes('trackerStatus') && (
                      <td className={`px-3 py-2 whitespace-nowrap ${textStrikeClass}`}>
                        <span className={getTrackerStatusClass(rec.trackerStatus)}>
                          {rec.trackerStatus}
                        </span>
                      </td>
                    )}

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet Bottom Status Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <div>
          <span>Tip: Use the checkboxes on the left to assign multiple vehicles to any sales person simultaneously.</span>
        </div>
        <div className="flex items-center gap-2.5 font-mono-numbers flex-wrap">
          <span className="text-emerald-700 font-semibold">Continued: {visibleRecords.filter(r => r.status === 'Continued').length}</span>
          <span>&middot;</span>
          <span className="text-amber-700 font-semibold">Pending: {visibleRecords.filter(r => r.status === 'Pending').length}</span>
          <span>&middot;</span>
          <span className="text-orange-700 font-semibold">Removal: {visibleRecords.filter(r => r.status === 'Removal').length}</span>
          <span>&middot;</span>
          <span className="text-rose-700 font-semibold">Removed: {visibleRecords.filter(r => r.status === 'Removed').length}</span>
          <span>&middot;</span>
          <span className="text-sky-700 font-semibold">In Progress: {visibleRecords.filter(r => r.status === 'In Progress').length}</span>
        </div>
      </div>

    </div>
  );
};
