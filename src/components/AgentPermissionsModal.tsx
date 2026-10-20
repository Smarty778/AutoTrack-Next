'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AgentPermissions, PermissionPreset } from '../types';
import { 
  Shield, 
  Lock, 
  Check, 
  X, 
  Sliders, 
  User, 
  RotateCcw,
  Sparkles,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AgentPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedUserId?: string;
}

export const AgentPermissionsModal: React.FC<AgentPermissionsModalProps> = ({
  isOpen,
  onClose,
  initialSelectedUserId,
}) => {
  const { 
    globalAgentPermissions, 
    updateAgentPermissions, 
    resetAgentPermissionsToPreset,
    clearUserCustomPermissions,
    getUserEffectivePermissions,
    users 
  } = useApp();

  const [selectedTarget, setSelectedTarget] = useState<string>(initialSelectedUserId || 'global');
  const [justSavedMessage, setJustSavedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const salesUsers = users.filter(u => u.role === 'user');
  const isGlobal = selectedTarget === 'global';
  const selectedUser = users.find(u => u.id === selectedTarget);
  const hasCustomOverride = !isGlobal && !!selectedUser?.customPermissions;

  // Active permissions for currently selected target
  const activePermissions = isGlobal
    ? globalAgentPermissions
    : getUserEffectivePermissions(selectedTarget);

  const toggle = (key: keyof AgentPermissions) => {
    const newValue = !activePermissions[key];
    if (isGlobal) {
      updateAgentPermissions({ [key]: newValue });
    } else {
      updateAgentPermissions({ [key]: newValue }, selectedTarget);
    }
    showSavedFeedback();
  };

  const handleApplyPreset = (preset: PermissionPreset) => {
    if (isGlobal) {
      resetAgentPermissionsToPreset(preset);
    } else {
      resetAgentPermissionsToPreset(preset, selectedTarget);
    }
    showSavedFeedback(`Applied ${preset.toUpperCase()} preset`);
  };

  const handleRevertToGlobal = () => {
    if (!isGlobal) {
      clearUserCustomPermissions(selectedTarget);
      showSavedFeedback(`Reverted to global policy`);
    }
  };

  const showSavedFeedback = (msg = 'Changes saved') => {
    setJustSavedMessage(msg);
    setTimeout(() => setJustSavedMessage(null), 2500);
  };

  const allowedCount = Object.values(activePermissions).filter(Boolean).length;
  const lockedCount = Object.values(activePermissions).length - allowedCount;

  const permissionGroups = [
    {
      title: 'Follow-up & Customer Operations',
      subtitle: 'Day-to-day CRM and renewal tracking fields',
      items: [
        {
          key: 'canEditStatus' as keyof AgentPermissions,
          label: 'Service Status',
          description: 'Allows agent to update lifecycle status (Continued, Pending, Removal, Removed, In Progress)',
        },
        {
          key: 'canEditTrackerStatus' as keyof AgentPermissions,
          label: 'Tracker Health Status',
          description: 'Allows agent to update reporting status (Active, NR: Not Reporting, Testing)',
        },
        {
          key: 'canEditRemarks' as keyof AgentPermissions,
          label: 'Remarks & Calling Notes',
          description: 'Allows agent to log conversation history, recovery notes, and remarks',
        },
        {
          key: 'canEditDueDate' as keyof AgentPermissions,
          label: 'Due Date / Renewal Deadline',
          description: 'Allows agent to adjust the agreed follow-up or renewal date',
        },
        {
          key: 'canEditContactInfo' as keyof AgentPermissions,
          label: 'Contact #1 & Contact Person / Owner',
          description: 'Allows agent to correct customer phone number and owner contact name',
        },
        {
          key: 'canEditInsurance' as keyof AgentPermissions,
          label: 'Insurance Company & Ins Status',
          description: 'Allows agent to modify vehicle insurance provider and policy status',
        },
      ]
    },
    {
      title: 'Vehicle & Technical Hardware Specifications',
      subtitle: 'Critical master identity parameters (Admin protected by default)',
      items: [
        {
          key: 'canEditVehicleSpecs' as keyof AgentPermissions,
          label: 'Vehicle Specs (Reg No, Make, Model, Year, Color)',
          description: 'Lock to prevent accidental modification of vehicle registration identity',
        },
        {
          key: 'canEditEngineChassis' as keyof AgentPermissions,
          label: 'Engine No. & Chassis No.',
          description: 'Sensitive technical vehicle identification numbers',
        },
        {
          key: 'canEditHardwareUnit' as keyof AgentPermissions,
          label: 'UNIT (GPS Device Model)',
          description: 'Lock to ensure tracking hardware inventory consistency',
        },
        {
          key: 'canEditTechnicianCity' as keyof AgentPermissions,
          label: 'Technician, City & Showroom',
          description: 'Installation location, technician assignment, and originating dealership',
        },
        {
          key: 'canEditOrderNoDate' as keyof AgentPermissions,
          label: 'Order No., Installation Date & Coordinator',
          description: 'Historical billing and delivery audit timestamps',
        },
      ]
    },
    {
      title: 'Privileged Administrative Operations',
      subtitle: 'System management and portfolio actions',
      items: [
        {
          key: 'canCreateNewRecords' as keyof AgentPermissions,
          label: 'Create New Vehicle Entries',
          description: 'Allow agent to add new vehicle records into their assigned portfolio',
        },
        {
          key: 'canReassignSalesPerson' as keyof AgentPermissions,
          label: 'Reassign Vehicle to Another Agent',
          description: 'Allow agent to change who the lead belongs to (Disabled by default)',
        },
        {
          key: 'canDeleteRecords' as keyof AgentPermissions,
          label: 'Delete Vehicle Records',
          description: 'Permanent deletion rights (Disabled by default for safety)',
        },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Agent Edit Permissions &amp; Access Control
              </h2>
              <p className="text-[11px] text-slate-500">
                Admin controls what data fields sales agents are permitted to edit on their assigned vehicles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {justSavedMessage && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {justSavedMessage}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Target Scope Selector (Global vs Specific Agent) */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Configure Policy For:</span>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="global">🌐 All Sales Agents (Global Default Policy)</option>
              <optgroup label="Specific Sales Representative">
                {salesUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} (@{u.username}) {u.customPermissions ? '• [Custom Policy]' : ''}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded">
              <span className="font-bold text-emerald-700">{allowedCount} Allowed</span>
              <span className="text-slate-400 mx-1">/</span>
              <span className="font-bold text-slate-600">{lockedCount} Locked</span>
            </div>

            {hasCustomOverride && (
              <button
                type="button"
                onClick={handleRevertToGlobal}
                className="text-[11px] text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded font-medium flex items-center gap-1 border border-purple-200 cursor-pointer"
                title="Remove individual override and follow global baseline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert to Global Policy</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Presets Strip */}
        <div className="bg-slate-100/70 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold text-slate-800 text-xs">Apply One-Click Policy Preset:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('readonly')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-medium text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
              title="Agent cannot edit any fields. View only."
            >
              <EyeOff className="w-3 h-3 text-slate-500" />
              <span>Read-Only</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('strict')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-medium text-[11px] shadow-2xs cursor-pointer"
              title="Only Status, Due Date, and Remarks editable"
            >
              Strict (Notes Only)
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('standard')}
              className="px-2.5 py-1 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-800 rounded-md font-semibold text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
              title="Status + Tracker Health + Remarks + Contacts (Recommended)"
            >
              <CheckCircle2 className="w-3 h-3 text-blue-600" />
              <span>Standard (Recommended)</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('full')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-medium text-[11px] shadow-2xs cursor-pointer"
              title="Allow agent to edit all vehicle specifications and hardware"
            >
              Full Vehicle Edit
            </button>
          </div>
        </div>

        {/* Body Checklist */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {!isGlobal && hasCustomOverride && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  Custom policy is currently active for <strong>{selectedUser?.name}</strong>. These settings override the global baseline.
                </span>
              </div>
            </div>
          )}

          {permissionGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2.5">
              <div className="pb-1 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    {group.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">{group.subtitle}</p>
                </div>
              </div>

              <div className="space-y-2">
                {group.items.map((item) => {
                  const isAllowed = activePermissions[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggle(item.key)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isAllowed 
                          ? 'border-blue-200 bg-blue-50/25 hover:bg-blue-50/40' 
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          isAllowed ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isAllowed ? <Check className="w-3 h-3" /> : <Lock className="w-2.5 h-2.5" />}
                        </div>
                        <div>
                          <span className={`font-semibold text-xs block ${
                            isAllowed ? 'text-slate-900' : 'text-slate-600'
                          }`}>
                            {item.label}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide ${
                          isAllowed 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isAllowed ? 'ALLOWED' : 'LOCKED'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Locked fields will appear with a padlock icon and be uneditable for agents.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            Done &amp; Close
          </button>
        </div>

      </div>
    </div>
  );
};
