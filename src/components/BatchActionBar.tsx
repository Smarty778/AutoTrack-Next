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
    <div className="fixed bottom-2.5 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1rem)] max-w-4xl bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/80 p-2 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 animate-in slide-in-from-bottom-5 duration-200">
      
      {/* Selection count badge */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 text-white font-mono-numbers text-[11px] sm:text-xs font-bold flex items-center justify-center shrink-0">
          {selectedRecordIds.length}
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white leading-none">
            {selectedRecordIds.length} Selected
          </span>
          <span className="text-[10px] text-slate-400 hidden xs:inline leading-tight mt-0.5">
            {currentUser.role === 'admin' ? 'Assign or batch update' : 'Batch actions'}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        
        {/* ASSIGNMENT TOOL (Admin only) */}
        {currentUser.role === 'admin' && (
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg p-1 max-w-[170px] sm:max-w-none">
            <UserCheck className="w-3.5 h-3.5 text-blue-400 ml-1 shrink-0" />
            <select
              value={selectedUserToAssign}
              onChange={(e) => setSelectedUserToAssign(e.target.value)}
              className="text-xs bg-transparent text-white border-none focus:outline-none pr-1 py-0.5 truncate max-w-[100px] sm:max-w-xs cursor-pointer"
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
              className="px-2 py-1 text-[11px] sm:text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded transition-colors whitespace-nowrap cursor-pointer min-h-[30px]"
            >
              Assign
            </button>
          </div>
        )}

        {/* BATCH STATUS */}
        {canUpdateStatus && (
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg p-1">
            <select
              value={selectedStatusToBatch}
              onChange={(e) => {
                const val = e.target.value as TrackerRecord['status'];
                if (val) handleApplyStatus(val);
              }}
              className="text-xs bg-transparent text-white border-none focus:outline-none px-1.5 py-0.5 cursor-pointer max-w-[110px] sm:max-w-none"
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
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg p-1">
            <select
              value={selectedTrackerStatusToBatch}
              onChange={(e) => {
                const val = e.target.value as TrackerRecord['trackerStatus'];
                if (val) handleApplyTrackerStatus(val);
              }}
              className="text-xs bg-transparent text-white border-none focus:outline-none px-2 py-0.5 cursor-pointer"
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

        {/* EXPORT SELECTED */}
        <button
          type="button"
          onClick={onExportSelected}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer min-h-[32px]"
          title="Download CSV for selected rows"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export CSV</span>
        </button>

        {/* DELETE */}
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors cursor-pointer min-h-[32px]"
            title="Delete selected records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Delete</span>
          </button>
        )}

        {/* CLOSE / DESELECT */}
        <button
          type="button"
          onClick={clearSelection}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors ml-1 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
          title="Clear Selection"
        >
          <X className="w-4 h-4" />
        </button>

      </div>

      {/* In-App Batch Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-900">
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

    </div>
  );
};