
import React, { useState } from 'react';
import { AuditLog } from '../../app/types';

interface AuditLogProps {
  logs: AuditLog[];
}

const AuditLogView: React.FC<AuditLogProps> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState<string>('All');
  
  const filterOptions = [
    'All',
    'Stock Addition',
    'Sales Deduction',
    'Manual Correction',
    'Product Update',
    'Settings Update',
    'General'
  ];

  const filteredLogs = filterAction === 'All' 
    ? logs 
    : logs.filter(log => log.action === filterAction);

  return (
    <div className="space-y-8 pb-10 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">System Security & Audit Log</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight mt-2">Historical tracking of stock insertions, sales deductions, and manual adjustments.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-2">
        {filterOptions.map(option => (
          <button
            key={option}
            onClick={() => setFilterAction(option)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              filterAction === option
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-10 py-6 w-56 whitespace-nowrap">Timestamp</th>
                <th className="px-10 py-6 w-48 whitespace-nowrap">Operator</th>
                <th className="px-10 py-6 w-56 whitespace-nowrap">Event Category</th>
                <th className="px-10 py-6">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6 whitespace-nowrap">
                    <span className="text-xs text-slate-500 font-mono font-bold tracking-tight">{log.timestamp}</span>
                  </td>
                  <td className="px-10 py-6 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-[11px] font-black text-slate-600 border border-slate-200 uppercase shadow-sm">
                        {log.staffName.charAt(0)}
                      </div>
                      <span className="text-sm font-black text-slate-900">{log.staffName}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 whitespace-nowrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border shadow-sm ${
                      log.action === 'Stock Addition' ? 'bg-green-50 text-green-700 border-green-100' :
                      log.action === 'Sales Deduction' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      log.action === 'Manual Correction' ? 'bg-red-50 text-red-700 border-red-100' :
                      log.action === 'Product Update' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      log.action === 'Settings Update' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-sm text-slate-600 font-medium leading-relaxed block min-w-[300px]">{log.details}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 font-medium italic">
                    Tidak ada log untuk kategori ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
