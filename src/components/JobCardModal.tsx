'use client';

import React, { useEffect, useState } from 'react';
import { TrackerRecord } from '../types';
import { useApp, JobCard } from '../context/AppContext';
import { CitySelectField } from './CitySelectField';
import {
  X,
  Printer,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  Wrench,
  MapPin,
  User,
  FileText,
} from 'lucide-react';

interface JobCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TrackerRecord | null;
}

export const JobCardModal: React.FC<JobCardModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const {
    jobCards,
    fetchJobCards,
    createJobCard,
    updateJobCard,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [form, setForm] = useState({
    jobType: 'Installation',
    technicianName: '',
    installationCity: '',
    scheduledDate: '',
    notes: '',
    odometerReading: '',
    imeiNumber: '',
    simNumber: '',
  });

  // Load job cards when modal opens
  useEffect(() => {
    if (isOpen && record?.id) {
      setLoading(true);
      fetchJobCards({ recordId: record.id }).finally(() => setLoading(false));

      // Prefill form
      setForm((prev) => ({
        ...prev,
        technicianName: record.technicianName || '',
        installationCity: record.instCity || '',
      }));
    }
  }, [isOpen, record?.id, fetchJobCards]);

  // Filter job cards of this record
  const recordJobCards = jobCards.filter(
    (jc) => jc.recordId === record?.id
  );

  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCreate = async () => {
    if (!record.id) return;
    setCreating(true);

    const created = await createJobCard({
      recordId: record.id,
      jobType: form.jobType,
      technicianName: form.technicianName || record.technicianName,
      installationCity: form.installationCity || record.instCity,
      scheduledDate: form.scheduledDate || undefined,
      notes: form.notes || undefined,
      odometerReading: form.odometerReading || undefined,
      imeiNumber: form.imeiNumber || undefined,
      simNumber: form.simNumber || undefined,
      status: 'Pending',
    });

    setCreating(false);

    if (created) {
      setSelectedJobCard(created);
      setShowCreateForm(false);
      // reset form
      setForm({
        jobType: 'Installation',
        technicianName: record.technicianName || '',
        installationCity: record.instCity || '',
        scheduledDate: '',
        notes: '',
        odometerReading: '',
        imeiNumber: '',
        simNumber: '',
      });
    }
  };

  const handleStatusChange = async (jobCardId: string, newStatus: string) => {
    const updated = await updateJobCard(jobCardId, { status: newStatus });
    if (updated && selectedJobCard?.id === jobCardId) {
      setSelectedJobCard(updated);
    }
  };

  const activeCard = selectedJobCard || recordJobCards[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="autotrack-modal-panel bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[96dvh] sm:max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar (hidden during print) */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50 print:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-xs sm:text-sm font-bold text-slate-800">
              Technician Job Card
            </span>
            <span className="min-w-0 truncate text-[10px] sm:text-[11px] text-slate-500 font-mono-numbers">
              ({record.regNo} · {record.orderNo})
            </span>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {!showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Job Card</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-850 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[36px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          
          {/* LEFT SIDEBAR – Job Cards List (print:hidden) */}
          <div className="w-full min-w-0 lg:w-64 lg:shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 print:hidden flex flex-col">
            <div className="px-3 py-2 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Job Cards ({recordJobCards.length})
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : recordJobCards.length === 0 && !showCreateForm ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-slate-500 text-xs">
                <FileText className="w-8 h-8 mb-2 text-slate-300" />
                <p>No job cards yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-2 text-emerald-600 font-semibold hover:underline"
                >
                  Create first job card
                </button>
              </div>
            ) : (
              <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto overflow-y-hidden p-2 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto max-h-36 lg:max-h-none">
                {recordJobCards.map((jc) => (
                  <button
                    key={jc.id}
                    type="button"
                    onClick={() => {
                      setSelectedJobCard(jc);
                      setShowCreateForm(false);
                    }}
                    className={`w-[210px] min-w-[210px] lg:w-full lg:min-w-0 shrink-0 text-left px-3 py-2.5 rounded-lg border text-xs transition-colors ${
                      activeCard?.id === jc.id && !showCreateForm
                        ? 'bg-white border-slate-400 shadow-sm'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-800 font-mono-numbers">
                      {jc.jobCardNo}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-600">{jc.jobType}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          jc.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : jc.status === 'In Progress'
                            ? 'bg-sky-100 text-sky-800'
                            : jc.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {jc.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {jc.technicianName || '—'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT – Content */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            
            {/* CREATE FORM */}
            {showCreateForm ? (
              <div className="p-4 sm:p-6 space-y-4 print:hidden">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Job Card
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Job Type</label>
                    <select
                      value={form.jobType}
                      onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option value="Installation">Installation</option>
                      <option value="Removal">Removal</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Inspection">Inspection</option>
                      <option value="Upgrade">Upgrade</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Technician Name</label>
                    <input
                      type="text"
                      value={form.technicianName}
                      onChange={(e) => setForm({ ...form, technicianName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="Technician name"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Installation City</label>
                    <CitySelectField
                      value={form.installationCity}
                      onChange={(value) => setForm((prev) => ({ ...prev, installationCity: value }))}
                      placeholder="Select installation city"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Scheduled Date</label>
                    <input
                      type="date"
                      value={form.scheduledDate}
                      onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Odometer Reading</label>
                    <input
                      type="text"
                      value={form.odometerReading}
                      onChange={(e) => setForm({ ...form, odometerReading: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="e.g. 45230"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">IMEI Number</label>
                    <input
                      type="text"
                      value={form.imeiNumber}
                      onChange={(e) => setForm({ ...form, imeiNumber: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">SIM Number</label>
                    <input
                      type="text"
                      value={form.simNumber}
                      onChange={(e) => setForm({ ...form, simNumber: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1 font-medium">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                      placeholder="Any special instructions..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {creating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {creating ? 'Creating...' : 'Create Job Card'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* PRINTABLE SLIP */
              <div className="p-4 sm:p-8 text-slate-900 bg-white print:p-0 text-xs">
                
                {/* Company Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div>
                    <div className="text-base sm:text-xl font-black tracking-tight text-slate-900">
                      AUTOTRACK FLEET &amp; SECURITY SOLUTIONS
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-600 font-medium mt-0.5">
                      Pakistan Vehicle GPS Tracking · Telematics · Fleet Operations Hub
                    </p>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    {activeCard ? (
                      <div className="text-xs font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-300 font-mono-numbers inline-block">
                        {activeCard.jobCardNo}
                      </div>
                    ) : (
                      <div className="text-xs font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-300 font-mono-numbers inline-block">
                        ORDER #{record.orderNo}
                      </div>
                    )}
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-1 font-mono-numbers">
                      Date: {activeCard?.scheduledDate
                        ? new Date(activeCard.scheduledDate).toLocaleDateString()
                        : record.dateOfInstallation || record.date}
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold text-slate-700">
                      City: {activeCard?.installationCity || record.instCity}
                    </div>
                  </div>
                </div>

                {/* Job Card Status Bar (only when job card exists) */}
                {activeCard && (
                  <div className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
                    <span className="text-[11px] text-slate-500">Status:</span>
                    <select
                      value={activeCard.status}
                      onChange={(e) => handleStatusChange(activeCard.id, e.target.value)}
                      className="text-xs font-semibold border border-slate-300 rounded-md px-2 py-1 bg-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5" />
                      {activeCard.jobType}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {activeCard.technicianName}
                    </span>
                    {activeCard.imeiNumber && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        IMEI: {activeCard.imeiNumber}
                      </span>
                    )}
                  </div>
                )}

                {/* 1. Vehicle & Customer */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-3 flex items-center justify-between">
                    <span>Vehicle &amp; Customer Information</span>
                    <span className="font-mono-numbers">{record.regNo}</span>
                  </h3>

                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Customer Name</span>
                      <span className="font-bold text-slate-900">{record.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Contact #1</span>
                      <span className="font-semibold font-mono-numbers">{record.contact1}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Contact Person</span>
                      <span className="text-slate-800">{record.contactPerson || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">CNIC No.</span>
                      <span className="font-mono-numbers text-slate-800">{record.cnicNo || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Make &amp; Model</span>
                      <span className="font-semibold">{record.make} {record.model} ({record.year})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Color</span>
                      <span>{record.color}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Engine No.</span>
                      <span className="font-mono-numbers">{record.engine}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Chassis No.</span>
                      <span className="font-mono-numbers">{record.chassis}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Hardware & Job Details */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-3">
                    Hardware, Insurance &amp; Job Details
                  </h3>

                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tracker Unit</span>
                      <span className="font-bold font-mono-numbers">{record.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tracker Status</span>
                      <span className="font-semibold">{record.trackerStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Sales Person</span>
                      <span className="font-semibold">{record.salesPerson}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Technician</span>
                      <span className="font-semibold">
                        {activeCard?.technicianName || record.technicianName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Insurance</span>
                      <span>{record.insurance}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Ins. Status</span>
                      <span>{record.insStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Showroom</span>
                      <span>{record.showroom}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Due Date</span>
                      <span className="font-mono-numbers font-semibold">{record.dueDate || 'N/A'}</span>
                    </div>

                    {activeCard?.odometerReading && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Odometer</span>
                        <span className="font-mono-numbers">{activeCard.odometerReading}</span>
                      </div>
                    )}
                    {activeCard?.imeiNumber && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">IMEI</span>
                        <span className="font-mono-numbers">{activeCard.imeiNumber}</span>
                      </div>
                    )}
                    {activeCard?.simNumber && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">SIM</span>
                        <span className="font-mono-numbers">{activeCard.simNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Checklist */}
                <div className="mb-6 border border-slate-200 rounded-lg p-3.5">
                  <span className="text-xs font-bold text-slate-800 block mb-2">
                    Technician Quality Verification Checklist:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                    {[
                      'GPS Lock & Satellite Coordinates',
                      'GSM 4G Live Telemetry Verified',
                      'Ignition (ACC) Sensor Calibrated',
                      'Engine Cut / Fuel Immobilizer Relay',
                      'Internal Backup Battery Charged',
                      'Mobile App Access Tested by Client',
                    ].map((item) => (
                      <label key={item} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Remarks */}
                {(record.remarks || activeCard?.notes) && (
                  <div className="mb-6 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 block mb-0.5">Special Remarks / Notes:</span>
                    <p className="text-slate-600 leading-relaxed">
                      {activeCard?.notes || record.remarks}
                    </p>
                  </div>
                )}

                {/* 5. Signatures */}
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-6 sm:gap-8 pt-8 mt-6 border-t border-slate-200 text-xs">
                  <div className="text-center">
                    <div className="border-b border-slate-400 pb-1 mb-1 h-12 flex items-end justify-center font-medium">
                      {activeCard?.technicianName || record.technicianName}
                    </div>
                    <span className="font-semibold text-slate-700 block">
                      Technician Signature &amp; Stamp
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Verified hardware wiring &amp; GPS ping
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="border-b border-slate-400 pb-1 mb-1 h-12 flex items-end justify-center font-medium">
                      {record.customerName}
                    </div>
                    <span className="font-semibold text-slate-700 block">
                      Customer / Owner Acknowledgment
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Received live tracking portal access
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};