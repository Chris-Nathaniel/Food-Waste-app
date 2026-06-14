import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, HandHeart, Leaf, CookingPot, Trash2, ArrowRight, AlertTriangle } from "lucide-react";
import { Product, WasteActionType } from "../types";
import { formatPrice } from "../utils";

interface ActionLogModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onLogAction: (
    productId: string,
    quantity: number,
    action: WasteActionType,
    comment: string,
    lossAmount: number,
    potentialSaved: number
  ) => void;
}

export default function ActionLogModal({ product, isOpen, onClose, onLogAction }: ActionLogModalProps) {
  const [quantity, setQuantity] = useState(product.quantity.toString());
  const [action, setAction] = useState<WasteActionType>("Donated");
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const parsedQty = Math.min(product.quantity, Math.max(1, parseInt(quantity) || 0));

  const actionTypes: { type: WasteActionType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    {
      type: "Donated",
      label: "Donasi Amal (Food Bank)",
      icon: <HandHeart className="h-5 w-5" />,
      color: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
      desc: "Kemas kembali untuk dikirim ke bank makanan (Food Bank), dapur umum swadaya, atau relawan pemulihan makanan.",
    },
    {
      type: "Deli Repurposed",
      label: "Dialihkan ke Dapur Deli",
      icon: <CookingPot className="h-5 w-5" />,
      color: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
      desc: "Kirim produk segar mentah, roti, atau daging ke dapur internal bar salad atau konter deli siap saji hangat.",
    },
    {
      type: "Composted",
      label: "Pengomposan Organik",
      icon: <Leaf className="h-5 w-5" />,
      color: "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100",
      desc: "Salurkan buah/sayuran layu dan sisa organik ke fasilitas pengolah kompos kota atau mitra pupuk pertanian.",
    },
    {
      type: "Discarded",
      label: "Pembuangan ke TPA",
      icon: <Trash2 className="h-5 w-5" />,
      color: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
      desc: "Pembuangan limbah total. Penjemputan sampah standar komersial; menghasilkan gas metana di tempat pembuangan akhir.",
    },
  ];

  // Calculations
  const calculatedLossValue = Number((parsedQty * product.costPrice).toFixed(2));
  let calculatedSalvageValue = 0;
  if (action === "Deli Repurposed") {
    calculatedSalvageValue = Number((parsedQty * product.unitPrice).toFixed(2)); // Reclaim full retail sale target
  } else if (action === "Donated") {
    calculatedSalvageValue = Number((parsedQty * product.costPrice).toFixed(2)); // Valued at cost saved
  } else if (action === "Composted") {
    calculatedSalvageValue = Number((parsedQty * product.costPrice * 0.1).toFixed(2)); // Modest soil weight reclaim
  }

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQty <= 0) {
      setErrorMessage("Harap masukkan jumlah yang valid untuk dicatat.");
      return;
    }
    if (parsedQty > product.quantity) {
      setErrorMessage(`Jumlah stok tidak tersedia. Maksimal stok sisa di rak adalah ${product.quantity}.`);
      return;
    }

    onLogAction(
      product.id,
      parsedQty,
      action,
      comment || `Pencatatan manual ${parsedQty} unit untuk status ${action}.`,
      calculatedLossValue,
      calculatedSalvageValue
    );

    setComment("");
    setErrorMessage("");
    onClose();
  };

  const categoryLabels: Record<string, string> = {
    "Produce": "Sayuran & Buah",
    "Meat & Seafood": "Daging & Makanan Laut",
    "Dairy": "Susu & Olahannya",
    "Bakery": "Roti & Kue",
    "Pantry": "Sembako",
    "Deli": "Deli & Dapur"
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm text-slate-900">
        {/* Backdrop click closes modal */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="relative bg-emerald-700 p-5 text-white flex items-center justify-between">
            <div>
              <h3 className="font-sans font-bold text-lg leading-tight">Penghapusan Stok & Tindakan Zero-Waste</h3>
              <p className="text-xs text-emerald-100 font-medium">Catat pembuangan atau pemulihan nilai untuk stok habis masa pajang</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-emerald-100 hover:bg-emerald-600 transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-600/30" />
          </div>

          <form onSubmit={handleActionSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-800">
            {errorMessage && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 flex gap-2 text-xs text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <p className="font-medium">{errorMessage}</p>
              </div>
            )}

            {/* Target Item summary */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <span className="font-mono text-[9px] font-bold text-slate-400 block uppercase">{product.sku}</span>
                <span className="font-bold text-slate-800 text-sm block">{product.name}</span>
                <span className="text-slate-500 font-medium mt-0.5 block">
                  Kategori: <strong className="text-slate-700">{categoryLabels[product.category] || product.category}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-semibold block uppercase">SISA DI RAK</span>
                <span className="text-slate-800 font-extrabold text-base block">{product.quantity} {product.unit}</span>
              </div>
            </div>

            {/* Action options */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">1. Pilih Tindakan Pencegahan Sampah</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {actionTypes.map((type) => {
                  const isActive = action === type.type;
                  return (
                    <button
                      key={type.type}
                      type="button"
                      onClick={() => setAction(type.type)}
                      className={`relative flex flex-col items-start p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all focus:outline-none ${
                        isActive
                          ? "border-emerald-600 ring-2 ring-emerald-500/10 bg-slate-50 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${isActive ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-500 border-slate-100"}`}>
                          {type.icon}
                        </div>
                        <span className="text-xs font-bold text-slate-800 leading-tight">{type.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal mt-2">
                        {type.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">2. Jumlah yang Diproses</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={product.quantity}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium lowercase">
                    {product.unit}
                  </div>
                </div>
              </div>

              {/* Set full block action trigger */}
              <button
                type="button"
                onClick={() => setQuantity(product.quantity.toString())}
                className="text-xs text-slate-600 font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 hover:bg-slate-100 transition-colors cursor-pointer text-center h-[38px] flex items-center justify-center"
              >
                Catat Semua ({product.quantity})
              </button>
            </div>

            {/* Calculations & Salvage Margin summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 text-xs text-slate-600 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proyeksi Dampak Keuangan</span>
              
              <div className="flex justify-between items-center text-slate-700">
                <span>Kerugian harga beli (Nilai dihapus):</span>
                <span className="font-mono font-bold text-rose-600">{formatPrice(calculatedLossValue)}</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-700 border-t border-dashed border-slate-200 pt-2.5">
                <span>Ekonomi sisa yang dipulihkan:</span>
                <span className="font-mono font-bold text-emerald-600">{formatPrice(calculatedSalvageValue)}</span>
              </div>

              {action === "Donated" && (
                <div className="bg-emerald-50 rounded-xl p-2.5 text-[11px] text-emerald-800 border border-emerald-100/30 font-medium">
                  💚 Nilai donasi ini menyediakan sekitar <strong>{(parsedQty * 1.5).toFixed(0)} porsi makanan</strong> untuk keluarga yang membutuhkan secara lokal. Berfungsi sebagai tax write-off.
                </div>
              )}
              {action === "Deli Repurposed" && (
                <div className="bg-indigo-50 rounded-xl p-2.5 text-[11px] text-indigo-800 border border-indigo-100/30 font-medium">
                  🍳 Pengalihan bahan dapur meminimalkan kerugian biaya beli, mengubah stok berlebih mentah langsung menjadi menu siap saji hangat di konter deli.
                </div>
              )}
            </div>

            {/* Comments log */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">3. Catatan Komentar & Tindakan yang Diambil</label>
              <textarea
                value={comment}
                required
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contoh: Sisa steak beku dari hari Selasa; dialihkan langsung ke stasiun deli untuk sajian roti daging panggang hangat."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none h-20 resize-none"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleActionSubmit}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Kirim Catatan Tindakan <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
