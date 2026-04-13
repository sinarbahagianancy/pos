import React, { useState } from "react";
import { AuditLog } from "../../app/types";
import Pagination from "../../app/components/Pagination";

interface AuditLogProps {
  logs: AuditLog[];
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

const AuditLogView: React.FC<AuditLogProps> = ({
  logs,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  perPage = 20,
  onPerPageChange,
}) => {
  const [filterAction, setFilterAction] = useState<string>("All");

  const filterOptions = [
    "All",
    "Stock Addition",
    "Sales Deduction",
    "Manual Correction",
    "Product Update",
    "Settings Update",
    "General",
  ];

  // Use filtered logs for display - but pagination shows actual data
  const filteredLogs =
    filterAction === "All" ? logs : logs.filter((log) => log.action === filterAction);

  return (
    <div className="space-y-8 pb-10 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
            System Security & Audit Log
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Activity history for this POS system
          </p>
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-3 rounded-xl text-sm font-bold border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {filterOptions.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All Activities" : option}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">Time</th>
                <th className="px-10 py-6">Activity</th>
                <th className="px-10 py-6">Details</th>
                <th className="px-10 py-6">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-6">
                      <span className="text-slate-600 font-bold text-sm">
                        {new Date(log.timestamp).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                          log.action === "Stock Addition"
                            ? "bg-green-100 text-green-700"
                            : log.action === "Sales Deduction"
                              ? "bg-red-100 text-red-700"
                              : log.action === "Manual Correction"
                                ? "bg-amber-100 text-amber-700"
                                : log.action === "Product Update"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-slate-600 text-sm">{log.details}</span>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-slate-900 font-bold text-sm">{log.staffName}</span>
                    </td>
                  </tr>
                ))
              ) : (
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

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange || (() => {})}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        itemLabel="audit logs"
      />
    </div>
  );
};

export default AuditLogView;
