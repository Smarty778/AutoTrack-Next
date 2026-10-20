'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History, Search, Car, User, Clock, ShieldCheck } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApp();
  const [logSearch, setLogSearch] = useState('');

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.actorName.toLowerCase().includes(logSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
    (log.recordRegNo && log.recordRegNo.toLowerCase().includes(logSearch.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full flex flex-col">
      
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs w-full">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <span>Audit Trail &amp; Record Assignment History</span>
          </h2>
          <p className="text-slate-500 text-[11px] mt-0.5">
            System audit log of assignments, service continuations, and record updates.
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search logs by user, action, or Reg #..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-270px)] min-h-[460px] w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold select-none">
            <tr>
              <th className="px-4 py-2.5 w-44">Timestamp</th>
              <th className="px-4 py-2.5 w-48">Actor (User)</th>
              <th className="px-4 py-2.5 w-44">Action</th>
              <th className="px-4 py-2.5 w-36">Reg No.</th>
              <th className="px-4 py-2.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No activity logs matching your search.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const dateObj = new Date(log.timestamp);
                const timeStr = isNaN(dateObj.getTime())
                  ? log.timestamp
                  : `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 font-mono-numbers whitespace-nowrap">
                      {timeStr}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                      {log.actorName}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono-numbers font-semibold text-blue-700 whitespace-nowrap">
                      {log.recordRegNo || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {log.details}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
