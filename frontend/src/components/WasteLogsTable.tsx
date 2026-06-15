import React, { useState } from "react";
import { motion } from "motion/react";
import { HandHeart, Leaf, CookingPot, Trash2, Calendar, FileSpreadsheet, Search } from "lucide-react";
import { WasteLog, WasteActionType } from "../types";
import { formatPrice } from "../utils";

interface WasteLogsTableProps {
  logs: WasteLog[];
}

export default function WasteLogsTable({ logs }: WasteLogsTableProps) {
  const [filterAction, setFilterAction] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === "All" || log.action === filterAction;
    const matchesSearch =
      log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action: WasteActionType) => {
    switch (action) {
      case "Donated":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            <HandHeart className="h-3.5 w-3.5" /> Donasi Amal
          </span>
        );
      case "Deli Repurposed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
            <CookingPot className="h-3.5 w-3.5" /> Dapur Deli
          </span>
        );
      case "Composted":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
            <Leaf className="h-3.5 w-3.5" /> Kompos Organik
          </span>
        );
      case "Discarded":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
            <Trash2 className="h-3.5 w-3.5" /> Dibuang ke TPA
          </span>
        );
    }
  };

  const actionLabels: Record<string, string> = {
    "All": "Semua Tindakan",
    "Donated": "Donasi",
    "Deli Repurposed": "Dapur Deli",
    "Composted": "Kompos",
    "Discarded": "Dibuang"
  };

  const categoryLabels: Record<string, string> = {
    "Produce": "Sayuran & Buah",
    "Meat & Seafood": "Daging & Makanan Laut",
    "Dairy": "Susu & Olahannya",
    "Bakery": "Roti & Kue",
    "Pantry": "Sembako",
    "Deli": "Deli & Dapur"
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-slate-800 space-y-4 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-base leading-tight">Riwayat Audit Tindakan Zero-Waste</h4>
          <p className="text-xs text-slate-400 font-medium">Rekaman log penghapusan sisa, donasi sosial, dan alih bahan baku ke dapur deli.</p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Donated", "Deli Repurposed", "Composted", "Discarded"].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterAction === act
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              {actionLabels[act] || act}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari log berdasarkan nama produk atau SKU..."
          className="w-full text-sm rounded-xl border border-slate-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Detail Produk</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4 text-center">Jumlah Dicatat</th>
              <th className="py-3 px-4 text-right">Rugi Penghapusan</th>
              <th className="py-3 px-4 text-right">Nilai Diselamatkan</th>
              <th className="py-3 px-4">Solusi Penyelamatan</th>
              <th className="py-3 px-4">Komentar / Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400 h-24">
                  Tidak ada catatan log sisa produk yang ditemukan dengan filter terpilih.
                </td>
              </tr>
            ) : (
                filteredLogs.map((log) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono flex items-center gap-1.5 mt-1.5 border-none">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> {log.date}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[9px] font-bold text-slate-400 select-all block uppercase">{log.sku}</span>
                    <span className="font-bold text-slate-800 text-xs block">{log.productName}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-semibold">{categoryLabels[log.category] || log.category}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                    {log.quantity} <span className="text-slate-400 font-normal">{log.unit}</span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-rose-600">
                    {formatPrice(log.lossAmount)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-emerald-600">
                    {formatPrice(log.potentialLossSaved)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate" title={log.comment}>
                    {log.comment}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
