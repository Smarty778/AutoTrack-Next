'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { 
  Users, 
  UserPlus, 
  Car, 
  AlertCircle, 
  ArrowRight, 
  X, 
  Phone, 
  MapPin, 
  Mail, 
  Key, 
  Lock,
  RotateCw,
  Shield,
  Trash2
} from 'lucide-react';

interface TeamManagementViewProps {
  onNavigateToSpreadsheetWithFilter: (salesPersonName: string) => void;
  onOpenPermissionsModal?: (targetUserId?: string) => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  onNavigateToSpreadsheetWithFilter,
  onOpenPermissionsModal,
}) => {
  const { users, records, addUser, updateUserPassword, resetAgentPermissionsToPreset, factoryResetPortal, deleteUser } = useApp();
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [passwordModalUser, setPasswordModalUser] = useState<UserProfile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [showFactoryResetModal, setShowFactoryResetModal] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    password: '123',
    email: '',
    phone: '+92 300 ',
    city: 'Lahore',
    role: 'user' as const,
  });

  const today = new Date().toISOString().split('T')[0];

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.username.trim()) {
      alert('Please fill in Name and Username');
      return;
    }

    const avatarColors = [
      'bg-blue-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-indigo-600',
      'bg-purple-600',
      'bg-rose-600',
      'bg-teal-600',
    ];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    addUser({
      name: newUserForm.name.trim(),
      username: newUserForm.username.trim().toLowerCase(),
      password: newUserForm.password || '123',
      email: newUserForm.email.trim() || `${newUserForm.username.trim().toLowerCase()}@autotrack.com`,
      phone: newUserForm.phone,
      city: newUserForm.city,
      role: newUserForm.role,
      avatarColor: randomColor,
      active: true,
    });

    setNewUserForm({
      name: '',
      username: '',
      password: '123',
      email: '',
      phone: '+92 300 ',
      city: 'Lahore',
      role: 'user',
    });
    setShowAddUserModal(false);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordValue.trim()) return;
    updateUserPassword(passwordModalUser.id, newPasswordValue.trim());
    setPasswordModalUser(null);
    setNewPasswordValue('');
  };

  const salesUsers = users.filter(u => u.role === 'user');
  const unassignedRecords = records.filter(
    r => !r.assignedToUserId || r.salesPerson.toLowerCase() === 'unassigned'
  );

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xs sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 shrink-0" />
            <span>Sales Team &amp; Fleet Allocation</span>
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
            Manage sales accounts, passwords, and assigned vehicle portfolios.
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => setShowFactoryResetModal(true)}
            className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer border border-red-200 min-h-[38px]"
          >
            <RotateCw className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden xs:inline">Factory Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-850 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Sales Rep</span>
          </button>
        </div>
      </div>

      {/* Agent Access & Edit Control Policy Banner */}
      <div className="bg-gradient-to-r from-amber-50/70 via-slate-50 to-white rounded-xl border border-amber-200/90 p-3.5 sm:p-5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Agent Edit Access Rights &amp; Field Permissions Control
              </h3>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded tracking-wide">
                Admin Controlled
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Admin controls exactly how much edit access agents have on their assigned vehicle records. Lock sensitive vehicle specifications (Reg No, Engine, Chassis) or restrict agents to follow-up remarks &amp; due date only.
            </p>
            
            {/* Presets and Status Summary */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 text-xs">
              <span className="text-slate-500 font-medium text-[10px] sm:text-[11px] w-full sm:w-auto">Quick Policies:</span>
              <button
                type="button"
                onClick={() => resetAgentPermissionsToPreset('readonly')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-medium text-[11px] shadow-2xs cursor-pointer min-h-[30px]"
                title="Agents can only view, no edits"
              >
                Read-Only
              </button>
              <button
                type="button"
                onClick={() => resetAgentPermissionsToPreset('strict')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-medium text-[11px] shadow-2xs cursor-pointer min-h-[30px]"
                title="Only remarks & due date"
              >
                Strict (Notes Only)
              </button>
              <button
                type="button"
                onClick={() => resetAgentPermissionsToPreset('standard')}
                className="px-2.5 py-1 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-800 rounded font-semibold text-[11px] shadow-2xs cursor-pointer min-h-[30px]"
                title="Status + Tracker Health + Remarks + Contacts"
              >
                Standard (Recommended)
              </button>
              <button
                type="button"
                onClick={() => resetAgentPermissionsToPreset('full')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-medium text-[11px] shadow-2xs cursor-pointer min-h-[30px]"
                title="All vehicle fields editable"
              >
                Full Vehicle Edit
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenPermissionsModal?.()}
          className="w-full md:w-auto px-4 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-850 transition-colors shadow-2xs flex items-center justify-center gap-2 shrink-0 cursor-pointer min-h-[40px]"
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Configure Edit Permissions</span>
        </button>
      </div>

      {/* Unassigned Pool Notice */}
      {unassignedRecords.length > 0 && (
        <div className="bg-purple-50/60 border border-purple-200 rounded-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold font-mono-numbers shrink-0">
              {unassignedRecords.length}
            </div>
            <div>
              <span className="font-bold text-purple-900 block text-xs">
                {unassignedRecords.length} Unassigned Vehicle Record{unassignedRecords.length > 1 ? 's' : ''} in Master Fleet
              </span>
              <span className="text-purple-700 text-[10px] sm:text-[11px]">
                These vehicles are currently not assigned to any sales representative.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToSpreadsheetWithFilter('unassigned')}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
          >
            <span>Assign in Master Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sales Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full">
        {salesUsers.map(user => {
          const userRecords = records.filter(
            r => r.assignedToUserId === user.id || r.salesPerson.toLowerCase() === user.name.toLowerCase()
          );

          const continuedCount = userRecords.filter(r => r.status === 'Continued').length;
          const pendingCount = userRecords.filter(r => r.status === 'Pending').length;
          const overdueCount = userRecords.filter(
            r => r.dueDate && r.dueDate < today && r.status !== 'Continued' && r.status !== 'Removed' && r.status !== 'Removal'
          ).length;

          return (
            <div 
              key={user.id} 
              className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* User Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 ${user.avatarColor}`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate">{user.name}</h3>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono-numbers">@{user.username}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                    user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* User Details */}
                <div className="space-y-1 text-xs text-slate-600 mb-3 pb-3 border-b border-slate-100">
                  {user.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{user.city}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-1.5 font-mono-numbers">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordModalUser(user);
                        setNewPasswordValue(user.password || '');
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 ml-2 shrink-0 cursor-pointer"
                      title="View or Change Password"
                    >
                      <Key className="w-3 h-3" />
                      <span>Password</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-1.5 py-2 mb-3 bg-slate-50 rounded-lg p-2 text-center text-xs">
                  <div>
                    <span className="block text-[9px] sm:text-[10px] text-slate-400 font-medium">Assigned</span>
                    <span className="font-bold text-slate-900 font-mono-numbers text-sm sm:text-base">{userRecords.length}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] sm:text-[10px] text-slate-400 font-medium">Continued</span>
                    <span className="font-bold text-emerald-600 font-mono-numbers text-sm sm:text-base">{continuedCount}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] sm:text-[10px] text-slate-400 font-medium">Pending</span>
                    <span className="font-bold text-amber-600 font-mono-numbers text-sm sm:text-base">{pendingCount}</span>
                  </div>
                </div>

                {overdueCount > 0 && (
                  <div className="mb-3 p-1.5 bg-red-50 text-red-700 rounded text-[11px] flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>{overdueCount} renewal(s) overdue</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onNavigateToSpreadsheetWithFilter(user.name)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer min-h-[36px]"
                  >
                    <Car className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{userRecords.length} Records</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPermissionsModal?.(user.id)}
                    className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-md font-medium text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer min-h-[36px] shrink-0"
                    title="Configure what this agent is allowed to edit"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="hidden xs:inline">{user.customPermissions ? 'Custom' : 'Rights'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalUser(user);
                    setNewPasswordValue(user.password || '');
                  }}
                  className="w-full py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                  title="View or change password for this account"
                >
                  <Key className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Account Password &amp; Credentials</span>
                </button>

                <div className="bg-slate-50 border border-slate-200/80 rounded-md p-2 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono font-bold text-slate-900">@{user.username}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Direct login disabled. Log out first to sign in.</span>
                  </div>
                </div>

                {user.id !== 'user-admin' && (
                  <button
                    type="button"
                    onClick={() => setUserToDelete(user)}
                    className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                    title="Delete this user account"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>Delete Account</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">Create New Sales Representative Account</span>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Asad Naveed"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-800 min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">User ID / Username *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="e.g. asad"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-800 font-mono-numbers min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="e.g. 123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-800 font-mono-numbers min-h-[38px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="asad@autotrack.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-800 min-h-[38px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-800 font-mono-numbers min-h-[38px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={newUserForm.city}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Karachi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-800 min-h-[38px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md font-semibold hover:bg-slate-850 shadow-2xs cursor-pointer min-h-[36px]"
                >
                  Create Sales Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-xs sm:text-sm truncate mr-2">
                Change Password for {passwordModalUser.name}
              </span>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <span className="text-slate-500 block">User ID:</span>
                <span className="font-mono font-bold text-slate-800">@{passwordModalUser.username}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-800 font-mono min-h-[38px]"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md font-semibold hover:bg-slate-850 cursor-pointer min-h-[36px]"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User In-App Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-red-100 flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-bold text-red-900 text-xs sm:text-sm">Delete Account</span>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                Are you sure you want to delete coordinator / agent account <strong className="text-slate-900 font-bold">{userToDelete.name}</strong> (@{userToDelete.username})?
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 space-y-1">
                <div><span className="text-slate-400">Role:</span> <span className="font-medium uppercase">{userToDelete.role}</span></div>
                <div><span className="text-slate-400">City / Office:</span> <span className="font-medium">{userToDelete.city || 'N/A'}</span></div>
                <div className="text-[10px] sm:text-[11px] text-amber-700 pt-1 border-t border-slate-200 mt-1 font-medium">
                  Note: Any vehicles assigned to this account will be automatically set to Unassigned.
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 font-medium cursor-pointer min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteUser(userToDelete.id);
                    setUserToDelete(null);
                  }}
                  className="px-3.5 py-1.5 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 shadow-2xs cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Factory Reset In-App Confirmation Modal */}
      {showFactoryResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-red-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-red-100 flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-bold text-red-900 text-xs sm:text-sm">Factory Reset Portal</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFactoryResetModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed font-medium">
                Are you sure you want to completely wipe all portal records, vehicle tracking entries, and local user sessions back to zero?
              </p>
              <p className="text-red-600 text-[10px] sm:text-[11px] font-semibold bg-red-50 p-2.5 rounded border border-red-100">
                ⚠️ Warning: This will clear local storage and start with a completely empty database.
              </p>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFactoryResetModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 font-medium cursor-pointer min-h-[36px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFactoryResetModal(false);
                    factoryResetPortal();
                  }}
                  className="px-3.5 py-1.5 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 shadow-2xs cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Wipe & Reset Everything</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};