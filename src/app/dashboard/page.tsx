'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';
import { StatsOverview } from '@/components/StatsOverview';
import { FilterBar } from '@/components/FilterBar';
import { RecordTable } from '@/components/RecordTable';
import { BatchActionBar } from '@/components/BatchActionBar';
import { RecordModal } from '@/components/RecordModal';
import { JobCardModal } from '@/components/JobCardModal';
import { CSVImportExportModal } from '@/components/CSVImportExportModal';
import { TeamManagementView } from '@/components/TeamManagementView';
import { AuditLogsView } from '@/components/AuditLogsView';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { AgentPermissionsModal } from '@/components/AgentPermissionsModal';
import { TrackerRecord } from '@/types';
import { ShieldCheck, User, LogIn, ArrowRight, Shield, Lock, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, setFilter, logout, isAuthenticated, isHydrated, agentPermissions } = useApp();

  const [currentTab, setCurrentTab] = useState<'spreadsheet' | 'team' | 'logs'>('spreadsheet');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrackerRecord | null>(null);
  const [jobCardRecord, setJobCardRecord] = useState<TrackerRecord | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionsTargetUserId, setPermissionsTargetUserId] = useState<string>('global');
  const [csvModalState, setCsvModalState] = useState<{ isOpen: boolean; mode: 'import' | 'export' }>({
    isOpen: false,
    mode: 'export',
  });

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.replace('/login');
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated || !isAuthenticated) {
    return <FullScreenLoader />;
  }

  const handleEditRecord = (record: TrackerRecord) => {
    setEditingRecord(record);
    setIsRecordModalOpen(true);
  };

  const handleNewRecord = () => {
    setEditingRecord(null);
    setIsRecordModalOpen(true);
  };

  const handleOpenCSV = (mode: 'import' | 'export') => {
    setCsvModalState({ isOpen: true, mode });
  };

  const handleNavigateWithFilter = (salesPersonName: string) => {
    setFilter('salesPerson', salesPersonName);
    setCurrentTab('spreadsheet');
  };

  const handleOpenPermissionsModal = (targetUserId: string = 'global') => {
    setPermissionsTargetUserId(targetUserId);
    setIsPermissionsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewRecordModal={handleNewRecord}
        onOpenCSVModal={handleOpenCSV}
        onOpenPermissionsModal={() => handleOpenPermissionsModal('global')}
      />

      {/* Sales Person Access Notification Banner (Highlights RBAC isolation to user) */}
      {currentUser.role === 'user' && (
        <div className="bg-blue-600 text-white px-3 sm:px-4 py-2.5 text-xs w-full">
          <div className="w-full mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 shrink-0" />
                Sales Rep View:
              </span>
              <span className="leading-tight">
                Logged in as <strong>{currentUser.name}</strong>. Only records assigned to your User ID are visible.
              </span>
              <span className="inline-block mt-1 sm:mt-0 bg-blue-700/80 px-2 py-0.5 rounded text-[11px] font-medium border border-blue-500/50">
                {agentPermissions.canEditStatus ? '✓ Status' : '🔒 Status'} &middot;{' '}
                {agentPermissions.canEditRemarks ? '✓ Notes' : '🔒 Notes'} &middot;{' '}
                {agentPermissions.canEditVehicleSpecs ? '✓ Specs' : '🔒 Specs Locked'}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="bg-white/15 hover:bg-white/25 active:bg-white/30 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[36px]"
              title="Sign out of sales account to switch user or return to admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Area - Full Screen Portal Scaling */}
      <main className="flex-1 w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-5">
        
        {currentTab === 'spreadsheet' && (
          <div className="w-full space-y-4">
            {/* Top KPI Metrics Strip */}
            <StatsOverview />

            {/* Comprehensive Multi-Filter Bar */}
            <FilterBar />

            {/* High-Density 26-Column Record Table */}
            <RecordTable
              onEditRecord={handleEditRecord}
              onPrintJobCard={(rec) => setJobCardRecord(rec)}
              onOpenPermissionsModal={() => handleOpenPermissionsModal('global')}
            />

            {/* Floating Batch Action Toolbar (appears when checkboxes are ticked) */}
            <BatchActionBar
              onExportSelected={() => handleOpenCSV('export')}
            />
          </div>
        )}

        {currentTab === 'team' && (
          <TeamManagementView
            onNavigateToSpreadsheetWithFilter={handleNavigateWithFilter}
            onOpenPermissionsModal={handleOpenPermissionsModal}
          />
        )}

        {currentTab === 'logs' && (
          <AuditLogsView />
        )}

      </main>

      {/* Modals */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
        }}
        recordToEdit={editingRecord}
      />

      <JobCardModal
        isOpen={!!jobCardRecord}
        onClose={() => setJobCardRecord(null)}
        record={jobCardRecord}
      />

      <CSVImportExportModal
        isOpen={csvModalState.isOpen}
        onClose={() => setCsvModalState(prev => ({ ...prev, isOpen: false }))}
        defaultMode={csvModalState.mode}
      />

      <AgentPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        initialSelectedUserId={permissionsTargetUserId}
      />

    </div>
  );
}
