'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserCheck, 
  X, 
  Trash2, 
  Download
} from 'lucide-react';
import { TrackerRecord } from '../types';

interface BatchActionBarProps {
  onExportSelected: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({ onExportSelected }) => {
  const { 
    selectedRecordIds, 
    clearSelection, 
    assignRecords, 
    batchUpdateStatus,
    batchUpdateTrackerStatus,
    deleteRecords,
    users, 
    currentUser,
    agentPermissions
  } = useApp();

  const [selectedUserToAssign, setSelectedUserToAssign] = useState<string>('');
  const [selectedStatusToBatch, setSelectedStatusToBatch] = useState<string>('');
  const [selectedTrackerStatusToBatch, setSelectedTrackerStatusToBatch] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedRecordIds.length === 0) return null;

  const isAdmin = currentUser.role === 'admin';
  const canUpdateStatus = isAdmin || agentPermissions.canEditStatus;
  const canUpdateTrackerStatus = isAdmin || agentPermissions.canEditTrackerStatus;
  const canDelete = isAdmin || agentPermissions.canDeleteRecords;

  const staffUsers = users.filter(u => u.active);

  const handleApplyAssignment = () => {
    if (!selectedUserToAssign) return;

    if (selectedUserToAssign === 'unassigned') {
      assignRecords(selectedRecordIds, 'unassigned', 'Unassigned');
    } else {
      const targetUser = users.find(u => u.id === selectedUserToAssign);
      if (targetUser) {
        assignRecords(selectedRecordIds, targetUser.id, targetUser.name);
      }
    }
    setSelectedUserToAssign('');
  };

  const handleApplyStatus = (status: TrackerRecord['status']) => {
    if (!status) return;
    batchUpdateStatus(selectedRecordIds, status);
    setSelectedStatusToBatch('');
  };

  const handleApplyTrackerStatus = (tStatus: TrackerRecord['trackerStatus']) => {
    if (!tStatus) return;
    batchUpdateTrackerStatus(selectedRecordIds, tStatus);
    setSelectedTrackerStatusToBatch('');
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <>
      {/*
        Layout:
        - Mobile:  row 1 = [count ........ export delete close], row 2 = full-width controls
        - Desktop: single row = [count | controls | export delete close]
        Order classes keep a single DOM copy of each control.
      */}
      <div className="fixed bottom-2.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1rem)] max-w-4xl bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/80 p-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center sm:justify-between gap-2 sm:gap-3 animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Selection count badge */}
        <div className="order-1 flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-mono-numbers text-xs font-bold flex items-center justify-center shrink-0">
            {selectedRecordIds.length}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white leading-none whitespace-nowrap">
              {selectedRecordIds.length} Selected
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline leading-tight mt-0.5 whitespace-nowrap">
              {isAdmin ? 'Assign or batch update' : 'Batch actions'}
            </span>
          </div>
        </div>

        {/* Icon actions: Export / Delete / Close (top-right on mobile, far right on desktop) */}
        <div className="order-2 sm:order-3 ml-auto sm:ml-0 flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onExportSelected}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
            title="Download CSV for selected rows"
            aria-label="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
              title="Delete selected records"
              aria-label="Delete selected records"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={clearSelection}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Clear Selection"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Select controls: full width row on mobile, inline on desktop */}
        <div className="order-3 sm:order-2 w-full sm:w-auto flex flex-wrap items-center gap-2">
          
          {/* ASSIGNMENT TOOL (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg p-1 w-full sm:w-auto">
              <UserCheck className="w-3.5 h-3.5 text-blue-400 ml-1 shrink-0" />
              <select
                value={selectedUserToAssign}
                onChange={(e) => setSelectedUserToAssign(e.target.value)}
                className="flex-1 min-w-0 sm:flex-none sm:max-w-[200px] text-xs bg-transparent text-white border-none focus:outline-none pr-1 py-1 truncate cursor-pointer"
              >
                <option value="" className="text-slate-800 bg-white">Assign staff...</option>
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id} className="text-slate-800 bg-white">
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedUserToAssign}
                onClick={handleApplyAssignment}
                className="shrink-0 px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded transition-colors whitespace-nowrap cursor-pointer min-h-[32px]"
              >
                Assign
              </button>
            </div>
          )}

          {/* BATCH STATUS */}
          {canUpdateStatus && (
            <div className="flex-1 min-w-[130px] sm:flex-none flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg p-1">
              <select
                value={selectedStatusToBatch}
                onChange={(e) => {
                  const val = e.target.value as TrackerRecord['status'];
                  if (val) handleApplyStatus(val);
                }}
                className="w-full min-w-0 text-xs bg-transparent text-white border-none focus:outline-none px-1.5 py-1 cursor-pointer"
              >
                <option value="" className="text-slate-800 bg-white">Status...</option>
                <option value="Continued" className="text-slate-800 bg-white">Set Continued</option>
                <option value="Pending" className="text-slate-800 bg-white">Set Pending</option>
                <option value="Removal" className="text-slate-800 bg-white">Set Removal</option>
                <option value="Removed" className="text-slate-800 bg-white">Set Removed</option>
                <option value="In Progress" className="text-slate-800 bg-white">Set In Progress</option>
              </select>
            </div>
          )}

          {/* BATCH TRACKER STATUS */}
          {canUpdateTrackerStatus && (
            <div className="flex-1 min-w-[130px] sm:flex-none flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg p-1">
              <select
                value={selectedTrackerStatusToBatch}
                onChange={(e) => {
                  const val = e.target.value as TrackerRecord['trackerStatus'];
                  if (val) handleApplyTrackerStatus(val);
                }}
                className="w-full min-w-0 text-xs bg-transparent text-white border-none focus:outline-none px-1.5 py-1 cursor-pointer"
              >
                <option value="" className="text-slate-800 bg-white">Tracker State...</option>
                <option value="Active" className="text-slate-800 bg-white">Set: Active</option>
                <option value="NR" className="text-slate-800 bg-white">Set: NR (Not Reporting)</option>
                <option value="Testing" className="text-slate-800 bg-white">Set: Testing</option>
                <option value="Standby" className="text-slate-800 bg-white">Set: Standby</option>
                <option value="Removed" className="text-slate-800 bg-white">Set: Removed</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/*
        In-App Batch Delete Confirmation Dialog.
        Rendered OUTSIDE the bar: the bar uses a CSS transform (-translate-x-1/2),
        which would otherwise make "fixed inset-0" relative to the bar instead of the screen.
      */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-900">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="font-bold text-red-900 text-sm">Delete {selectedRecordIds.length} Record(s)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <p className="leading-relaxed font-medium">
                Are you sure you want to permanently delete <strong className="text-red-700">{selectedRecordIds.length} selected vehicle record(s)</strong>? This action cannot be undone.
              </p>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 font-medium cursor-pointer min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    deleteRecords(selectedRecordIds);
                  }}
                  className="px-3.5 py-1.5 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 shadow-xs cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Records</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};