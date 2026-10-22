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
import { User, LogOut } from 'lucide-react';

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

  if (!isHydrated || !isAuthenticated || !currentUser) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans overflow-x-hidden">
      
      {/* Top Navbar - Fully responsive for 320px+ */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewRecordModal={handleNewRecord}
        onOpenCSVModal={handleOpenCSV}
        onOpenPermissionsModal={() => handleOpenPermissionsModal('global')}
      />

      {/* Sales Person Access Notification Banner - Responsive flex wrapping */}
      {currentUser.role === 'user' && (
        <div className="bg-blue-600 text-white px-2.5 sm:px-4 py-2 text-xs w-full shadow-sm">
          <div className="w-full max-w-[100%] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 leading-snug">
              <span className="font-bold flex items-center gap-1 shrink-0">
                <User className="w-3.5 h-3.5" />
                Sales Rep:
              </span>
              <span>
                <strong>{currentUser.name}</strong>. Assigned records visible.
              </span>
              <span className="bg-blue-700/80 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-500/50 shrink-0">
                {agentPermissions?.canEditStatus ? '✓ Status' : '🔒 Status'} &middot;{' '}
                {agentPermissions?.canEditRemarks ? '✓ Notes' : '🔒 Notes'}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="bg-white/15 hover:bg-white/25 active:bg-white/30 px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0 min-h-[32px] text-xs self-end sm:self-auto"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main View Area - Optimized padding for ultra-small screens */}
      <main className="flex-1 w-full max-w-full mx-auto px-2 sm:px-4 lg:px-8 py-2.5 sm:py-5 overflow-x-hidden">
        
        {currentTab === 'spreadsheet' && (
          <div className="w-full space-y-3 sm:space-y-4">
            {/* Top KPI Metrics Strip */}
            <StatsOverview />

            {/* Comprehensive Multi-Filter Bar */}
            <FilterBar />

            {/* High-Density 26-Column Record Table with Horizontal Scroll for 320px */}
            <RecordTable
              onEditRecord={handleEditRecord}
              onPrintJobCard={(rec) => setJobCardRecord(rec)}
              onOpenPermissionsModal={() => handleOpenPermissionsModal('global')}
            />

            {/* Floating Batch Action Toolbar */}
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