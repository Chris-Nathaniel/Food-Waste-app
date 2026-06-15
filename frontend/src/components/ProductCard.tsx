import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Calendar, ClipboardList, ShieldAlert, BadgePercent, Trash2, ShoppingCart, History, Info } from "lucide-react";
import { Product, categoryLabels } from "../types";
import { formatPrice } from "../utils";

interface ProductCardProps {
  key?: string | number;
  id: string;
  product: Product;
  onRecommend: (product: Product) => void;
  onLogAction: (product: Product) => void;
  onMarkSold: (productId: string, sellQty: number) => void;
}

export default function ProductCard({ id, product, onRecommend, onLogAction, onMarkSold }: ProductCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [sellQuantity, setSellQuantity] = useState("1");

  // Calculate days remaining
  const getDaysRemaining = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    expiry.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysRemaining(product.expirationDate);

  const getExpiryBadge = () => {
    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg px-2.5 py-1 text-xs font-bold leading-none">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
          KEDALUWARSA ({Math.abs(daysLeft)} hari lalu)
        </span>
      );
    } else if (daysLeft === 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-extrabold leading-none animate-pulse">
          ⚡ KEDALUWARSA HARI INI
        </span>
      );
    } else if (daysLeft <= 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-850 border border-amber-200 text-amber-800 rounded-lg px-2.5 py-1 text-xs font-bold leading-none">
          ⚠️ KRITIS ({daysLeft} hari lagi)
        </span>
      );
    } else if (daysLeft <= 5) {
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg px-2.5 py-1 text-xs font-semibold leading-none">
          📊 PERLU PERHATIAN ({daysLeft} hari lagi)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2.5 py-1 text-xs font-semibold leading-none">
          ✅ AMAN ({daysLeft} hari lagi)
        </span>
      );
    }
  };

  // Determine pricing status layout
  const isDiscounted = product.status === "Discounted" || product.appliedDiscount > 0;
  const currentPrice = isDiscounted
    ? Number((product.unitPrice * (1 - product.appliedDiscount / 100)).toFixed(2))
    : product.unitPrice;

  const profitMarginPercent = Number((((currentPrice - product.costPrice) / currentPrice) * 100).toFixed(0));

  const handleSellCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.max(1, parseInt(sellQuantity) || 1);
    if (qty > product.quantity) return;
    onMarkSold(product.id, qty);
    setSellQuantity("1");
  };

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border transition-all text-slate-900 bg-white flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md ${
        daysLeft < 0
          ? "border-rose-100 hover:border-rose-200"
          : daysLeft <= 2
          ? "border-amber-100 hover:border-amber-200"
          : "border-slate-100"
      }`}
    >
      {/* Expiry Warning Header strip */}
      {daysLeft < 0 && (
        <div className="bg-rose-50 px-4 py-1.5 border-b border-rose-100/50 flex justify-between items-center text-[10px] text-rose-800 font-extrabold tracking-wide uppercase">
          <span>Tindakan Diperlukan</span>
          <span>Masa Pajang Habis</span>
        </div>
      )}
      {daysLeft === 0 && (
        <div className="bg-amber-100 px-4 py-1.5 border-b border-amber-200/50 flex justify-between items-center text-[10px] text-amber-950 font-extrabold tracking-wide uppercase">
          <span>Pembersihan Aktif</span>
          <span>Periksa tampilan rak visual</span>
        </div>
      )}

      {/* Main card payload container */}
      <div className="p-5 flex-1 space-y-4">
        {/* Row 1: Identification & Alerts */}
        <div className="flex flex-wrap items-start justify-between gap-1.5">
          <span className="font-mono text-[9px] font-extrabold text-slate-400 select-all tracking-wider uppercase">
            {product.sku}
          </span>
          {getExpiryBadge()}
        </div>

        {/* Row 2: Title & Category */}
        <div className="space-y-1">
          <h4 className="font-sans font-bold text-slate-800 text-sm leading-snug line-clamp-2 h-10" title={product.name}>
            {product.name}
          </h4>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {categoryLabels[product.category] || product.category}
          </span>
        </div>

        {/* Row 3: Sizing counts */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-150/50 rounded-xl p-3 text-xs">
          <span className="font-medium text-slate-500">Tingkat Persediaan:</span>
          <span className="font-bold text-slate-800 text-sm">
            {product.quantity > 0 ? (
              <>
                {product.quantity} <span className="text-slate-400 text-xs font-normal">{product.unit}</span>
              </>
            ) : (
              <span className="text-rose-500 font-extrabold italic uppercase">HABIS TERJUAL</span>
            )}
          </span>
        </div>

        {/* Row 4: Financial ledger */}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Harga Jual Unit</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base text-slate-800">{formatPrice(currentPrice)}</span>
              {isDiscounted && (
                <span className="text-xs text-slate-400 line-through">{formatPrice(product.unitPrice)}</span>
              )}
            </div>
          </div>

          <div className="space-y-0.5 text-right">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Proyeksi Margin</span>
            <div>
              <span className={`inline-block text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
                profitMarginPercent > 30 ? "bg-emerald-50 text-emerald-800" : (profitMarginPercent > 0 ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-800")
              }`}>
                {profitMarginPercent > 0 ? `${profitMarginPercent}%` : "Tanpa Margin"}
              </span>
            </div>
          </div>
        </div>

        {/* History indicator timeline */}
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border-t border-dashed border-slate-200 pt-3 text-[11px] space-y-2 max-h-40 overflow-y-auto"
          >
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Buku Catatan Riwayat</span>
            <div className="space-y-3 relative before:absolute before:left-1 before:top-1 before:bottom-1 before:w-[1px] before:bg-slate-200">
              {product.history?.map((hist, i) => {
                const actionLabels: Record<string, string> = {
                  "Stocked": "Stok Ditambah",
                  "Discounted": "Diskon Harga",
                  "Deli Repurposed": "Dialihkan ke Deli",
                  "Donated": "Didonasikan",
                  "Composted": "Dikomposkan",
                  "Discarded": "Dibuang",
                  "Sold": "Terjual Kasir"
                };
                return (
                  <div key={i} className="pl-4 relative">
                    <span className="absolute left-0 top-1 w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-slate-700">{actionLabels[hist.action] || hist.action}</span>
                      <span className="font-mono">{new Date(hist.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-500 text-xs leading-normal mt-0.5">{hist.comment}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Control Actions footer */}
      <div className="bg-slate-50/50 border-t border-slate-100 p-4 space-y-3">
        {/* Quick checkout simulator */}
        {product.quantity > 0 && daysLeft >= 0 && (
          <form onSubmit={handleSellCheckout} className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                max={product.quantity}
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 py-2 pl-3 pr-2 focus:outline-none focus:border-emerald-500 font-semibold"
                placeholder="Jumlah"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl border border-slate-700 shadow-sm transition-colors cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Jual Kasir
            </button>
          </form>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* History Toggle button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-[11px] font-bold hover:underline cursor-pointer"
          >
            <History className="h-3.5 w-3.5" />
            {showHistory ? "Sembunyikan Audit" : "Audit Alur Riwayat"}
          </button>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Log write off directly */}
            <button
              onClick={() => onLogAction(product)}
              className="p-2 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              title="Catat pembuangan/mitigasi"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* AI Recommend advice */}
            {product.quantity > 0 && daysLeft >= 0 && (
              <button
                onClick={() => onRecommend(product)}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer border border-emerald-600 font-sans"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300" /> Optimasi Harga
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
