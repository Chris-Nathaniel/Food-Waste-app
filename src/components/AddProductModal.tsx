import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, Sparkles, AlertCircle } from "lucide-react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: {
    sku: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    costPrice: number;
    expirationDate: string;
    comment: string;
  }) => void;
}

const CATEGORIES = ["Produce", "Meat & Seafood", "Dairy", "Bakery", "Pantry", "Deli"];
const UNITS = ["packs", "kg", "pcs", "bags", "bottles", "tubs", "items", "jars", "10-butir", "bungkus_500g", "botol_1L", "blok_165g", "cup"];

export default function AddProductModal({ isOpen, onClose, onAdd }: AddProductModalProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Produce");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("packs");
  const [unitPrice, setUnitPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const autoGenerateSku = () => {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setSku(`${categoryCode}-${randNum}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Nama produk wajib diisi.");
      return;
    }
    if (!expirationDate) {
      setErrorMsg("Tanggal kedaluwarsa wajib dipilih.");
      return;
    }
    const parsedUnitPrice = parseFloat(unitPrice);
    const parsedCostPrice = parseFloat(costPrice);

    if (isNaN(parsedUnitPrice) || parsedUnitPrice <= 0) {
      setErrorMsg("Harga jual eceran harus berupa angka lebih besar dari 0.");
      return;
    }
    if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
      setErrorMsg("Harga beli grosir harus berupa angka non-negatif.");
      return;
    }
    if (parsedCostPrice > parsedUnitPrice) {
      setErrorMsg("Harga modal melebihi harga jual. Harap periksa kembali margin profit.");
      return;
    }

    onAdd({
      sku: sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      category,
      quantity: Math.max(1, parseInt(quantity) || 1),
      unit,
      unitPrice: parsedUnitPrice,
      costPrice: parsedCostPrice,
      expirationDate,
      comment: comment.trim() || "Penerimaan stok merchandising awal.",
    });

    // Reset inputs
    setSku("");
    setName("");
    setCategory("Produce");
    setQuantity("10");
    setUnit("packs");
    setUnitPrice("");
    setCostPrice("");
    setExpirationDate("");
    setComment("");
    setErrorMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        {/* Backdrop click closes modal */}
        <div className="absolute inset-0 z-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="relative bg-emerald-700 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-bold text-lg">Manifes Penerimaan Stok Baru</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-emerald-100 hover:bg-emerald-600 transition-colors focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-600/30" />
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-800">
            {errorMsg && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 flex gap-2.5 items-start text-xs text-rose-800">
                <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 text-rose-500 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Peringatan Validasi Formulir</p>
                  <p className="text-slate-600 leading-normal">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Product Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nama Produk *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Daging Sapi Giling Premium 500g"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Catalog Numbers & Automatic SKU generation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kode SKU</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Contoh: MEAT-8812"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px] uppercase"
                  />
                  <button
                    type="button"
                    onClick={autoGenerateSku}
                    className="flex-shrink-0 inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 px-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-amber-500" /> Auto
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Kategori / Departemen</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  {CATEGORIES.map((cat) => {
                    const categoryLabels: Record<string, string> = {
                      "Produce": "Sayuran & Buah",
                      "Meat & Seafood": "Daging & Makanan Laut",
                      "Dairy": "Susu & Olahannya",
                      "Bakery": "Roti & Kue",
                      "Pantry": "Sembako",
                      "Deli": "Deli & Dapur"
                    };
                    return (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat] || cat}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tanggal Kedaluwarsa *</label>
              <input
                type="date"
                required
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Inventory Quantity vs Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Jumlah Stok Penerimaan</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="10"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tipe Satuan</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Wholesaler Cost vs Retail Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Harga Beli Grosir (Modal) *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Contoh: 21000"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Harga Jual Eceran *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="Contoh: 28000"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Reception notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Catatan Penerimaan (Kualitas/Palet)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tulis detail mengenai pengujian kualitas saat serah terima, kondisi suhu, atau catatan nomor palet..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-20 resize-none"
              />
            </div>
          </form>

          {/* Footer controls */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleFormSubmit}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" /> Simpan ke Inventaris
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
