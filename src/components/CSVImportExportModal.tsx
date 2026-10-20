'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TrackerRecord } from '../types';
import { SPREADSHEET_COLUMNS } from '../data/mockData';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface CSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode: 'import' | 'export';
}

export const CSVImportExportModal: React.FC<CSVModalProps> = ({
  isOpen,
  onClose,
  defaultMode,
}) => {
  const { records, visibleRecords, importRecords, currentUser, users } = useApp();
  const [mode, setMode] = useState<'import' | 'export'>(defaultMode);
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('filtered');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsedPreview, setParsedPreview] = useState<TrackerRecord[]>([]);
  const [parseError, setParseError] = useState<string>('');

  if (!isOpen) return null;

  // Exact 26 headers
  const csvHeaders = [
    'Reg No.',
    'Customer Name',
    'Make',
    'Model',
    'Year',
    'Color',
    'Contact #1',
    'Contact Person / New Owner',
    'Engine',
    'Chassis',
    'Insurance',
    'Date',
    'Sales Person',
    'Technician Name',
    'Order No.',
    'Inst. City',
    'Showroom',
    'CNIC No',
    'Ins Status',
    'Date of installation',
    'Due date',
    'Status',
    'Coordinated by',
    'Remarks',
    'UNIT',
    'Tracker Status'
  ];

  // Helper to escape CSV cell value
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // EXPORT CSV HANDLER
  const handleExport = () => {
    const dataToExport = exportScope === 'all' ? records : visibleRecords;
    
    const lines = [
      csvHeaders.map(h => `"${h}"`).join(','),
      ...dataToExport.map(r => [
        escapeCsv(r.regNo),
        escapeCsv(r.customerName),
        escapeCsv(r.make),
        escapeCsv(r.model),
        escapeCsv(r.year),
        escapeCsv(r.color),
        escapeCsv(r.contact1),
        escapeCsv(r.contactPerson),
        escapeCsv(r.engine),
        escapeCsv(r.chassis),
        escapeCsv(r.insurance),
        escapeCsv(r.date),
        escapeCsv(r.salesPerson),
        escapeCsv(r.technicianName),
        escapeCsv(r.orderNo),
        escapeCsv(r.instCity),
        escapeCsv(r.showroom),
        escapeCsv(r.cnicNo),
        escapeCsv(r.insStatus),
        escapeCsv(r.dateOfInstallation),
        escapeCsv(r.dueDate),
        escapeCsv(r.status),
        escapeCsv(r.coordinatedBy),
        escapeCsv(r.remarks),
        escapeCsv(r.unit),
        escapeCsv(r.trackerStatus),
      ].join(','))
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `autotrack_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  // DOWNLOAD TEMPLATE CSV
  const handleDownloadTemplate = () => {
    const templateRows = [
      csvHeaders.map(h => `"${h}"`).join(','),
      [
        '"LEE-23-4819"', '"Muhammad Zeeshan"', '"Toyota"', '"Corolla Altis 1.6"', '"2023"', '"Super White"',
        '"+92 300 8471920"', '"Zeeshan (Self)"', '"1ZR-FE-98214"', '"NZE170-8492019"', '"EFU General Insurance"',
        '"2026-10-10"', '"Bilal Ahmed"', '"Sajid Tech"', '"ORD-98421"', '"Karachi"', '"Toyota Defence Motors"',
        '"42101-5829103-1"', '"Covered"', '"2026-10-14"', '"2026-10-20"', '"Installed"', '"Karachi Dispatch"',
        '"4G GPS installed behind dashboard."', '"TK-403 4G"', '"Active"'
      ].join(','),
      [
        '"BKL-772"', '"Chaudhry Rizwan Akram"', '"Honda"', '"Civic RS Turbo"', '"2024"', '"Meteoroid Gray"',
        '"+92 321 4455889"', '"Ch. Rizwan"', '"L15B7-551982"', '"FE1-1004829"', '"Adamjee Insurance"',
        '"2026-10-12"', '"Tariq Khan"', '"Rashid Ali"', '"ORD-98425"', '"Lahore"', '"Honda Point Gulberg"',
        '"35202-8492011-3"', '"Inspection Pending"', '"2026-10-15"', '"2026-10-16"', '"In Progress"', '"Lahore Ops Hub"',
        '"Fleet manager live tracking required."', '"Teltonika FMB920"', '"Testing"'
      ].join(',')
    ];

    const blob = new Blob([templateRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'autotrack_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV parser function
  const parseCSV = (text: string) => {
    setParseError('');
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }

    try {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentVal = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentVal += '"';
            i++; // skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentVal.trim());
          currentVal = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          currentRow.push(currentVal.trim());
          if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentVal = '';
        } else {
          currentVal += char;
        }
      }

      if (currentVal.trim() || currentRow.length > 0) {
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
      }

      if (rows.length < 2) {
        setParseError('The CSV file does not contain any data rows below the header.');
        setParsedPreview([]);
        return;
      }

      // Check header row
      const headers = rows[0].map(h => h.trim().toLowerCase());
      
      const newRecords: TrackerRecord[] = [];
      const timestamp = new Date().toISOString();

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;

        // Map columns by position or header name
        const getVal = (index: number, headerKey: string) => {
          const headerIdx = headers.findIndex(h => h.includes(headerKey.toLowerCase()));
          if (headerIdx !== -1 && row[headerIdx] !== undefined) return row[headerIdx];
          return row[index] !== undefined ? row[index] : '';
        };

        const salesPersonName = getVal(12, 'sales') || 'Unassigned';
        const matchedUser = users.find(u => u.name.toLowerCase() === salesPersonName.toLowerCase());

        const newRec: TrackerRecord = {
          id: `rec-imp-${Date.now()}-${r}`,
          regNo: getVal(0, 'reg') || `UNREG-${r}`,
          customerName: getVal(1, 'customer') || 'Customer',
          make: getVal(2, 'make') || 'Toyota',
          model: getVal(3, 'model') || '',
          year: getVal(4, 'year') || '2023',
          color: getVal(5, 'color') || '',
          contact1: getVal(6, 'contact #1') || getVal(6, 'contact') || '',
          contactPerson: getVal(7, 'contact person') || '',
          engine: getVal(8, 'engine') || '',
          chassis: getVal(9, 'chassis') || '',
          insurance: getVal(10, 'insurance') || '',
          date: getVal(11, 'date') || new Date().toISOString().split('T')[0],
          salesPerson: salesPersonName,
          assignedToUserId: matchedUser?.id,
          technicianName: getVal(13, 'technician') || '',
          orderNo: getVal(14, 'order') || `ORD-${r}`,
          instCity: getVal(15, 'city') || 'Karachi',
          showroom: getVal(16, 'showroom') || '',
          cnicNo: getVal(17, 'cnic') || '',
          insStatus: getVal(18, 'ins status') || 'Covered',
          dateOfInstallation: getVal(19, 'date of installation') || '',
          dueDate: getVal(20, 'due date') || '',
          status: (getVal(21, 'status') as any) || 'Pending',
          coordinatedBy: getVal(22, 'coordinated') || '',
          remarks: getVal(23, 'remarks') || '',
          unit: getVal(24, 'unit') || 'TK-403 4G',
          trackerStatus: (getVal(25, 'tracker status') as any) || 'Pending Activation',
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        newRecords.push(newRec);
      }

      setParsedPreview(newRecords);
    } catch (err: any) {
      setParseError(`Error parsing CSV: ${err.message || 'Invalid format'}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRawText(content);
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = () => {
    if (parsedPreview.length === 0) return;
    importRecords(parsedPreview, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[96dvh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/90 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('export')}
                className={`px-3 py-1 rounded-md transition-colors min-h-[32px] ${
                  mode === 'export' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Export CSV
              </button>
              {currentUser.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setMode('import')}
                  className={`px-3 py-1 rounded-md transition-colors min-h-[32px] ${
                    mode === 'import' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Import CSV
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 text-xs">
          
          {/* EXPORT MODE */}
          {mode === 'export' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Export Vehicle Tracker Records</h3>
                <p className="text-slate-500 mt-1">
                  Downloads a `.csv` file formatted with the exact 26 spreadsheet headers matching your fleet template.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block font-semibold text-slate-700">Choose Export Scope:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'filtered'}
                      onChange={() => setExportScope('filtered')}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">Current Filtered View ({visibleRecords.length} records)</span>
                      <p className="text-slate-500 text-[11px]">Exports records currently displayed on your active screen.</p>
                    </div>
                  </label>

                  {currentUser.role === 'admin' && (
                    <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === 'all'}
                        onChange={() => setExportScope('all')}
                        className="text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <span className="font-semibold text-slate-800">Complete Master Database ({records.length} records)</span>
                        <p className="text-slate-500 text-[11px]">Exports all vehicle records across all sales persons.</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 hover:underline flex items-center justify-center sm:justify-start gap-1 py-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Blank CSV Template</span>
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold flex items-center justify-center gap-1.5 shadow-xs min-h-[40px] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV File</span>
                </button>
              </div>
            </div>
          )}

          {/* IMPORT MODE */}
          {mode === 'import' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Import Vehicles from CSV Spreadsheet</h3>
                <p className="text-slate-500 mt-1">
                  Upload your existing spreadsheet. The importer automatically detects the 26 headers and auto-links sales persons.
                </p>
              </div>

              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 hover:bg-slate-50 shadow-2xs inline-block">
                    Select .csv File
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Supports UTF-8 CSV with columns: Reg No., Customer Name, Make, Model, Sales Person...
                </p>
              </div>

              {/* Paste Text Fallback */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Or Paste CSV Text Directly:
                </label>
                <textarea
                  rows={4}
                  value={csvRawText}
                  onChange={(e) => {
                    setCsvRawText(e.target.value);
                    parseCSV(e.target.value);
                  }}
                  placeholder="Paste comma-separated rows with header here..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Parsed {parsedPreview.length} vehicle records successfully</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-slate-900 focus:ring-slate-900"
                        />
                        <span>Append to existing</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-slate-900 focus:ring-slate-900"
                        />
                        <span className="text-red-600 font-medium">Replace entire fleet</span>
                      </label>
                    </div>
                  </div>

                  {/* Preview table (first 3 records) */}
                  <div className="max-h-40 overflow-x-auto overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 font-semibold text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-1.5 border-r border-slate-200 whitespace-nowrap">Reg No</th>
                          <th className="p-1.5 border-r border-slate-200 whitespace-nowrap">Customer</th>
                          <th className="p-1.5 border-r border-slate-200 whitespace-nowrap">Make/Model</th>
                          <th className="p-1.5 border-r border-slate-200 whitespace-nowrap">Sales Person</th>
                          <th className="p-1.5 border-r border-slate-200 whitespace-nowrap">Status</th>
                          <th className="p-1.5 whitespace-nowrap">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.slice(0, 5).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-1.5 font-mono font-medium whitespace-nowrap">{p.regNo}</td>
                            <td className="p-1.5 whitespace-nowrap">{p.customerName}</td>
                            <td className="p-1.5 whitespace-nowrap">{p.make} {p.model}</td>
                            <td className="p-1.5 font-medium whitespace-nowrap">{p.salesPerson}</td>
                            <td className="p-1.5 whitespace-nowrap">{p.status}</td>
                            <td className="p-1.5 font-mono whitespace-nowrap">{p.dueDate || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedPreview.length > 5 && (
                    <p className="text-[10px] text-slate-400 text-center">
                      ...and {parsedPreview.length - 5} more records
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-blue-600 hover:underline flex items-center justify-center sm:justify-start gap-1 py-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>

                <button
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleImportSubmit}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 font-semibold flex items-center justify-center gap-1.5 shadow-xs min-h-[40px] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import {parsedPreview.length} Records</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
