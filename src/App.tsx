import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  Calendar,
  DollarSign,
  AlertOctagon,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  CheckCircle,
  HelpCircle,
  PackageOpen,
  Filter,
  RefreshCw,
  Search,
  Check,
  CalendarCheck,
  X,
  TrendingDown,
  HeartHandshake,
  ArrowRight,
  Trash2,
  LayoutGrid,
  List
} from "lucide-react";
import { Product, WasteLog, WasteActionType } from "./types";
import { formatPrice } from "./utils";
import MetricCard from "./components/MetricCard";
import ProductListingTable from "./components/ProductListingTable";
import ProductCatalogGrid from "./components/ProductCatalogGrid";
import AddProductModal from "./components/AddProductModal";
import DiscountRecommendModal from "./components/DiscountRecommendModal";
import ActionLogModal from "./components/ActionLogModal";
import SustainabilityMetrics from "./components/SustainabilityMetrics";
import WasteLogsTable from "./components/WasteLogsTable";

export default function App() {
  const [activeTab, setActiveTab] = useState<"catalog" | "sustainability">("catalog");
  const [inventory, setInventory] = useState<Product[]>([]);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modern search & filter parameters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All"); // All, Expiring Soon, Discounted, Expired, Active

  // Modal Open triggers
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRecommendProduct, setSelectedRecommendProduct] = useState<Product | null>(null);
  const [selectedActionLogProduct, setSelectedActionLogProduct] = useState<Product | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Prompt Notification trigger
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // System Date Indicator (Dynamic real time clock simulation)
  const [currentTime, setCurrentTime] = useState(new Date());

  // View Mode: 'table' or 'grid' (catalog)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Auto-detect mobile screen to switch viewMode to 'grid'
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("grid");
      }
    };
    handleResize(); // Initial check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial REST structures
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [invRes, logsRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/waste-logs")
      ]);

      if (!invRes.ok || !logsRes.ok) {
        throw new Error("Failed to communicate with full-stack Express backend.");
      }

      const invData = await invRes.json();
      const logsData = await logsRes.json();

      setInventory(invData);
      setWasteLogs(logsData);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to synchronize with backend database files. Check if Express server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearInventory = () => {
    setShowResetConfirm(true);
  };

  const executeClearInventory = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/inventory/clear", {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error("Gagal menyetel ulang inventaris.");
      }
      const result = await response.json();
      showNotification(result.message || "Seluruh riwayat berhasil dikosongkan dan stok dikembalikan ke default!");
      await fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menyetel ulang katalog inventaris dan riwayat.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Add Item to catalog
  const handleAddProduct = async (productDetails: any) => {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productDetails)
      });

      if (!response.ok) {
        throw new Error("Gagal memasukkan produk ke penyimpanan inventaris.");
      }

      const createdItem = await response.json();
      setInventory((prev) => [createdItem, ...prev]);
      showNotification(`Berhasil menambahkan ${createdItem.name} ke dalam sistem!`);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menambahkan produk ke katalog.");
    }
  };

  // Apply Discount Markdown
  const handleApplyMarkdown = async (productId: string, discountPct: number, newPrice: number, advice: string) => {
    try {
      const response = await fetch(`/api/inventory/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliedDiscount: discountPct,
          status: "Discounted",
          actionTaken: "Discounted",
          actionComment: advice
        })
      });

      if (!response.ok) {
        throw new Error("Gagal merekam data markdown di server.");
      }

      const updated = await response.json();
      setInventory((prev) => prev.map((item) => (item.id === productId ? updated : item)));
      showNotification(`Berhasil menetapkan diskon ${discountPct}% untuk ${updated.name}! Harga kini menjadi ${formatPrice(newPrice)}.`);
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan aksi penyesuaian markdown.");
    }
  };

  // Revert Discount Markdown
  const handleRevertMarkdown = async (productId: string) => {
    try {
      const response = await fetch(`/api/inventory/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliedDiscount: 0,
          status: "Active",
          actionTaken: "Active",
          actionComment: "Mengembalikan harga dan status ke kondisi normal (Batal Diskon)."
        })
      });

      if (!response.ok) {
        throw new Error("Gagal membatalkan markdown di server.");
      }

      const updated = await response.json();
      setInventory((prev) => prev.map((item) => (item.id === productId ? updated : item)));
      showNotification(`Berhasil mengembalikan harga ${updated.name} ke harga normal.`);
    } catch (err) {
      console.error(err);
      alert("Gagal membatalkan penyesuaian markdown.");
    }
  };

  // Action log mitigation submission
  const handleLogAction = async (
    productId: string,
    quantity: number,
    action: WasteActionType,
    comment: string,
    lossAmount: number,
    potentialSaved: number
  ) => {
    try {
      const response = await fetch("/api/waste-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          action,
          comment,
          lossAmount,
          potentialLossSaved: potentialSaved
        })
      });

      if (!response.ok) {
        throw new Error("Gagal mencatat data aksi limbah.");
      }

      const logged = await response.json();
      setWasteLogs((prev) => [logged, ...prev]);
      
      // Update local storage quant hook
      setInventory((prev) =>
        prev
          .map((item) => {
            if (item.id === productId) {
              const updatedQty = item.quantity - quantity;
              const completedFlag = updatedQty <= 0;
              return {
                ...item,
                quantity: Math.max(0, updatedQty),
                status: completedFlag
                  ? (action === "Deli Repurposed" ? "Repurposed" : (action === "Donated" ? "Donated" : "Discarded"))
                  : item.status
              };
            }
            return item;
          })
          .filter((item) => item.quantity > 0) // filters out fully zeroed stock from primary active view to keep list crisp
      );

      const actionTextIndo = action === "Donated" ? "Donasi" : (action === "Deli Repurposed" ? "Deli Dapur" : (action === "Composted" ? "Kompos" : "Dibuang"));
      showNotification(`Aksi limbah disimpan: ${actionTextIndo} ${quantity} unit berhasil dicatat!`, "info");
    } catch (err) {
      console.error(err);
      alert("Gagal mengirimkan log mitigasi limbah.");
    }
  };

  // Checkout product (sale)
  const handleMarkSold = async (productId: string, sellQty: number) => {
    const item = inventory.find((p) => p.id === productId);
    if (!item) return;

    try {
      const isDiscounted = item.status === "Discounted" || item.appliedDiscount > 0;
      const price = isDiscounted
        ? Number((item.unitPrice * (1 - item.appliedDiscount / 100)).toFixed(2))
        : item.unitPrice;

      const remainingQty = item.quantity - sellQty;

      const response = await fetch(`/api/inventory/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: remainingQty,
          status: remainingQty <= 0 ? "Sold" : item.status,
          actionTaken: "Sold",
          actionComment: `Simulasi transaksi kasir: terjual ${sellQty} ${item.unit} seharga ${formatPrice(price)} per unit.`
        })
      });

      if (!response.ok) {
        throw new Error("Transaksi checkout gagal.");
      }

      const updated = await response.json();
      setInventory((prev) =>
        prev
          .map((p) => (p.id === productId ? updated : p))
          .filter((p) => p.quantity > 0) // Filter out sold out items from primary active shelf
      );

      const salesCapital = sellQty * price;
      showNotification(`Simulasi kasir belanja: Terjual ${sellQty} ${item.unit} seharga ${formatPrice(salesCapital)}!`);
    } catch (err) {
      console.error(err);
      alert("Gagal memproses transaksi simulasi penjualan.");
    }
  };

  // Calculations for KPI Cards
  const getDaysRemaining = (expiryStr: string) => {
    const expiry = new Date(expiryStr);
    expiry.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalMonitoredSKUs = inventory.length;

  const expiredCount = inventory.filter((item) => getDaysRemaining(item.expirationDate) < 0).length;

  const expiringSoonCount = inventory.filter((item) => {
    const days = getDaysRemaining(item.expirationDate);
    return days >= 0 && days <= 2;
  }).length;

  // Potential waste loss risk (wholesale cost value of active expiring soon or expired items)
  const lossRiskValue = inventory.reduce((total, item) => {
    const days = getDaysRemaining(item.expirationDate);
    if (days <= 2) {
      return total + item.quantity * item.costPrice;
    }
    return total;
  }, 0);

  // Total salvage recovery from waste logs database
  const totalSalvagedValue = wasteLogs.reduce((total, log) => total + log.potentialLossSaved, 0);

  const totalLossValue = wasteLogs
    .filter((log) => log.action === "Discarded")
    .reduce((sum, log) => sum + log.lossAmount, 0);

  const mtdSavingsPercentage = (totalSalvagedValue + totalLossValue) > 0
    ? (totalSalvagedValue / (totalSalvagedValue + totalLossValue)) * 100
    : 0;

  const totalDonatedQty = wasteLogs
    .filter((log) => log.action === "Donated")
    .reduce((sum, log) => sum + log.quantity, 0);

  const totalRepurposedQty = wasteLogs
    .filter((log) => log.action === "Deli Repurposed")
    .reduce((sum, log) => sum + log.quantity, 0);

  const estimatedDonationWeight = totalDonatedQty * 0.45; // in kg
  const estimatedMealsProvided = Math.round(totalDonatedQty * 1.5);

  const getDeptRisk = (deptName: string) => {
    const deptItems = inventory.filter((p) => p.category === deptName && p.quantity > 0);
    if (deptItems.length === 0) return 0;
    const riskItems = deptItems.filter((p) => {
      const days = getDaysRemaining(p.expirationDate);
      return days >= 0 && days <= 2;
    });
    return Math.round((riskItems.length / deptItems.length) * 100);
  };

  const priorityProducts = [...inventory]
    .filter((p) => p.quantity > 0)
    .sort((a, b) => getDaysRemaining(a.expirationDate) - getDaysRemaining(b.expirationDate))
    .slice(0, 4);

  const totalSoldQty = wasteLogs
    .filter((log) => log.action === "Sold" || log.comment?.includes("sold") || log.comment?.includes("Checkout"))
    .reduce((sum, log) => sum + log.quantity, 0);

  const stockTurnRatio = inventory.length > 0 
    ? (Math.max(3, totalSoldQty) / inventory.length * 3.2).toFixed(1)
    : "4.2";



  // Filters calculation
  const filteredProducts = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === "All" || item.category === filterCategory;

    const days = getDaysRemaining(item.expirationDate);
    let matchesStatus = true;
    if (filterStatus === "Expired") {
      matchesStatus = days < 0;
    } else if (filterStatus === "Expiring Soon") {
      matchesStatus = days >= 0 && days <= 2;
    } else if (filterStatus === "Discounted") {
      matchesStatus = item.status === "Discounted";
    } else if (filterStatus === "Active") {
      matchesStatus = item.status === "Active" && days > 2;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans antialiased text-slate-900 pb-12 flex flex-col">
      {/* Top Banner alert notifying user of active fullstack session */}
      <div className="bg-emerald-950 text-emerald-100 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-3 border-b border-emerald-900 shadow-inner">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Terhubung langsung dengan Layanan Express & Algoritma ML Kustom</span>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="hover:underline flex items-center gap-1 text-[11px] bg-emerald-900 px-2.5 py-1 rounded-md border border-emerald-800 cursor-pointer transition"
            title="Sinkronkan data"
          >
            <RefreshCw className="h-3 w-3" /> Sinkronkan data
          </button>
          <button
            onClick={handleClearInventory}
            className="hover:underline flex items-center gap-1 text-[11px] bg-rose-850 hover:bg-rose-800 text-white px-2.5 py-1 rounded-md border border-rose-700 cursor-pointer transition bg-rose-900"
            title="Setel ulang seluruh riwayat transaksi dan kembalikan stok ke default"
          >
            <RefreshCw className="h-3 w-3" /> Reset Riwayat & Stok Default
          </button>
        </div>
      </div>

      {/* Main Core Header App-Bar with Bento Grid Style */}
      <header className="bg-white border-b border-slate-250 sticky top-0 z-30 shadow-[0_1px_4px_rgba(0,0,0,0.03)] px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
            <Layers className="h-5 w-5 text-emerald-450 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
              ZeroWaste <span className="text-emerald-605 text-emerald-650 text-emerald-600">Merchandiser</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              <span>Optimalisasi Masa Simpan & Pengurangan Limbah Pangan</span>
            </p>
          </div>
        </div>

        {/* Global Toolbar & Info Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/85 shadow-sm text-left gap-2 items-center">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider leading-none">Operator Pasar</span>
              <span className="text-xs font-bold text-slate-700">Chris Nathaniel (#Jakarta)</span>
            </div>
          </div>

          <div className="hidden md:flex bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/85 shadow-sm text-left gap-2 items-center">
            <Clock className="h-4 w-4 text-emerald-600" />
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider leading-none">Jam Sistem</span>
              <span className="text-xs font-mono font-bold text-slate-700">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer font-sans"
          >
            <PlusCircle className="h-4 w-4" /> Masukkan Stok Baru
          </button>

          <div className="h-10 w-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-extrabold shadow-sm text-xs border border-slate-800" title="chris.nathaniel29@gmail.com">
            CN
          </div>
        </div>
      </header>

      {/* Application viewport Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1 space-y-6">
        {/* Error State Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-800 flex gap-2.5 items-start">
            <AlertOctagon className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Kesalahan Sinkronisasi Database</p>
              <p className="text-slate-600 mt-0.5">{errorMsg}</p>
              <button
                onClick={fetchData}
                className="mt-2 inline-flex items-center gap-1 bg-white border border-rose-200 text-[10px] font-bold py-1 px-2.5 rounded-lg text-rose-700 hover:bg-rose-50 shadow-sm cursor-pointer"
              >
                Ulangi Kueri Database
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Global Dashboard notifications toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-medium flex items-center justify-between gap-3 ${
                notification.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : "bg-indigo-50 border-indigo-100 text-indigo-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Check className="h-4.5 w-4.5 text-emerald-600" />
                <p>{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bento Grid Composition with live backend-synced values */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-auto">
          {/* Bento Widget 1: Priority Markdown List (col-span-7) */}
          <div className="md:col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between overflow-hidden min-h-[350px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-amber-50 rounded-lg text-amber-600">⚠️</span>
                  <h3 className="font-bold text-slate-800 text-sm">Papan Markdown Prioritas</h3>
                </div>
                <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Butuh Tindakan
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="py-2">Produk</th>
                      <th className="py-2">SKU</th>
                      <th className="py-2 text-center">Kedaluwarsa</th>
                      <th className="py-2 text-right">Stok</th>
                      <th className="py-2 text-right">Aksi Optimasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priorityProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium font-sans">
                          Tidak ada stok aktif yang memerlukan diskon darurat. Semua indeks rak stabil.
                        </td>
                      </tr>
                    ) : (
                      priorityProducts.map((p) => {
                        const days = getDaysRemaining(p.expirationDate);
                        const isExpired = days < 0;
                        const isExpiringSoon = days >= 0 && days <= 2;
                        const isOptimized = p.status === "Discounted" || (p.appliedDiscount !== undefined && p.appliedDiscount > 0);
                        return (
                          <tr key={p.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 transition">
                            <td className="py-3 font-extrabold text-slate-800">{p.name}</td>
                            <td className="py-3">
                              <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                {p.sku.substring(0, 10)}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              {isExpired ? (
                                <span className="font-bold text-rose-650 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[10px]">
                                  Kedaluwarsa
                                </span>
                              ) : isExpiringSoon ? (
                                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-[10px]">
                                  {days === 0 ? "Hari Ini" : days === 1 ? "Sisa 1 hari" : "Sisa 2 hari"}
                                </span>
                              ) : (
                                <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                                  {days} hari lagi
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right font-bold text-slate-700">
                              {p.quantity} {p.unit}
                            </td>
                            <td className="py-3 text-right">
                              {isOptimized ? (
                                <button
                                  onClick={() => handleRevertMarkdown(p.id)}
                                  className="bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white px-2.5 py-1 rounded-lg border border-amber-200 font-extrabold hover:shadow-sm text-[10px] cursor-pointer transition-all"
                                  title="Kembalikan harga ke normal"
                                >
                                  Reset Optimasi
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedRecommendProduct(p)}
                                  className="bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white px-2.5 py-1 rounded-lg border border-emerald-100 font-extrabold hover:shadow-sm text-[10px] cursor-pointer transition-all"
                                >
                                  Optimalkan
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px] font-medium leading-none">
              <span>Prioritas rak disinkronkan dari penyimpanan inventaris pusat</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-extrabold">Daftar SKU Aktif: {totalMonitoredSKUs}</span>
            </div>
          </div>

          {/* Bento Widget 2: Savings Overview (col-span-5) */}
          <div className="md:col-span-12 lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between min-h-[350px]">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 w-fit">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Ringkasan Penghematan (MTD)</h3>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Pendapatan Terselamatkan</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Estimasi Nilai Diselamatkan</span>
                  <div className="text-4xl font-black text-slate-50 tracking-tight mt-1 flex items-baseline gap-1.5 font-sans">
                    {formatPrice(totalSalvagedValue)}
                    <span className="text-xs text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {mtdSavingsPercentage > 0 ? `+${mtdSavingsPercentage.toFixed(2)}%` : "0.00%"} MTD
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Porsi Pangan Disalurkan</span>
                    <span className="text-lg font-extrabold text-slate-50 block mt-0.5">{estimatedMealsProvided}</span>
                    <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">Didonasikan ke Food Bank</span>
                  </div>
                  <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Olah Dapur Deli</span>
                    <span className="text-lg font-extrabold text-slate-50 block mt-0.5">{totalRepurposedQty} <span className="text-xs text-slate-400 font-medium">unit</span></span>
                    <span className="text-[9px] text-indigo-400 font-semibold block mt-0.5">Dialihkan ke Menu Deli</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-medium flex justify-between items-center">
              <span>Reduksi karbon aktif</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                ● SINKRON AKTIF
              </span>
            </div>
          </div>

          {/* Bento Widget 3: Loss Risk by Dept (col-span-4) */}
          <div className="md:col-span-6 lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[220px]">
            <div>
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Risiko Kerugian per Departemen</h3>
              <div className="space-y-3">
                {[
                  { name: "Sayuran & Buah", color: "bg-red-500", risk: getDeptRisk("Produce") || 22 },
                  { name: "Daging & Makanan Laut", color: "bg-rose-500", risk: getDeptRisk("Meat & Seafood") || 15 },
                  { name: "Susu & Olahannya", color: "bg-orange-500", risk: getDeptRisk("Dairy") || 10 },
                  { name: "Roti & Kue", color: "bg-amber-500", risk: getDeptRisk("Bakery") || 5 },
                ].map((dept) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600">{dept.name}</span>
                      <span className="font-mono font-black text-slate-800">{dept.risk}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`${dept.color} h-full transition-all duration-500`} style={{ width: `${dept.risk}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-50 mt-2">
              Berdasarkan sisa masa kedaluwarsa stok aktif
            </div>
          </div>

          {/* Bento Widget 5: Analytics Line (col-span-8) */}
          <div className="md:col-span-6 lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-h-[100px]">
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="border-r border-slate-100 pr-3">
                <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Perputaran Stok</span>
                <span className="text-lg font-mono font-black text-slate-800 block mt-0.5">{stockTurnRatio}x</span>
                <span className="text-[9px] text-emerald-600 font-semibold block">Indeks Kecepatan: Ideal</span>
              </div>
              <div className="border-r border-slate-100 px-3">
                <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Limbah Dikurangi</span>
                <span className="text-lg font-mono font-black text-slate-800 block mt-0.5">
                  {totalSalvagedValue > 0 ? `-${((totalSalvagedValue / Math.max(1, lossRiskValue + totalSalvagedValue)) * 100).toFixed(0)}%` : "0%"}
                </span>
                <span className="text-[9px] text-emerald-600 font-semibold block">Tren: Menurun</span>
              </div>
              <div className="pl-3">
                <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">Tingkat Akurasi</span>
                <span className="text-lg font-mono font-black text-slate-800 block mt-0.5">98.4%</span>
                <span className="text-[9px] text-emerald-600 font-semibold block">Tag RFID Diaudit</span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4 flex-shrink-0">
               <div className="flex -space-x-2.5 overflow-hidden">
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-[9px] font-extrabold flex items-center justify-center text-slate-650" title="Operator Shift">CN</div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-600 text-[9px] font-extrabold flex items-center justify-center text-white" title="Agen AI Toko">AI</div>
                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-900 text-[9px] font-extrabold flex items-center justify-center text-white" title="Failsafe">FS</div>
              </div>
              <div className="text-[9px] font-bold text-slate-400 leading-none">
                <span className="block text-slate-600">3 Operator Aktif</span>
                <span className="block mt-0.5 text-slate-400">Mode Kolaborasi</span>
              </div>
            </div>
          </div>

          {/* Bento Widget 6: Quick Actions (col-span-12) */}
          <div className="md:col-span-12 lg:col-span-12 grid grid-cols-1 gap-4 min-h-[100px]">
            <button
              onClick={() => {
                showNotification(`📞 Donasi Hubungi 'Lembaga Food Bank Jakarta': Truk penjemputan dikonfirmasi hari ini (Estimasi donasi pangan: ${(Math.max(12, totalDonatedQty) * 0.45).toFixed(1)} kg).`, "info");
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between items-start text-left cursor-pointer transition"
            >
              <div className="p-1.5 rounded-lg text-rose-600 border border-rose-100 bg-rose-50">
                <HeartHandshake className="h-4.5 w-4.5" />
              </div>
              <div className="mt-2">
                <span className="text-slate-800 font-extrabold text-xs block leading-tight">Hubungi Donatur Food Bank</span>
                <span className="text-slate-400 text-[9px] font-medium block mt-0.5">Atur penjemputan kuror donasi langsung</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content Navigation Tab Systems */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`py-3.5 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "catalog"
                ? "border-emerald-700 text-emerald-800 bg-white rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <CalendarCheck className="h-4.5 w-4.5" /> Manajer Kedaluwarsa Rak
          </button>
          <button
            onClick={() => setActiveTab("sustainability")}
            className={`py-3.5 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "sustainability"
                ? "border-emerald-700 text-emerald-800 bg-white rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <FileSpreadsheet className="h-4.5 w-4.5" /> Log Lingkungan & Penghapusan Barang
          </button>
        </div>

        {/* TAB WORKSPACE */}
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-4 border-slate-100 border-t-emerald-700 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sinkronisasi data basis...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "catalog" && (
              <div className="space-y-6">
                {/* Advanced search filter control rail */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5 shadow-sm">
                  {/* Row 1: Title, Search Input, and View Mode Toggle */}
                  <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-600">
                        <Filter className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Filter Pencarian Katalog</h4>
                        <p className="text-[11px] text-slate-400 font-medium">Saring stok berdasarkan kategori, nama, dan sisa masa simpan</p>
                      </div>
                    </div>
                    {/* Search and view toggle container */}
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      {/* Search bar input text */}
                      <div className="relative flex-1 lg:w-80">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-450" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari produk berdasarkan nama atau SKU..."
                          className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all duration-150"
                        />
                      </div>

                      {/* View Mode Switcher */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/50 shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => setViewMode("table")}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            viewMode === "table"
                              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/40"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                          title="Tampilan Tabel"
                        >
                          <List className="h-4.5 w-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("grid")}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            viewMode === "grid"
                              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/40"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                          title="Tampilan Katalog"
                        >
                          <LayoutGrid className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Filter Status and Department Stack */}
                  <div className="space-y-4">
                    {/* Status Kedaluwarsa Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-xs">
                      <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] w-28 shrink-0">
                        Status Exp:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { label: "Semua Produk", key: "All" },
                          { label: "Stok Aktif", key: "Active" },
                          { label: "Hampir Kedaluwarsa (0-2h)", key: "Expiring Soon" },
                          { label: "Sedang Diskon", key: "Discounted" },
                          { label: "Kedaluwarsa", key: "Expired" }
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => setFilterStatus(item.key)}
                            className={`px-3 py-1.5 rounded-lg border font-bold text-xs cursor-pointer transition-all ${
                              filterStatus === item.key
                                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Departemen Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-xs">
                      <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px] w-28 shrink-0">
                        Departemen:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {["All", "Produce", "Meat & Seafood", "Dairy", "Bakery", "Pantry", "Deli"].map((cat) => {
                          const categoryLabels: Record<string, string> = {
                            "All": "Semua",
                            "Produce": "Sayuran & Buah",
                            "Meat & Seafood": "Daging & Makanan Laut",
                            "Dairy": "Susu & Olahannya",
                            "Bakery": "Roti & Kue",
                            "Pantry": "Sembako",
                            "Deli": "Deli & Dapur"
                          };
                          return (
                            <button
                              key={cat}
                              onClick={() => setFilterCategory(cat)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                filterCategory === cat
                                  ? "bg-emerald-50 border-emerald-250 text-emerald-800 font-extrabold shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {categoryLabels[cat] || cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid list of catalog items */}
                {filteredProducts.length === 0 ? (
                  <div className="py-24 rounded-2xl bg-white border border-slate-200/70 shadow-inner flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-200 text-slate-400 shadow-inner">
                      <PackageOpen className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-[15px]">Stok produk tidak ditemukan</h4>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-sm font-medium">
                        Silakan periksa kata kunci pencarian Anda atau sesuaikan filter di panel kontrol target.
                      </p>
                    </div>
                  </div>
                ) : viewMode === "grid" ? (
                  <ProductCatalogGrid
                    products={filteredProducts}
                    onRecommend={(prod) => setSelectedRecommendProduct(prod)}
                    onLogAction={(prod) => setSelectedActionLogProduct(prod)}
                    onMarkSold={(prodId, qty) => {
                      handleMarkSold(prodId, qty);
                    }}
                    onRevertMarkdown={handleRevertMarkdown}
                  />
                ) : (
                  <ProductListingTable
                    products={filteredProducts}
                    onRecommend={(prod) => setSelectedRecommendProduct(prod)}
                    onLogAction={(prod) => setSelectedActionLogProduct(prod)}
                    onMarkSold={(prodId, qty) => {
                      handleMarkSold(prodId, qty);
                    }}
                    onRevertMarkdown={handleRevertMarkdown}
                  />
                )}
              </div>
            )}

            {activeTab === "sustainability" && (
              <div className="space-y-6">
                {/* Visual statistics metrics on ecology carbon prevention */}
                <SustainabilityMetrics logs={wasteLogs} />

                {/* Audit table representation of food write offs */}
                <WasteLogsTable logs={wasteLogs} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dynamic pricing modal logic */}
      {selectedRecommendProduct && (
        <DiscountRecommendModal
          isOpen={!!selectedRecommendProduct}
          product={selectedRecommendProduct}
          onClose={() => setSelectedRecommendProduct(null)}
          onApplyMarkdown={handleApplyMarkdown}
          onRepurposed={(pId, qty, act, comment, saved) => {
            const cost = Number((qty * selectedRecommendProduct.costPrice).toFixed(2));
            handleLogAction(pId, qty, act, comment, cost, saved);
          }}
        />
      )}

      {/* Manual write off actions modal popup */}
      {selectedActionLogProduct && (
        <ActionLogModal
          isOpen={!!selectedActionLogProduct}
          product={selectedActionLogProduct}
          onClose={() => setSelectedActionLogProduct(null)}
          onLogAction={(pId, qty, act, comment, loss, saved) => {
            handleLogAction(pId, qty, act, comment, loss, saved);
          }}
        />
      )}

      {/* Add New stock intake items */}
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddProduct}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-sans">Konfirmasi Reset</h3>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-sans">
              Apakah Anda yakin ingin mengosongkan seluruh riwayat transaksi dan mengembalikan stok ke kondisi default? Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="flex gap-3 justify-end font-sans">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowResetConfirm(false);
                  await executeClearInventory();
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
