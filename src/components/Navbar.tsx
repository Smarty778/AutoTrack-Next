'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ChevronDown, 
  Plus, 
  FileSpreadsheet, 
  Users, 
  History,
  RotateCcw,
  Download,
  Upload,
  LogOut,
  Shield,
  Lock,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'spreadsheet' | 'team' | 'logs';
  onTabChange: (tab: 'spreadsheet' | 'team' | 'logs') => void;
  onOpenNewRecordModal: () => void;
  onOpenCSVModal: (mode: 'import' | 'export') => void;
  onOpenPermissionsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenNewRecordModal,
  onOpenCSVModal,
  onOpenPermissionsModal,
}) => {
  const { currentUser, factoryResetPortal, records, logout, agentPermissions } = useApp();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Universal Top Bar Contract: 3 zones separated by responsive gaps */}
      <div className="w-full px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-8">
        
        {/* ZONE 1: Brand Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <span className="font-bold text-sm sm:text-base tracking-wider">AT</span>
          </div>
          <div className="flex flex-col">
            <div className="text-xs sm:text-base font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap">
              AutoTrack
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5 whitespace-nowrap">
              GPS Fleet CRM
            </span>
          </div>
        </div>

        {/* ZONE 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('spreadsheet')}
            className={`flex items-center gap-2 pb-0.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'spreadsheet'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Master Sheet ({records.length})</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => onTabChange('team')}
              className={`flex items-center gap-2 pb-0.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentTab === 'team'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sales Team &amp; Assignment</span>
            </button>
          )}

          <button
            onClick={() => onTabChange('logs')}
            className={`flex items-center gap-2 pb-0.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentTab === 'logs'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Activity</span>
          </button>
        </nav>

        {/* ZONE 3: Primary Action & Interactive Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Quick User Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-left min-h-[38px] cursor-pointer"
              title="Click to view profile or sign out"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 ${currentUser.avatarColor}`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
                  {currentUser.role === 'admin' ? 'Master Admin' : 'Sales Person'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </button>

            {userDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setUserDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* Current Active Account Card */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs text-white font-bold ${currentUser.avatarColor}`}>
                        {currentUser.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 text-xs truncate">{currentUser.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 font-medium">@{currentUser.username}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        currentUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {currentUser.role === 'admin' ? 'Master Admin' : 'Sales Representative'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {currentUser.city || 'Head Office'}
                      </span>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="px-3.5 py-2 text-[11px] text-slate-500 border-b border-slate-100 flex items-center gap-1.5 bg-amber-50/40 text-amber-900">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Direct switching disabled. Log out to sign in as another user.</span>
                  </div>

                  {/* Mobile Quick Data Actions */}
                  <div className="lg:hidden border-b border-slate-100 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenCSVModal('export');
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[36px]"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Export Records CSV</span>
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenCSVModal('import');
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[36px]"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Import Spreadsheet CSV</span>
                      </button>
                    )}
                  </div>

                  {currentUser.role === 'admin' && onOpenPermissionsModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPermissionsModal();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 flex items-center gap-2 text-xs text-slate-800 hover:bg-slate-50 transition-colors border-b border-slate-100 font-medium cursor-pointer min-h-[36px]"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Configure Agent Permissions</span>
                    </button>
                  )}

                  <div className="pt-2 mt-1 px-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setShowResetConfirmModal(true);
                      }}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 py-1 cursor-pointer min-h-[32px]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Factory Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[32px]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Agent Permissions Access Control Button (Admin Only) */}
          {currentUser.role === 'admin' && onOpenPermissionsModal && (
            <button
              type="button"
              onClick={onOpenPermissionsModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer shadow-2xs min-h-[38px]"
              title="Admin Access Control: Configure what fields agents are permitted to edit"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Agent Permissions</span>
            </button>
          )}

          {/* Quick Sign Out Action */}
          <button
            type="button"
            onClick={logout}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
            title="Sign Out / Lock Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Quick Import / Export actions (Desktop) */}
          <button
            type="button"
            onClick={() => onOpenCSVModal('export')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap min-h-[38px] cursor-pointer"
            title="Export Records to Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => onOpenCSVModal('import')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap min-h-[38px] cursor-pointer"
              title="Upload CSV Sheet"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Sheet</span>
            </button>
          )}

          {/* Primary Action Button: Add New Entry */}
          {currentUser.role === 'user' && !agentPermissions.canCreateNewRecords ? (
            <button
              type="button"
              disabled
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 cursor-not-allowed min-h-[38px]"
              title="Creating new records is locked by Admin policy"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">New Entry (Locked)</span>
              <span className="sm:hidden">Locked</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenNewRecordModal}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-850 transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile touch-optimized sub-navigation bar row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 px-2 py-1.5 bg-slate-50 text-xs">
        <button
          onClick={() => onTabChange('spreadsheet')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors min-h-[40px] text-xs cursor-pointer ${
            currentTab === 'spreadsheet'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Master Sheet</span>
        </button>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => onTabChange('team')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors min-h-[40px] text-xs cursor-pointer ${
              currentTab === 'team'
                ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sales Team</span>
          </button>
        )}
        <button
          onClick={() => onTabChange('logs')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors min-h-[40px] text-xs cursor-pointer ${
            currentTab === 'logs'
              ? 'bg-slate-900 text-white font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit</span>
        </button>
      </div>

      {/* Factory Reset Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-left">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-red-100 flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-600" />
                <span className="font-bold text-red-900 text-sm">Factory Reset Portal</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                Are you sure you want to completely wipe all vehicle tracker records and reset the portal?
              </p>
              <p className="text-red-600 text-[11px] font-semibold bg-red-50 p-2.5 rounded border border-red-100">
                ⚠️ Warning: This will clear local storage and start with a completely empty database.
              </p>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 font-medium cursor-pointer min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirmModal(false);
                    factoryResetPortal();
                  }}
                  className="px-3.5 py-1.5 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 shadow-2xs cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Wipe & Reset Everything</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};