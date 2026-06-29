import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Calendar, ArrowRight, Check, X, ShieldAlert, CookingPot, TrendingDown } from "lucide-react";
import { Product, PricingRecommendation } from "../types";
import { formatPrice } from "../utils";

interface DiscountRecommendModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onApplyMarkdown: (productId: string, discountPct: number, newPrice: number, advice: string) => void;
  onRepurposed: (productId: string, quantity: number, action: "Deli Repurposed", comment: string, potentialSaved: number) => void;
}

const LOADING_PHASES = [
  "Analyzing category-specific spoilage speeds...",
  "Calculating merchant salvage margin buffers...",
  "Estimating local volume clearance velocity...",
  "Formulating fresh deli-kitchen alternative recipes..."
];

export default function DiscountRecommendModal({
  product,
  isOpen,
  onClose,
  onApplyMarkdown,
  onRepurposed
}: DiscountRecommendModalProps) {
  const [loading, setLoading] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Loading phase rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Query API
  useEffect(() => {
    if (isOpen) {
      fetchRecommendation();
    } else {
      setRecommendation(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, product.id]);

  
  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);
    setPhaseIndex(0);

    try {
      // 1. Logika untuk menghitung sisa hari expired (AI butuh angka, bukan tanggal)
      const today = new Date();
      const expiry = new Date(product.expirationDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 2. Memanggil AI asli Anda di Google Cloud Run
      const response = await fetch("https://food-waste-ai-625899891226.asia-southeast1.run.app/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: product.name,
          harga_idr: product.unitPrice,
          stok: product.quantity,
          sisa_hari_expired: diffDays
        })
      });

      if (!response.ok) {
        throw new Error("Gagal mendapatkan respon dari server AI Anda.");
      }

      const aiData = await response.json();

      // 3. Menyesuaikan jawaban AI Anda ke tampilan UI teman Anda
      // Karena AI mengirim "50%", kita ambil angkanya saja untuk perhitungan harga baru
      const discountPercentage = parseInt(aiData.diskon_rekomendasi) || 0;
      const newPrice = product.unitPrice * (1 - discountPercentage / 100);

      const transformedData: PricingRecommendation = {
        suggestedDiscount: discountPercentage,
        suggestedRetailPrice: newPrice,
        reasoning: aiData.catatan,
        wasteImpactDescription: `AI Prediksi Penjualan: ${aiData.prediksi_jual_qty} unit. Risiko: ${aiData.risiko}.`,
        repurposeIdea: {
          title: aiData.risiko === "High Risk" ? "Urgent Stock Salvage" : "Waste Mitigation",
          description: aiData.catatan,
          deliUpsellTitle: aiData.risiko === "High Risk" ? "Deli Kitchen Priority" : "Shelf Optimization"
        }
      };

      setRecommendation(transformedData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch recommendation from AI.");
    } finally {
      setLoading(false);
    }
  };



  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        {/* Modal Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative bg-emerald-700 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600/40 p-2 rounded-xl text-emerald-100 border border-emerald-500/20">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-lg leading-tight">ML Price Optimization</h3>
                <p className="text-xs text-emerald-100/90 font-medium">Dynamic dynamic markdown & kitchen circular repurposed salvage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-emerald-100 hover:bg-emerald-600/65 transition-colors focus:outline-none cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-600/30" />
          </div>

          <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-900">
            {/* Product Summary */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-4">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-400 select-all uppercase tracking-wider">{product.sku}</span>
                  <h4 className="font-bold text-slate-800 text-base">{product.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Category: <strong className="text-slate-800">{product.category}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Quantity: <strong className="text-slate-800">{product.quantity} {product.unit}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold font-sans">ORIGINAL PRICE</div>
                  <div className="text-lg font-extrabold text-slate-800">{formatPrice(product.unitPrice)}</div>
                  <div className="text-[10px] font-mono text-slate-400">Wholesale cost: {formatPrice(product.costPrice)}</div>
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-slate-150 pt-2.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                  <Calendar className="h-4 w-4" /> Expiration: {product.expirationDate}
                </span>
                <span className="font-medium text-slate-500">
                  Margin on Cost: <strong className="text-slate-700 font-semibold">{(((product.unitPrice - product.costPrice) / product.unitPrice) * 100).toFixed(0)}%</strong>
                </span>
              </div>
            </div>

            {/* ERROR PLACEHOLDER */}
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex gap-3 text-rose-800 text-sm">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 text-rose-500" />
                <div className="space-y-1">
                  <p className="font-bold">Recommendation Error</p>
                  <p className="text-xs text-rose-700/90 leading-relaxed">{error}</p>
                  <button
                    onClick={fetchRecommendation}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-900 border border-rose-200 bg-white px-2.5 py-1 rounded-md shadow-sm hover:bg-rose-50/50 cursor-pointer"
                  >
                    Retry Query
                  </button>
                </div>
              </div>
            )}

            {/* LOADING STATE WITH CYCLING RETAIL MESSAGES */}
            {loading && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin" />
                  <Sparkles className="h-5 w-5 text-emerald-500 absolute inset-0 m-auto animate-bounce" />
                </div>
                <div className="text-center max-w-sm space-y-1">
                  <p className="text-sm font-bold text-slate-800 animate-pulse">Consulting Custom ML Model...</p>
                  <p className="text-xs text-slate-400 font-medium h-4">{LOADING_PHASES[phaseIndex]}</p>
                </div>
              </div>
            )}

            {/* RECOMMENDATION DETAILS */}
            {!loading && recommendation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Visual markdown comparative ticker */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
                  <div className="bg-slate-50 rounded-xl border border-slate-150 p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active unit price</span>
                    <p className="text-lg font-bold text-slate-400 line-through mt-0.5">{formatPrice(product.unitPrice)}</p>
                  </div>
                  
                  <div className="bg-emerald-50 rounded-xl border border-emerald-150 p-4 text-center">
                    <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">Suggested Retail</span>
                    <p className="text-2xl font-extrabold text-emerald-800 mt-0.5">{formatPrice(recommendation.suggestedRetailPrice)}</p>
                  </div>

                  <div className="bg-amber-550/10 rounded-xl border border-amber-200 p-4 text-center col-span-2 sm:col-span-1 bg-amber-50">
                    <span className="text-[10px] font-bold text-amber-700 tracking-wider uppercase">Markdown Rate</span>
                    <p className="text-2xl font-extrabold text-amber-800 flex items-center justify-center gap-1 mt-0.5">
                      <TrendingDown className="h-6 w-6 text-amber-600" />
                      {recommendation.suggestedDiscount}%
                    </p>
                  </div>
                </div>

                {/* AI Reasoning Section */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 upper-case tracking-wider uppercase">Merchandiser Logical Alignment</span>
                  <div className="bg-emerald-50/25 border-l-4 border-emerald-600 rounded-r-lg p-4 text-sm text-slate-700 leading-relaxed italic">
                    "{recommendation.reasoning}"
                  </div>
                </div>

                {/* Waste mitigation carbon offset statement */}
                <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-teal-800 block">Shed-Avoided Climate Metric</span>
                    <p className="text-xs text-teal-700 mt-1 leading-normal">{recommendation.wasteImpactDescription}</p>
                  </div>
                </div>

                {/* Deli Kitchen circular repurpose repurposeIdea */}
                <div className="border border-indigo-100 rounded-2xl p-5 bg-indigo-50/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <CookingPot className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-indigo-900 text-sm">Circular Repurposing Strategy</h5>
                      <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">Supermarket Internal Kitchen Action</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-indigo-50 p-4 shadow-sm space-y-2">
                    <div className="flex justify-between items-center bg-indigo-550/10 text-indigo-800 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50">
                      <span>Upsell Menu Item:</span>
                      <span className="underline decoration-indigo-300 font-mono text-[11px]">{recommendation.repurposeIdea.deliUpsellTitle}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {recommendation.repurposeIdea.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex flex-wrap gap-2 items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Close Window
            </button>

            {recommendation && !loading && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const quantityToRepurpose = product.quantity;
                    const lossDiverted = Number((product.quantity * product.costPrice).toFixed(2));
                    const writeOffComment = `AI Deli Recipe Activated: converted product physically into '${recommendation.repurposeIdea.deliUpsellTitle}' to reclaim original value.`;
                    onRepurposed(product.id, quantityToRepurpose, "Deli Repurposed", writeOffComment, lossDiverted);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold font-sans shadow-sm transition-colors cursor-pointer bg-indigo-600"
                >
                  <CookingPot className="h-4 w-4" /> Transfer to Kitchen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyMarkdown(
                      product.id,
                      recommendation.suggestedDiscount,
                      recommendation.suggestedRetailPrice,
                      `AI Price Discount Applied: pricing adjusted by ${recommendation.suggestedDiscount}% markdown of ${formatPrice(recommendation.suggestedRetailPrice)} to avoid shelf dump.`
                    );
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold font-sans shadow-md transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Enforce {recommendation.suggestedDiscount}% Markdown
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
