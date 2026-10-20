'use client';

import React from 'react';
import { TrackerRecord } from '../types';
import { X, Printer, CheckSquare, ShieldCheck, Car } from 'lucide-react';

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
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar (hidden during browser print) */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">Technician Installation Slip / Job Sheet</span>
            <span className="text-xs text-slate-500 font-mono-numbers">({record.orderNo})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Job Sheet</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="flex-1 overflow-y-auto p-8 text-slate-900 bg-white print:p-0 print:overflow-visible">
          
          {/* Company Slip Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-900">
                AUTOTRACK FLEET &amp; SECURITY SOLUTIONS
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Pakistan Vehicle GPS Tracking &middot; Telematics &middot; Fleet Operations Hub
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300 font-mono-numbers inline-block">
                ORDER #{record.orderNo}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono-numbers">
                Date: {record.dateOfInstallation || record.date}
              </div>
              <div className="text-xs font-semibold text-slate-700">
                City: {record.instCity}
              </div>
            </div>
          </div>

          {/* 1. Vehicle & Customer Section */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-3 flex items-center justify-between">
              <span>Vehicle &amp; Customer Information</span>
              <span className="font-mono-numbers">{record.regNo}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Customer Name</span>
                <span className="font-bold text-slate-900">{record.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Contact #1</span>
                <span className="font-semibold text-slate-900 font-mono-numbers">{record.contact1}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Contact Person / Owner</span>
                <span className="text-slate-800">{record.contactPerson || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">CNIC No.</span>
                <span className="font-mono-numbers text-slate-800">{record.cnicNo || '-'}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Make &amp; Model</span>
                <span className="font-semibold text-slate-800">{record.make} {record.model} ({record.year})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Color</span>
                <span className="text-slate-800">{record.color}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Engine No.</span>
                <span className="font-mono-numbers text-slate-800">{record.engine}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Chassis No.</span>
                <span className="font-mono-numbers text-slate-800">{record.chassis}</span>
              </div>
            </div>
          </div>

          {/* 2. Hardware & Insurance Details */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded mb-3">
              Hardware, Insurance &amp; Operations
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Tracker Unit Model</span>
                <span className="font-bold text-slate-900 font-mono-numbers">{record.unit}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tracker Status</span>
                <span className="font-semibold text-slate-900">{record.trackerStatus}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Sales Person</span>
                <span className="font-semibold text-slate-800">{record.salesPerson}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Technician</span>
                <span className="font-semibold text-slate-800">{record.technicianName}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Insurance Co.</span>
                <span className="text-slate-800">{record.insurance}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Insurance Status</span>
                <span className="text-slate-800">{record.insStatus}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Showroom / Dealership</span>
                <span className="text-slate-800">{record.showroom}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Due Date</span>
                <span className="font-mono-numbers font-semibold text-slate-800">{record.dueDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* 3. Technician Quality Checklist */}
          <div className="mb-6 border border-slate-200 rounded-lg p-3.5">
            <span className="text-xs font-bold text-slate-800 block mb-2">
              Technician Quality Verification Checklist:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                <span>GPS Lock &amp; Satellite Coordinates</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                <span>GSM 4G Live Telemetry Verified</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                <span>Ignition (ACC) Sensor Calibrated</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                <span>Engine Cut / Fuel Immobilizer Relay</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                <span>Internal Backup Battery Charged</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                <span>Mobile App Access Tested by Client</span>
              </label>
            </div>
          </div>

          {/* 4. Remarks & Instructions */}
          {record.remarks && (
            <div className="mb-6 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Special Remarks:</span>
              <p className="text-slate-600">{record.remarks}</p>
            </div>
          )}

          {/* 5. Sign-off Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-200 text-xs">
            <div className="text-center">
              <div className="border-b border-slate-400 pb-1 mb-1 h-12 flex items-end justify-center font-medium">
                {record.technicianName}
              </div>
              <span className="font-semibold text-slate-700">Technician Signature &amp; Stamp</span>
              <p className="text-[10px] text-slate-400">Verified hardware wiring &amp; GPS ping</p>
            </div>

            <div className="text-center">
              <div className="border-b border-slate-400 pb-1 mb-1 h-12 flex items-end justify-center font-medium">
                {record.customerName}
              </div>
              <span className="font-semibold text-slate-700">Customer / Owner Acknowledgment</span>
              <p className="text-[10px] text-slate-400">Received live tracking portal access</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
