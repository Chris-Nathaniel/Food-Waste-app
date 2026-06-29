import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trash2, ShoppingCart, History, RotateCcw } from "lucide-react";
import { Product, categoryLabels } from "../types";
import { formatPrice } from "../utils";

interface ProductCatalogGridProps {
  products: Product[];
  onRecommend: (product: Product) => void;
  onLogAction: (product: Product) => void;
  onMarkSold: (productId: string, sellQty: number) => void;
  onRevertMarkdown: (productId: string) => void;
}

export default function ProductCatalogGrid({
  products,
  onRecommend,
  onLogAction,
  onMarkSold,
  onRevertMarkdown,
}: ProductCatalogGridProps) {
  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({});
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
    handleQtyChange(product.id, "1");
  };

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
        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg px-2.5 py-1 text-[11px] font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
          EXPIRED ({Math.abs(daysLeft)} hari lalu)
        </span>
      );
    } else if (daysLeft === 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-900 rounded-lg px-2.5 py-1 text-[11px] font-extrabold animate-pulse">
          ⚡ KEDALUWARSA HARI INI
        </span>
      );
    } else if (daysLeft <= 2) {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-50/50 text-amber-800 border border-amber-200 rounded-lg px-2.5 py-1 text-[11px] font-bold">
          ⚠️ KRITIS ({daysLeft} hari lagi)
        </span>
      );
    } else if (daysLeft <= 5) {
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-850 border border-yellow-200 rounded-lg px-2.5 py-1 text-[11px] font-semibold">
          📊 PERHATIAN ({daysLeft} hari lagi)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-2.5 py-1 text-[11px] font-semibold">
          ✅ AMAN ({daysLeft} hari lagi)
        </span>
      );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <div
            key={product.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group"
          >
            {/* Top section with SKU and Category */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded select-all">
                  {product.sku}
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider select-none">
                  {categoryLabels[product.category] || product.category}
                </span>
              </div>

              {/* Product Name */}
              <h4 className="font-extrabold text-slate-850 text-sm group-hover:text-emerald-800 transition-colors line-clamp-2">
                {product.name}
              </h4>

              {/* Price and Stock level Subscript */}
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 pt-0.5">
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

            {/* Badges / Metrics Section */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 items-center">
                {getExpiryBadge(daysLeft)}
                <span
                  className={`inline-block text-[9px] font-extrabold px-2 py-1 rounded border select-none ${
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
            </div>

            {/* Simulasi Kasir (Sell Qty Action) */}
            <div className="pt-2 border-t border-slate-100">
              {product.quantity > 0 && daysLeft >= 0 ? (
                <form
                  onSubmit={(e) => handleSellCheckoutSubmit(e, product)}
                  className="flex items-center gap-1.5 w-full"
                >
                  <input
                    type="number"
                    min="1"
                    max={product.quantity}
                    value={sellQty}
                    onChange={(e) => handleQtyChange(product.id, e.target.value)}
                    className="w-14 text-xs rounded-lg border border-slate-200 py-1.5 px-1.5 focus:outline-none focus:border-emerald-500 font-bold text-center"
                    placeholder="Qty"
                  />
                  <button
                    type="submit"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-extrabold py-1.5 rounded-lg transition shadow-sm border border-slate-700 cursor-pointer"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Jual
                  </button>
                </form>
              ) : (
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center py-1">
                  Tidak tersedia untuk kasir
                </span>
              )}
            </div>

            {/* Aksi Buttons */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => toggleHistory(product.id)}
                className={`flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-extrabold py-1.5 rounded-lg border transition cursor-pointer select-none ${
                  isHistoryOpen
                    ? "bg-slate-100 border-slate-300 text-slate-800"
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
                title="Tampilkan riwayat log audit tindakan"
              >
                <History className="h-3.5 w-3.5" />
                {isHistoryOpen ? "Tutup Log" : "Log Riwayat"}
              </button>

              <button
                onClick={() => onLogAction(product)}
                className="p-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition cursor-pointer"
                title="Catat pembuangan/mitigasi manual"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              {product.quantity > 0 && daysLeft >= 0 && (
                isDiscounted ? (
                  <button
                    type="button"
                    onClick={() => onRevertMarkdown(product.id)}
                    className="p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-all cursor-pointer border border-amber-650"
                    title="Batalkan optimasi harga dan kembalikan ke normal"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRecommend(product)}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all cursor-pointer border border-emerald-650"
                    title="Optimasi Harga"
                  >
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300" />
                  </button>
                )
              )}
            </div>

            {/* Audit Logs */}
            <AnimatePresence initial={false}>
              {isHistoryOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-left mt-2"
                >
                  <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[8px] block mb-2">
                    Buku Catatan Riwayat Audit (Log Aktivitas)
                  </span>
                  {product.history && product.history.length > 0 ? (
                    <div className="space-y-2 relative pl-1.5 before:absolute before:left-2 before:top-1 before:bottom-1 before:w-[1px] before:bg-slate-200">
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
                          <div key={i} className="pl-4 relative text-[10px]">
                            <span className="absolute left-1 top-1.5 w-1.5 h-1.5 rounded-full bg-slate-350" />
                            <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
                              <span className="font-extrabold text-slate-700">
                                {actionLabels[hist.action] || hist.action}
                              </span>
                              <span className="font-mono text-[9px]">
                                {new Date(hist.timestamp).toLocaleDateString("id-ID", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                              {hist.comment}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-450 italic">
                      Belum ada riwayat aktivitas.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
