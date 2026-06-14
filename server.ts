import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

const DATA_FILE = path.join(process.cwd(), "inventory_data.json");
const WASTE_LOG_FILE = path.join(process.cwd(), "waste_logs.json");

// Helper to format Date relative to now, returning YYYY-MM-DD
function getRelativeDateStr(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0];
}

// Initial seed data
const DEFAULT_INVENTORY = [
  {
    id: "prod-001",
    sku: "DY-TELUR-01",
    name: "Telur",
    category: "Dairy",
    quantity: 50,
    unit: "10-butir",
    unitPrice: 28000,
    costPrice: 21000,
    expirationDate: getRelativeDateStr(9),
    status: "Active",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Suhu terkendali diletakkan di rak chiller" }],
  },
  {
    id: "prod-002",
    sku: "MT-AYAM-02",
    name: "Ayam",
    category: "Meat & Seafood",
    quantity: 24,
    unit: "kg",
    unitPrice: 55000,
    costPrice: 41000,
    expirationDate: getRelativeDateStr(1),
    status: "Active",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Diterima dingin dari supplier lokal" }],
  },
  {
    id: "prod-003",
    sku: "MT-DSAPI-03",
    name: "Daging Sapi",
    category: "Meat & Seafood",
    quantity: 15,
    unit: "kg",
    unitPrice: 145000,
    costPrice: 108000,
    expirationDate: getRelativeDateStr(2),
    status: "Active",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Potongan porsi segar diletakkan di freezer utama" }],
  },
  {
    id: "prod-004",
    sku: "MT-DBABI-04",
    name: "Daging Babi",
    category: "Meat & Seafood",
    quantity: 12,
    unit: "kg",
    unitPrice: 110000,
    costPrice: 82000,
    expirationDate: getRelativeDateStr(2),
    status: "Active",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Segar dari pemotongan suhu dingin" }],
  },
  {
    id: "prod-005",
    sku: "MT-UDANG-05",
    name: "Udang",
    category: "Meat & Seafood",
    quantity: 18,
    unit: "kg",
    unitPrice: 120000,
    costPrice: 90000,
    expirationDate: getRelativeDateStr(-1),
    status: "Expired",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Udang laut segar dibekukan cepat" }],
  },
  {
    id: "prod-006",
    sku: "DL-BAKSO-06",
    name: "Bakso",
    category: "Deli",
    quantity: 35,
    unit: "bungkus_500g",
    unitPrice: 25000,
    costPrice: 18000,
    expirationDate: getRelativeDateStr(4),
    status: "Active",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Bakso instan dalam kemasan kedap udara" }],
  },
  {
    id: "prod-007",
    sku: "DY-SUHT-07",
    name: "Susu UHT",
    category: "Dairy",
    quantity: 40,
    unit: "botol_1L",
    unitPrice: 19000,
    costPrice: 14000,
    expirationDate: getRelativeDateStr(8),
    status: "Active",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Susu karton steril suhu ruangan" }],
  },
  {
    id: "prod-008",
    sku: "DY-KEJU-08",
    name: "Keju",
    category: "Dairy",
    quantity: 30,
    unit: "blok_165g",
    unitPrice: 22000,
    costPrice: 16000,
    expirationDate: getRelativeDateStr(45),
    status: "Active",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Keju blok olahan disimpan di chiller" }],
  },
  {
    id: "prod-009",
    sku: "DY-YOGUR-09",
    name: "Yogurt",
    category: "Dairy",
    quantity: 60,
    unit: "cup",
    unitPrice: 10500,
    costPrice: 7800,
    expirationDate: getRelativeDateStr(15),
    status: "Active",
    appliedDiscount: 0,
    history: [{ timestamp: new Date().toISOString(), action: "Stocked", comment: "Yoghurt probiotik segar siap saji" }],
  },
];

const DEFAULT_WASTE_LOGS = [
  {
    id: "log-001",
    productId: "prod-005",
    sku: "MT-UDANG-05",
    productName: "Udang",
    category: "Meat & Seafood",
    quantity: 3,
    unit: "kg",
    lossAmount: 270000,
    potentialLossSaved: 0,
    action: "Discarded",
    date: getRelativeDateStr(-1),
    comment: "Bahan pangan laut rusak karena kegagalan freezer penyimpanan chiller utama.",
  },
];

// Read File Database helpers
function readInventory(): any[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_INVENTORY, null, 2));
      return DEFAULT_INVENTORY;
    }
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    // Automatically flag past-due items to expired status if active
    let modified = false;
    const nowStr = new Date().toISOString().split("T")[0];
    const updated = parsed.map((item: any) => {
      if (item.expirationDate < nowStr && item.status !== "Expired" && item.status !== "Sold" && item.status !== "Repurposed" && item.status !== "Donated" && item.status !== "Discarded") {
        item.status = "Expired";
        item.history.push({
          timestamp: new Date().toISOString(),
          action: "Expired",
          comment: "System marked expired automatically based on date."
        });
        modified = true;
      }
      return item;
    });

    if (modified) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2));
    }
    return updated;
  } catch (error) {
    console.error("Error reading inventory file: ", error);
    return DEFAULT_INVENTORY;
  }
}

function writeInventory(data: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing inventory file: ", error);
  }
}

function readWasteLogs(): any[] {
  try {
    if (!fs.existsSync(WASTE_LOG_FILE)) {
      fs.writeFileSync(WASTE_LOG_FILE, JSON.stringify(DEFAULT_WASTE_LOGS, null, 2));
      return DEFAULT_WASTE_LOGS;
    }
    const data = fs.readFileSync(WASTE_LOG_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading waste logs: ", error);
    return DEFAULT_WASTE_LOGS;
  }
}

function writeWasteLogs(data: any[]) {
  try {
    fs.writeFileSync(WASTE_LOG_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing waste logs: ", error);
  }
}

// REST Endpoints
app.get("/api/inventory", (req, res) => {
  const items = readInventory();
  res.json(items);
});

app.post("/api/inventory", (req, res) => {
  const items = readInventory();
  const newItem = {
    id: `prod-${Date.now()}`,
    sku: req.body.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    name: req.body.name,
    category: req.body.category || "Produce",
    quantity: Number(req.body.quantity) || 1,
    unit: req.body.unit || "items",
    unitPrice: Number(req.body.unitPrice) || 0,
    costPrice: Number(req.body.costPrice) || 0,
    expirationDate: req.body.expirationDate,
    status: req.body.status || "Active",
    appliedDiscount: Number(req.body.appliedDiscount) || 0,
    history: [{
      timestamp: new Date().toISOString(),
      action: "Stocked",
      comment: req.body.comment || "Manual merchandise entry added."
    }],
  };

  const nowStr = new Date().toISOString().split("T")[0];
  if (newItem.expirationDate < nowStr && newItem.status === "Active") {
    newItem.status = "Expired";
  }

  items.unshift(newItem);
  writeInventory(items);
  res.status(201).json(newItem);
});

app.put("/api/inventory/:id", (req, res) => {
  const items = readInventory();
  const index = items.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Item not found" });
  }

  // Preserve history
  const existing = items[index];
  const history = existing.history || [];
  
  if (req.body.actionTaken) {
    history.push({
      timestamp: new Date().toISOString(),
      action: req.body.actionTaken,
      comment: req.body.actionComment || `State updated to ${req.body.status}`
    });
  }

  const updatedItem = {
    ...existing,
    sku: req.body.sku !== undefined ? req.body.sku : existing.sku,
    name: req.body.name !== undefined ? req.body.name : existing.name,
    category: req.body.category !== undefined ? req.body.category : existing.category,
    quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : existing.quantity,
    unit: req.body.unit !== undefined ? req.body.unit : existing.unit,
    unitPrice: req.body.unitPrice !== undefined ? Number(req.body.unitPrice) : existing.unitPrice,
    costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : existing.costPrice,
    expirationDate: req.body.expirationDate !== undefined ? req.body.expirationDate : existing.expirationDate,
    status: req.body.status !== undefined ? req.body.status : existing.status,
    appliedDiscount: req.body.appliedDiscount !== undefined ? Number(req.body.appliedDiscount) : existing.appliedDiscount,
    history: history
  };

  items[index] = updatedItem;
  writeInventory(items);
  res.json(updatedItem);
});

app.delete("/api/inventory/:id", (req, res) => {
  const items = readInventory();
  const filtered = items.filter((item) => item.id !== req.params.id);
  writeInventory(filtered);
  res.json({ success: true });
});

// Waste Logs
app.get("/api/waste-logs", (req, res) => {
  const logs = readWasteLogs();
  res.json(logs);
});

app.post("/api/waste-logs", (req, res) => {
  const logs = readWasteLogs();
  const items = readInventory();

  const { productId, quantity, action, comment, lossAmount, potentialLossSaved } = req.body;
  const itemIndex = items.findIndex((i) => i.id === productId);

  let productName = "Unknown Product";
  let category = "Produce";
  let unit = "items";
  let sku = "";

  if (itemIndex !== -1) {
    const item = items[itemIndex];
    productName = item.name;
    category = item.category;
    unit = item.unit;
    sku = item.sku;

    // Deduct quantity or update status if fully logged
    const quantityToRemove = Number(quantity);
    if (quantityToRemove >= item.quantity) {
      item.quantity = 0;
      item.status = action === "Deli Repurposed" ? "Repurposed" : (action === "Donated" ? "Donated" : (action === "Composted" ? "Composted" : "Discarded"));
      item.history.push({
        timestamp: new Date().toISOString(),
        action: action,
        comment: `Waste action taken: ${action}. ${comment}`
      });
    } else {
      item.quantity -= quantityToRemove;
      item.history.push({
        timestamp: new Date().toISOString(),
        action: `Partial ${action}`,
        comment: `Logged ${quantityToRemove} ${unit} for ${action}. Remaining: ${item.quantity}.`
      });
    }
    writeInventory(items);
  }

  const newLog = {
    id: `log-${Date.now()}`,
    productId: productId || "custom",
    sku: sku || "N/A",
    productName,
    category,
    quantity: Number(quantity) || 1,
    unit,
    lossAmount: Number(lossAmount) || 0,
    potentialLossSaved: Number(potentialLossSaved) || 0,
    action, // "Composted", "Donated", "Deli Repurposed", "Discarded"
    date: new Date().toISOString().split("T")[0],
    comment: comment || "",
  };

  logs.unshift(newLog);
  writeWasteLogs(logs);
  res.status(201).json(newLog);
});

app.post("/api/discount/suggest", async (req, res) => {
  const { name, category, quantity, unit, unitPrice, costPrice, expirationDate } = req.body;
  
  // Calculate days to expiration
  const expiry = new Date(expirationDate);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Heuristic Offline Fallback Generator
  const generateHeuristicFallback = () => {
    let suggestedDiscount = 20;
    if (diffDays <= 0) suggestedDiscount = 60;
    else if (diffDays === 1) suggestedDiscount = 50;
    else if (diffDays === 2) suggestedDiscount = 40;
    else if (diffDays <= 5) suggestedDiscount = 30;

    const suggestedRetailPrice = Math.round(unitPrice * (1 - suggestedDiscount / 100));
    
    const categoryRepurposing: Record<string, { title: string; description: string; deliUpsellTitle: string }> = {
      "Produce": {
        title: "Deli Smoothie & Soup Prep",
        description: `Potong dadu dan bekukan buah/sayuran ${name} ini untuk dijadikan bahan baku utama sup sayur organik atau juice / smoothie segar di area salad bar gerai.`,
        deliUpsellTitle: "Paket Smoothie ZeroWaste"
      },
      "Meat & Seafood": {
        title: "Hot Deli Marinade & Grill",
        description: `Bumbui segera daging ${name} ini dengan bumbu khas chef dan panggang sebagai produk matang siap saji (ready-to-eat rotisserie) di konter makanan hangat.`,
        deliUpsellTitle: "Daging Panggang Chef Siap Saji"
      },
      "Dairy": {
        title: "Bakery Cream / Cheese Bake",
        description: `Olah kembali susu/keju ${name} ini ke dalam adonan cheesecake lezat, saus keju gurih, atau isian pastry di area roti swalayan.`,
        deliUpsellTitle: "Pastri Gurih Keju Spesial"
      },
      "Bakery": {
        title: "Sweet Dessert Pudding repack",
        description: `Olah sisa roti/kue manis ${name} ini menjadi puding roti mentega karamel yang lezat atau panggang kembali menjadi roti kering bagelen renyah.`,
        deliUpsellTitle: "Puding Roti Karamel Rumahan"
      },
      "Deli": {
        title: "Hot Food Combo Ricebox",
        description: `Sajikan deli ${name} ini sebagai paket lauk pauk kombo nasi kotak ekonomis dengan harga ramah kantong di sela makan siang pelanggan.`,
        deliUpsellTitle: "Nasi Kotak Kombo Hemat"
      }
    };

    const defaultRepurpose = {
      title: "Promotional Flash Sale Placement",
      description: `Pindahkan produk sisa ${name} langsung ke rak khusus diskon kilat dekat kasir utama dengan tag label mencolok untuk menarik perhatian pembeli sebelum masa pajang habis.`,
      deliUpsellTitle: "Paket Kilat Super Hemat"
    };

    return {
      suggestedDiscount,
      suggestedRetailPrice,
      reasoning: `Rekomendasi heuristik lokal aktif: Diskon ${suggestedDiscount}% disarankan berdasarkan sisa masa kedaluwarsa (${diffDays} hari) untuk mengosongkan inventaris sebelum masa buang.`,
      wasteImpactDescription: `Menghindari penimbunan sampah organik dari ${quantity} ${unit} produk ${name} yang berpotensi mengurangi limbah padat dan emisi karbon setara ${(quantity * 1.5).toFixed(1)} kg CO2.`,
      repurposeIdea: categoryRepurposing[category] || defaultRepurpose
    };
  };

  if (!ai) {
    // If Gemini is not set up, respond gracefully with 200 OK using heuristic model
    const fallbackObj = generateHeuristicFallback();
    return res.json(fallbackObj);
  }

  try {
    const prompt = `You are a professional retail supermarket pricing optimization system analyzing surplus stock.
Analyze this item and suggest an optimized, dynamic markdown discount rate (0% to 90%) to clear the stock before expiration and minimize financial/food waste loss.

Item Profile:
- Product Name: ${name}
- Category: ${category}
- Inventory On Hand: ${quantity} ${unit}
- Original Price: Rp ${unitPrice}
- Wholesale Cost: Rp ${costPrice}
- Expiration Date: ${expirationDate} (${diffDays <= 0 ? "EXPIRES TODAY or already expired" : `expires in ${diffDays} days`})

Generate the optimum discount pricing decision considering:
1. Category-specific perishability (fresh produce/bakery/meat require urgent discounts, pantry can have milder discounts).
2. Cost margin buffer (retail price vs cost price). Keep some margins if possible, but prioritize clearing stock over discarding if time is critical.
3. Quantity urgency (larger stocks require deeper discounts to shift completely).
4. Creative Repurposing options in the deli/bakery kitchen to salvage the raw ingredients.

Note: The product prices are in Indonesian Rupiah (IDR). Please suggest the suggestedRetailPrice as a rounded integer in Rupiah matching unitPrice multiplied by (1 - discount/100).
Provide your decision strictly conforming to the JSON schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional supermarket merchandiser, visual pricing analyst, and zero-waste champion.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedDiscount: {
              type: Type.INTEGER,
              description: "A recommended discount percentage between 10 and 90. Higher values for shorter days left and high volume."
            },
            suggestedRetailPrice: {
              type: Type.NUMBER,
              description: "Optimized new selling retail price matching unitPrice multiplied by (1 - discount/100). Must be a rounded whole integer."
            },
            reasoning: {
              type: Type.STRING,
              description: "High-quality merchandising rationale for the discount based on perishability, store margin, and stock size. Write in bilingual Indonesian or English."
            },
            wasteImpactDescription: {
              type: Type.STRING,
              description: "Ecological and inventory saving statement regarding landfill emission mitigation or waste saved. Write in bilingual Indonesian or English."
            },
            repurposeIdea: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Repurposing category (e.g., Deli Smoothie Prep, Stew Starter, Bakery Repack)" },
                description: { type: Type.STRING, description: "Detailed kitchen instructions for reusing this food in the supermarket's own food/deli section." },
                deliUpsellTitle: { type: Type.STRING, description: "Deli or Bakery finished product name." }
              },
              required: ["title", "description", "deliUpsellTitle"]
            }
          },
          required: ["suggestedDiscount", "suggestedRetailPrice", "reasoning", "wasteImpactDescription", "repurposeIdea"]
        }
      }
    });

    const bodyText = response.text?.trim() || "";
    const resultObj = JSON.parse(bodyText);
    res.json(resultObj);
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const isResourceExhausted = errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("prepayment credits") || errorMsg.includes("429");
    
    if (isResourceExhausted) {
      console.warn("Gemini API credits are depleted / restricted (429 RESOURCE_EXHAUSTED). Gracefully running local heuristic pricing engine fallback.");
    } else {
      console.warn("Gemini suggestion error caught & fallbacked: ", errorMsg);
    }
    
    const fallbackObj = generateHeuristicFallback() as any;
    fallbackObj.isFallback = true;
    fallbackObj.fallbackReason = isResourceExhausted ? "prepay_depleted" : "general_error";
    res.json(fallbackObj);
  }
});

// Setup Vite Dev server or Serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
