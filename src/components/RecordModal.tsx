'use client';

import React, { useState, useEffect } from 'react';
import { TrackerRecord } from '../types';
import { useApp } from '../context/AppContext';
import { X, Save, Car, Cpu, FileCheck, Lock, Clock } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: TrackerRecord | null;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
}) => {
  const { addRecord, updateRecord, users, currentUser, agentPermissions } = useApp();

  const isEditing = !!recordToEdit;
  const [activeTab, setActiveTab] = useState<'vehicle' | 'installation' | 'order'>('vehicle');

  // Permission flags for field-level access control
  const isAdmin = currentUser.role === 'admin';
  const canEditVehicle = isAdmin || agentPermissions.canEditVehicleSpecs;
  const canEditContact = isAdmin || agentPermissions.canEditContactInfo;
  const canEditEngine = isAdmin || agentPermissions.canEditEngineChassis;
  const canEditHardware = isAdmin || agentPermissions.canEditHardwareUnit;
  const canEditTrackerState = isAdmin || agentPermissions.canEditTrackerStatus;
  const canEditTechCity = isAdmin || agentPermissions.canEditTechnicianCity;
  const canEditOrderDates = isAdmin || agentPermissions.canEditOrderNoDate;
  const canEditStatusField = isAdmin || agentPermissions.canEditStatus;
  const canEditDueDateField = isAdmin || agentPermissions.canEditDueDate;
  const canEditIns = isAdmin || agentPermissions.canEditInsurance;
  const canEditNotes = isAdmin || agentPermissions.canEditRemarks;
  const canReassign = isAdmin || agentPermissions.canReassignSalesPerson;

  const defaultFormData: Omit<TrackerRecord, 'id' | 'createdAt' | 'updatedAt'> = {
    regNo: '',
    customerName: '',
    make: 'Toyota',
    model: '',
    year: '2024',
    color: 'White',
    contact1: '',
    contactPerson: '',
    engine: '',
    chassis: '',
    insurance: 'EFU General Insurance',
    date: new Date().toISOString().split('T')[0],
    salesPerson: currentUser.role === 'user' ? currentUser.name : 'Unassigned',
    assignedToUserId: currentUser.role === 'user' ? currentUser.id : undefined,
    technicianName: 'Sajid Tech',
    orderNo: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
    instCity: 'Karachi',
    showroom: 'Direct Customer',
    cnicNo: '',
    insStatus: 'Covered',
    dateOfInstallation: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Continued',
    coordinatedBy: 'Head Office Ops',
    remarks: '',
    unit: 'TK-403 4G',
    trackerStatus: 'Active',
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        regNo: recordToEdit.regNo || '',
        customerName: recordToEdit.customerName || '',
        make: recordToEdit.make || 'Toyota',
        model: recordToEdit.model || '',
        year: recordToEdit.year || '2024',
        color: recordToEdit.color || '',
        contact1: recordToEdit.contact1 || '',
        contactPerson: recordToEdit.contactPerson || '',
        engine: recordToEdit.engine || '',
        chassis: recordToEdit.chassis || '',
        insurance: recordToEdit.insurance || '',
        date: recordToEdit.date || new Date().toISOString().split('T')[0],
        salesPerson: recordToEdit.salesPerson || 'Unassigned',
        assignedToUserId: recordToEdit.assignedToUserId,
        technicianName: recordToEdit.technicianName || '',
        orderNo: recordToEdit.orderNo || '',
        instCity: recordToEdit.instCity || 'Karachi',
        showroom: recordToEdit.showroom || '',
        cnicNo: recordToEdit.cnicNo || '',
        insStatus: recordToEdit.insStatus || 'Covered',
        dateOfInstallation: recordToEdit.dateOfInstallation || '',
        dueDate: recordToEdit.dueDate || '',
        status: recordToEdit.status || 'Continued',
        coordinatedBy: recordToEdit.coordinatedBy || '',
        remarks: recordToEdit.remarks || '',
        unit: recordToEdit.unit || 'TK-403 4G',
        trackerStatus: recordToEdit.trackerStatus || 'Active',
      });
    } else {
      setFormData({
        ...defaultFormData,
        salesPerson: currentUser.role === 'user' ? currentUser.name : 'Unassigned',
        assignedToUserId: currentUser.role === 'user' ? currentUser.id : undefined,
      });
    }
    setActiveTab('vehicle');
  }, [recordToEdit, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoordinatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const user = users.find(u => u.id === selectedId);
    if (user) {
      setFormData(prev => ({
        ...prev,
        assignedToUserId: user.id,
        coordinatedBy: user.name,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.regNo.trim()) {
      alert('Please enter a Registration Number (or UNREG-...)');
      return;
    }
    if (!formData.customerName.trim()) {
      alert('Please enter the Customer Name');
      return;
    }

    if (isEditing && recordToEdit) {
      const statusChanged = formData.status !== recordToEdit.status;
      updateRecord(recordToEdit.id, {
        ...formData,
        ...(statusChanged ? {
          statusChangedAt: new Date().toISOString(),
          statusChangedBy: currentUser.username || currentUser.name,
          statusChangedByUserId: currentUser.id,
          statusChangedRecordId: recordToEdit.id,
        } : {
          statusChangedAt: recordToEdit.statusChangedAt,
          statusChangedBy: recordToEdit.statusChangedBy,
          statusChangedByUserId: recordToEdit.statusChangedByUserId,
          statusChangedRecordId: recordToEdit.statusChangedRecordId,
        })
      });
    } else {
      addRecord({
        ...formData,
        statusChangedAt: new Date().toISOString(),
        statusChangedBy: currentUser.username || currentUser.name,
        statusChangedByUserId: currentUser.id,
      });
    }
    onClose();
  };

  const canEditAnyField = isAdmin || canEditVehicle || canEditContact || canEditEngine || canEditHardware || canEditTrackerState || canEditTechCity || canEditOrderDates || canEditStatusField || canEditDueDateField || canEditIns || canEditNotes;

  const LockIcon = () => (
    <span title="Locked by Admin" className="inline-flex items-center text-slate-400">
      <Lock className="w-3 h-3" />
    </span>
  );

  const lockStyle = "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200 select-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[96dvh] sm:max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-base font-bold text-slate-900 truncate max-w-[240px] sm:max-w-none">
                {isEditing ? `Vehicle: ${recordToEdit.regNo}` : 'New Vehicle Tracker Record'}
              </h2>
              {!isAdmin && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                  !canEditAnyField ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {!canEditAnyField ? 'Read-Only' : 'Agent Access'}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
              Complete vehicle tracking database record (26 Spreadsheet Columns)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice for Agents if some or all fields are locked */}
        {!isAdmin && (
          <div className={`${!canEditAnyField ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200/80'} px-3 sm:px-6 py-2 border-b flex items-center justify-between text-xs gap-2`}>
            <div className="flex items-center gap-2">
              <Lock className={`w-3.5 h-3.5 ${!canEditAnyField ? 'text-red-600' : 'text-amber-600'} shrink-0`} />
              <span className="text-[10px] sm:text-[11px] leading-tight">
                {!canEditAnyField 
                  ? 'All edit permissions are locked by Admin policy. View-only access.'
                  : 'Field edit access is governed by Admin policy. Locked fields are read-only.'}
              </span>
            </div>
            <span className={`text-[9px] sm:text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 ${
              !canEditAnyField ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {!canEditAnyField ? 'READ-ONLY' : 'POLICY'}
            </span>
          </div>
        )}

        {/* Tab Navigation (Horizontally scrollable on mobile) */}
        <div className="flex border-b border-slate-200 px-3 sm:px-6 bg-white gap-2 sm:gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('vehicle')}
            className={`py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors cursor-pointer shrink-0 min-h-[40px] ${
              activeTab === 'vehicle'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Car className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">1. Vehicle &amp; Customer Specs</span>
            <span className="sm:hidden">1. Vehicle Specs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('installation')}
            className={`py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors cursor-pointer shrink-0 min-h-[40px] ${
              activeTab === 'installation'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">2. GPS Unit &amp; Tracker Hardware</span>
            <span className="sm:hidden">2. GPS Hardware</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={`py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors cursor-pointer shrink-0 min-h-[40px] ${
              activeTab === 'order'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">3. Order, Dates, Sales Person &amp; Status</span>
            <span className="sm:hidden">3. Order &amp; Status</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-6 text-xs">
          
          {/* TAB 1: VEHICLE & CUSTOMER */}
          {activeTab === 'vehicle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Reg No. *</label>
                    {!canEditVehicle && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="regNo"
                    required
                    disabled={!canEditVehicle}
                    value={formData.regNo}
                    onChange={handleChange}
                    placeholder="e.g. LEE-23-4819"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditVehicle ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">2. Customer Name *</label>
                    {!canEditContact && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="customerName"
                    required
                    disabled={!canEditContact}
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Customer full name"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditContact ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">7. Contact #1 *</label>
                    {!canEditContact && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="contact1"
                    disabled={!canEditContact}
                    value={formData.contact1}
                    onChange={handleChange}
                    placeholder="+92 300 1234567"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditContact ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">3. Make</label>
                    {!canEditVehicle && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="make"
                    list="make-list"
                    disabled={!canEditVehicle}
                    value={formData.make}
                    onChange={handleChange}
                    placeholder="Toyota, Honda..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditVehicle ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                  <datalist id="make-list">
                    <option value="Toyota" />
                    <option value="Honda" />
                    <option value="Suzuki" />
                    <option value="KIA" />
                    <option value="Hyundai" />
                    <option value="Haval" />
                    <option value="Changan" />
                    <option value="MG" />
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">4. Model</label>
                    {!canEditVehicle && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="model"
                    disabled={!canEditVehicle}
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Corolla Altis"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditVehicle ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">5. Year</label>
                    {!canEditVehicle && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="year"
                    disabled={!canEditVehicle}
                    value={formData.year}
                    onChange={handleChange}
                    placeholder="2024"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditVehicle ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">6. Color</label>
                    {!canEditVehicle && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="color"
                    disabled={!canEditVehicle}
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="White"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditVehicle ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">8. Contact Person / New Owner</label>
                    {!canEditContact && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="contactPerson"
                    disabled={!canEditContact}
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="Driver or secondary contact"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditContact ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">18. CNIC No</label>
                    {!canEditContact && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="cnicNo"
                    disabled={!canEditContact}
                    value={formData.cnicNo}
                    onChange={handleChange}
                    placeholder="42101-1234567-1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditContact ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE & INSTALLATION */}
          {activeTab === 'installation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">9. Engine No.</label>
                    {!canEditEngine && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="engine"
                    disabled={!canEditEngine}
                    value={formData.engine}
                    onChange={handleChange}
                    placeholder="1ZR-FE-881920"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditEngine ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">10. Chassis No.</label>
                    {!canEditEngine && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="chassis"
                    disabled={!canEditEngine}
                    value={formData.chassis}
                    onChange={handleChange}
                    placeholder="NZE170-8492019"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditEngine ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">25. UNIT (Tracker Model)</label>
                    {!canEditHardware && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="unit"
                    list="unit-list"
                    disabled={!canEditHardware}
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="TK-403 4G"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditHardware ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                  <datalist id="unit-list">
                    <option value="TK-403 4G" />
                    <option value="Teltonika FMB920" />
                    <option value="Coban GPS-303F" />
                    <option value="Concox GT06N" />
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">26. Tracker Status</label>
                    {!canEditTrackerState && <LockIcon />}
                  </div>
                  <select
                    name="trackerStatus"
                    disabled={!canEditTrackerState}
                    value={formData.trackerStatus}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-semibold min-h-[38px] cursor-pointer ${
                      canEditTrackerState ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  >
                    <option value="Active">Active (Reporting Online)</option>
                    <option value="NR">NR (Not Reporting / Offline)</option>
                    <option value="Testing">Testing</option>
                    <option value="Standby">Standby</option>
                    <option value="Removed">Removed</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">14. Technician Name</label>
                    {!canEditTechCity && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="technicianName"
                    disabled={!canEditTechCity}
                    value={formData.technicianName}
                    onChange={handleChange}
                    placeholder="Sajid Tech"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditTechCity ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">16. Inst. City</label>
                    {!canEditTechCity && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="instCity"
                    list="city-list"
                    disabled={!canEditTechCity}
                    value={formData.instCity}
                    onChange={handleChange}
                    placeholder="Karachi, Lahore..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditTechCity ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                  <datalist id="city-list">
                    <option value="Karachi" />
                    <option value="Lahore" />
                    <option value="Islamabad" />
                    <option value="Rawalpindi" />
                    <option value="Faisalabad" />
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">17. Showroom</label>
                    {!canEditTechCity && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="showroom"
                    disabled={!canEditTechCity}
                    value={formData.showroom}
                    onChange={handleChange}
                    placeholder="Toyota Defence Motors"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditTechCity ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER, DATES, SALES PERSON & STATUS */}
          {activeTab === 'order' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">15. Order No.</label>
                    {!canEditOrderDates && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="orderNo"
                    disabled={!canEditOrderDates}
                    value={formData.orderNo}
                    onChange={handleChange}
                    placeholder="ORD-12345"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditOrderDates ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">12. Date</label>
                    {!canEditOrderDates && <LockIcon />}
                  </div>
                  <input
                    type="date"
                    name="date"
                    disabled={!canEditOrderDates}
                    value={formData.date}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditOrderDates ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">13. Sales Person</label>
                    {!canReassign && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="salesPerson"
                    disabled={!canReassign}
                    value={formData.salesPerson}
                    onChange={handleChange}
                    placeholder="Sales rep name"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canReassign ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">20. Date of installation</label>
                    {!canEditOrderDates && <LockIcon />}
                  </div>
                  <input
                    type="date"
                    name="dateOfInstallation"
                    disabled={!canEditOrderDates}
                    value={formData.dateOfInstallation}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditOrderDates ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">21. Due date (Renewal)</label>
                    {!canEditDueDateField && <LockIcon />}
                  </div>
                  <input
                    type="date"
                    name="dueDate"
                    disabled={!canEditDueDateField}
                    value={formData.dueDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-mono-numbers min-h-[38px] ${
                      canEditDueDateField ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">22. Status (Service) *</label>
                    {!canEditStatusField && <LockIcon />}
                  </div>
                  <select
                    name="status"
                    disabled={!canEditStatusField}
                    value={formData.status}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 font-semibold min-h-[38px] cursor-pointer ${
                      canEditStatusField ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  >
                    <option value="Continued">Continued</option>
                    <option value="Pending">Pending</option>
                    <option value="Removal">Removal</option>
                    <option value="Removed">Removed</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                  {recordToEdit?.statusChangedAt && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-600 font-mono-numbers bg-slate-100/90 px-2 py-1.5 rounded-md border border-slate-200">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Changed: <strong>{new Date(recordToEdit.statusChangedAt).toLocaleString()}</strong></span>
                      </div>
                      <span>@<strong>{recordToEdit.statusChangedBy || 'admin'}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">11. Insurance</label>
                    {!canEditIns && <LockIcon />}
                  </div>
                  <input
                    type="text"
                    name="insurance"
                    list="ins-list"
                    disabled={!canEditIns}
                    value={formData.insurance}
                    onChange={handleChange}
                    placeholder="EFU General Insurance"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                      canEditIns ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  />
                  <datalist id="ins-list">
                    <option value="EFU General Insurance" />
                    <option value="Adamjee Insurance" />
                    <option value="Jubilee General Insurance" />
                    <option value="TPL Insurance" />
                    <option value="Askari General Insurance" />
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">19. Ins Status</label>
                    {!canEditIns && <LockIcon />}
                  </div>
                  <select
                    name="insStatus"
                    disabled={!canEditIns}
                    value={formData.insStatus}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] cursor-pointer ${
                      canEditIns ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                    }`}
                  >
                    <option value="Covered">Covered</option>
                    <option value="Inspection Pending">Inspection Pending</option>
                    <option value="Third-Party">Third-Party</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">23. Coordinated by *</label>
                    {!canEditOrderDates && <LockIcon />}
                  </div>
                  {isAdmin ? (
                    <select
                      value={formData.assignedToUserId || users.find(u => u.name.toLowerCase() === (formData.coordinatedBy || '').toLowerCase())?.id || users[0]?.id}
                      onChange={handleCoordinatorChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 text-slate-800 font-medium min-h-[38px] cursor-pointer"
                    >
                      {users.filter(u => u.active).map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="coordinatedBy"
                      disabled={!canEditOrderDates}
                      value={formData.coordinatedBy}
                      onChange={handleChange}
                      placeholder="Operations Desk"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 min-h-[38px] ${
                        canEditOrderDates ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                      }`}
                    />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">24. Remarks</label>
                  {!canEditNotes && <LockIcon />}
                </div>
                <textarea
                  name="remarks"
                  rows={3}
                  disabled={!canEditNotes}
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Service continuation notes, customer follow-up history..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-slate-900 ${
                    canEditNotes ? 'bg-slate-50 text-slate-800 border-slate-200' : lockStyle
                  }`}
                />
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              {activeTab === 'vehicle' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('installation')}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium cursor-pointer min-h-[40px] flex items-center justify-center text-xs"
                >
                  Next: Hardware &rarr;
                </button>
              )}
              {activeTab === 'installation' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('order')}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium cursor-pointer min-h-[40px] flex items-center justify-center text-xs"
                >
                  Next: Order &amp; Dates &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer min-h-[40px] flex items-center justify-center font-medium text-xs"
              >
                {canEditAnyField ? 'Cancel' : 'Close'}
              </button>

              {!canEditAnyField ? (
                <button
                  type="button"
                  disabled
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center gap-1.5 font-semibold cursor-not-allowed select-none min-h-[40px] text-xs"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Read-Only Mode</span>
                </button>
              ) : !isEditing && !isAdmin && !agentPermissions.canCreateNewRecords ? (
                <button
                  type="button"
                  disabled
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center gap-1.5 font-semibold cursor-not-allowed select-none min-h-[40px] text-xs"
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Creation Locked</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-850 transition-colors flex items-center justify-center gap-1.5 font-semibold shadow-2xs cursor-pointer min-h-[40px] text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : 'Create Record'}</span>
                </button>
              )}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};