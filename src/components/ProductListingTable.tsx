import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trash2, ShoppingCart, History, RotateCcw } from "lucide-react";
import { Product, categoryLabels } from "../types";
import { formatPrice } from "../utils";

interface ProductListingTableProps {
  products: Product[];
  onRecommend: (product: Product) => void;
  onLogAction: (product: Product) => void;
  onMarkSold: (productId: string, sellQty: number) => void;
  onRevertMarkdown: (productId: string) => void;
}

export default function ProductListingTable({
  products,
  onRecommend,
  onLogAction,
  onMarkSold,
  onRevertMarkdown,
}: ProductListingTableProps) {
  // Store which product IDs have their history expanded
  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({});
  // Store checkout quantities per product ID
  const [sellQuantities, setSellQuantities] = useState<Record<string, string>>({});

  const toggleHistory = (productId: string) => {
    setExpandedHistories((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleQtyChange = (productId: string, value: string) => {
    setSellQuantities((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleSellCheckoutSubmit = (e: React.FormEvent, product: Product) => {
    e.preventDefault();
    const qtyStr = sellQuantities[product.id] || "1";
    const qty = Math.max(1, parseInt(qtyStr) || 1);
    if (qty > product.quantity) return;
    onMarkSold(product.id, qty);
    // Reset individual qty back to 1
    handleQtyChange(product.id, "1");
  };

  // Helper to determine remaining days
  const getDaysRemaining = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    expiry.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadge = (daysLeft: number) => {
    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg px-2 py-0.5 text-[11px] font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
          EXPIRED ({Math.abs(daysLeft)} hari lalu)
        </span>
      );
    } else if (daysLeft === 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-900 rounded-lg px-2 py-0.5 text-[11px] font-extrabold animate-pulse">
          ⚡ KEDALUWARSA HARI INI
        </span>
      );
    } else if (daysLeft <= 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-250 rounded-lg px-2 py-0.5 text-[11px] font-bold">
          ⚠️ KRITIS ({daysLeft} hari lagi)
        </span>
      );
    } else if (daysLeft <= 5) {
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-850 border border-yellow-200 rounded-lg px-2 py-0.5 text-[11px] font-semibold">
          📊 PERHATIAN ({daysLeft} hari lagi)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2 py-0.5 text-[11px] font-semibold">
          ✅ AMAN ({daysLeft} hari lagi)
        </span>
      );
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm">
      <table className="w-full text-left border-collapse min-w-[750px] text-slate-700">
        <thead>
          <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider select-none">
            <th className="py-3.5 px-5">Detail Produk & Informasi</th>
            <th className="py-3.5 px-4">Status & Margin</th>
            <th className="py-3.5 px-4">Simulasi Kasir</th>
            <th className="py-3.5 px-5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => {
            const daysLeft = getDaysRemaining(product.expirationDate);
            const isDiscounted = product.status === "Discounted" || product.appliedDiscount > 0;
            const currentPrice = isDiscounted
              ? Number((product.unitPrice * (1 - product.appliedDiscount / 100)).toFixed(2))
              : product.unitPrice;

            const profitMarginPercent = Number(
              (((currentPrice - product.costPrice) / currentPrice) * 100).toFixed(0)
            );

            const isHistoryOpen = !!expandedHistories[product.id];
            const sellQty = sellQuantities[product.id] || "1";

            return (
              <React.Fragment key={product.id}>
                {/* Main product row */}
                <tr className="hover:bg-slate-50/50 transition duration-150 group">
                  {/* Name, price, quantity, and SKU combined column */}
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      {/* Product ID / SKU at the top */}
                      <div className="font-mono text-[10px] font-bold text-slate-400 select-all tracking-wider uppercase">
                        {product.sku}
                      </div>
                      
                      {/* Product Name & Category */}
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-850 text-sm group-hover:text-emerald-800 transition-colors">
                          {product.name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider select-none">
                          {categoryLabels[product.category] || product.category}
                        </span>
                      </div>

                      {/* Subscript [price] | [qty] */}
                      <div className="flex items-center gap-x-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {formatPrice(currentPrice)}
                          {isDiscounted && (
                            <span className="text-[10px] text-slate-400 line-through font-normal ml-1">
                              {formatPrice(product.unitPrice)}
                            </span>
                          )}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="font-medium text-slate-600">
                          {product.quantity > 0 ? (
                            <span>Stok: <strong className="font-bold text-slate-800">{product.quantity}</strong> {product.unit}</span>
                          ) : (
                            <span className="text-rose-550 font-bold">Habis</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Expiry badge & Margin column */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      {getExpiryBadge(daysLeft)}
                      <span
                        className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          profitMarginPercent > 30
                            ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                            : profitMarginPercent > 0
                            ? "bg-amber-50 text-amber-850 border-amber-200"
                            : "bg-rose-50 text-rose-800 border-rose-100"
                        }`}
                      >
                        Margin: {profitMarginPercent}%
                      </span>
                    </div>
                  </td>

                  {/* Quick Checkout Form Column */}
                  <td className="py-4 px-4">
                    {product.quantity > 0 && daysLeft >= 0 ? (
                      <form
                        onSubmit={(e) => handleSellCheckoutSubmit(e, product)}
                        className="flex items-center gap-1.5 max-w-[180px]"
                      >
                        <input
                          type="number"
                          min="1"
                          max={product.quantity}
                          value={sellQty}
                          onChange={(e) => handleQtyChange(product.id, e.target.value)}
                          className="w-14 text-xs rounded-lg border border-slate-200 py-1 px-1.5 focus:outline-none focus:border-emerald-500 font-bold text-center"
                          placeholder="Qty"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-extrabold px-2 py-1.5 rounded-lg transition shadow-sm border border-slate-700 cursor-pointer"
                        >
                          <ShoppingCart className="h-3 w-3" /> Jual
                        </button>
                      </form>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tidak tersedia
                      </span>
                    )}
                  </td>

                  {/* Action & Optimization button column */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {/* Audit Timeline Trigger */}
                      <button
                        onClick={() => toggleHistory(product.id)}
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-1.5 rounded-lg border transition cursor-pointer select-none ${
                          isHistoryOpen
                            ? "bg-slate-100 border-slate-300 text-slate-800"
                            : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                        title="Tampilkan riwayat log audit tindakan"
                      >
                        <History className="h-3.5 w-3.5" />
                        {isHistoryOpen ? "Tutup Log" : "Log Riwayat"}
                      </button>

                      {/* Log Action/Write-off (trash button) */}
                      <button
                        onClick={() => onLogAction(product)}
                        className="p-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition cursor-pointer"
                        title="Catat pembuangan/mitigasi manual"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* AI Optimization Buttons */}
                      {product.quantity > 0 && daysLeft >= 0 && (
                        isDiscounted ? (
                          <button
                            type="button"
                            onClick={() => onRevertMarkdown(product.id)}
                            className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer border border-amber-650"
                            title="Batalkan optimasi harga dan kembalikan ke normal"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset Optimasi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRecommend(product)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer border border-emerald-650"
                          >
                            <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300" /> Optimasi Harga
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded history timeline row */}
                <AnimatePresence initial={false}>
                  {isHistoryOpen && (
                    <tr className="bg-slate-50/40 border-b border-slate-100">
                      <td colSpan={4} className="py-3 px-6">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="py-2.5 pb-3 max-w-4xl space-y-3">
                            <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px] block">
                              Buku Catatan Riwayat Audit (Log Aktivitas)
                            </span>
                            {product.history && product.history.length > 0 ? (
                              <div className="space-y-3 relative pl-1.5 before:absolute before:left-2.5 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-slate-200">
                                {product.history.map((hist, i) => {
                                  const actionLabels: Record<string, string> = {
                                    Stocked: "Stok Ditambah",
                                    Discounted: "Diskon Harga (Optimasi)",
                                    "Deli Repurposed": "Dialihkan ke Deli",
                                    Donated: "Didonasikan",
                                    Composted: "Dikomposkan",
                                    Discarded: "Dibuang",
                                    Sold: "Terjual Kasir",
                                  };
                                  return (
                                    <div key={i} className="pl-6 relative">
                                      <span className="absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-350 ring-4 ring-slate-50 group-hover:bg-emerald-600 transition" />
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        <span className="font-extrabold text-slate-700">
                                          {actionLabels[hist.action] || hist.action}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-mono">
                                          {new Date(hist.timestamp).toLocaleString("id-ID", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-slate-500 text-xs font-medium mt-0.5 leading-relaxed">
                                        {hist.comment}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-450 italic pl-1">
                                Belum ada riwayat aktivitas tercatat untuk produk ini.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
