import React from "react";
import { motion } from "motion/react";
import { Leaf, HandHeart, Trash2, ShieldCheck, DollarSign, Calendar } from "lucide-react";
import { WasteLog } from "../types";
import { formatPrice } from "../utils";

interface SustainabilityMetricsProps {
  logs: WasteLog[];
}

export default function SustainabilityMetrics({ logs }: SustainabilityMetricsProps) {
  // Aggregate stats
  const totalLogs = logs.length;
  const stats = logs.reduce(
    (acc, log) => {
      acc.totalQuantity += log.quantity;
      if (log.action === "Donated") {
        acc.donatedQuantity += log.quantity;
        acc.donatedVal += log.potentialLossSaved;
      } else if (log.action === "Deli Repurposed") {
        acc.repurposedQuantity += log.quantity;
        acc.repurposedVal += log.potentialLossSaved;
      } else if (log.action === "Composted") {
        acc.compostedQuantity += log.quantity;
        acc.compostedVal += log.potentialLossSaved;
      } else {
        acc.discardedQuantity += log.quantity;
        acc.discardedVal += log.lossAmount;
      }

      acc.totalLossAmount += log.lossAmount;
      acc.totalLossSaved += log.potentialLossSaved;

      // Carbon offset estimation: kg equivalent (assuming average 1 kg / item for estimation)
      // Produce: 2.5 kg CO2/item, Meat: 12.0 kg CO2/item, Dairy: 4.0 kg CO2/item, Bakery: 1.5 kg CO2/item, Pantry: 1.0 kg CO2/item, Deli: 2.0 kg CO2/item
      let multiplier = 1.2;
      if (log.category.includes("Produce")) multiplier = 2.5;
      else if (log.category.includes("Meat")) multiplier = 12.0;
      else if (log.category.includes("Dairy")) multiplier = 4.0;
      else if (log.category.includes("Bakery")) multiplier = 1.5;
      else if (log.category.includes("Deli")) multiplier = 2.0;

      if (log.action !== "Discarded") {
        acc.co2Prevented += log.quantity * multiplier;
      } else {
        acc.co2Wasted += log.quantity * multiplier;
      }

      return acc;
    },
    {
      totalQuantity: 0,
      donatedQuantity: 0,
      repurposedQuantity: 0,
      compostedQuantity: 0,
      discardedQuantity: 0,
      totalLossAmount: 0,
      totalLossSaved: 0,
      co2Prevented: 0,
      co2Wasted: 0,
      donatedVal: 0,
      repurposedVal: 0,
      compostedVal: 0,
      discardedVal: 0,
    }
  );

  const totalDiverted = stats.donatedQuantity + stats.repurposedQuantity + stats.compostedQuantity;
  const diversionRate = stats.totalQuantity > 0 ? (totalDiverted / stats.totalQuantity) * 100 : 100;
  
  // Estimation approximations:
  // 1 item donated = 1.2 meals
  const totalMealsFed = Math.round(stats.donatedQuantity * 1.5);
  // 1 kg CO2 avoided = 0.04 tree seedlings grown for 10 years
  const treesPlantedEquivalent = (stats.co2Prevented * 0.04).toFixed(1);
  // Wholesale cost recovery efficiency
  const reclaimRatio = stats.totalLossAmount > 0 ? (stats.totalLossSaved / stats.totalLossAmount) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800">
      {/* Landfill diversion KPI gauge */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-700">
            <Leaf className="h-5 w-5 text-emerald-600" />
            <h4 className="font-extrabold text-sm uppercase tracking-wide">Efisiensi Pengalihan Sampah</h4>
          </div>
          <p className="text-xs text-slate-500">Volume produk swalayan yang berhasil diselamatkan dari TPA sampah standar.</p>
        </div>

        <div className="my-6 flex items-center justify-center relative">
          {/* Semicircle circular gauge */}
          <div className="relative h-32 w-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                className="stroke-emerald-600 transition-all duration-1000"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={326.7}
                strokeDashoffset={326.7 - (326.7 * Math.min(diversionRate, 100)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">{diversionRate.toFixed(0)}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Teralihkan</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2 border-t border-slate-50 pt-3">
          <div className="bg-emerald-50 rounded-lg p-1.5 border border-emerald-100/50">
            <span className="text-[9px] font-bold text-emerald-700 block uppercase">Donasi</span>
            <span className="font-mono font-bold text-emerald-900">{stats.donatedQuantity} unit</span>
          </div>
          <div className="bg-indigo-50 rounded-lg p-1.5 border border-indigo-100/50">
            <span className="text-[9px] font-bold text-indigo-700 block uppercase">Dapur Deli</span>
            <span className="font-mono font-bold text-indigo-900">{stats.repurposedQuantity} unit</span>
          </div>
          <div className="bg-teal-50 rounded-lg p-1.5 border border-teal-100/50">
            <span className="text-[9px] font-bold text-teal-700 block uppercase">Kompos</span>
            <span className="font-mono font-bold text-teal-900">{stats.compostedQuantity} unit</span>
          </div>
        </div>
      </motion.div>

      {/* Sustainable Ecological Equivalents */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
            <h4 className="font-extrabold text-sm uppercase tracking-wide">Metrik Kompensasi Ekologis</h4>
          </div>
          <p className="text-xs text-slate-500">Estimasi gas rumah kaca yang diredam melalui aksi zero-waste.</p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Carbon avoided bar indicator */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
              <span>Mencegah Emisi Karbon:</span>
              <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                {stats.co2Prevented.toFixed(1)} kg CO₂e
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-emerald-650 h-2 rounded-full bg-emerald-600"
                style={{
                  width: `${
                    stats.co2Prevented > 0
                      ? (stats.co2Prevented / (stats.co2Prevented + stats.co2Wasted || 1)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Tree planting card */}
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 space-y-1">
              <Leaf className="h-4 w-4 text-emerald-500" />
              <div className="font-sans text-lg font-extrabold text-slate-800">{treesPlantedEquivalent}</div>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">Setara bibit pohon tumbuh subur selama 10 tahun</p>
            </div>

            {/* Meals feeding card */}
            <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/50 space-y-1">
              <HandHeart className="h-4 w-4 text-rose-500 animate-pulse" />
              <div className="font-sans text-lg font-extrabold text-slate-800">{totalMealsFed}</div>
              <p className="text-[10px] text-slate-500 font-medium leading-tight">Bantuan porsi makanan darurat yang disalurkan</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Financial Capital Salvage Curve */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-700">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h4 className="font-extrabold text-sm uppercase tracking-wide">Penyelamatan Finansial</h4>
          </div>
          <p className="text-xs text-slate-500">Nilai yang diselamatkan via diskon, donasi, dan dapur deli.</p>
        </div>

        <div className="space-y-3.5 my-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kerugian Nilai Dihapus</span>
              <span className="text-xl font-extrabold text-slate-800 block">{formatPrice(stats.totalLossAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-slate-100 pt-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nilai Aset Diselamatkan</span>
              <span className="text-xl font-extrabold text-emerald-700 block">{formatPrice(stats.totalLossSaved)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center text-slate-600 font-medium">
            <span>Efisiensi Penyelamatan Aset:</span>
            <span className="font-bold text-slate-800">{reclaimRatio.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-emerald-650 h-1.5 rounded-full bg-emerald-600" style={{ width: `${reclaimRatio}%` }} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
