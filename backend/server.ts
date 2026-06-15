import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
// import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
// const ai = process.env.GEMINI_API_KEY
//   ? new GoogleGenAI({
//       apiKey: process.env.GEMINI_API_KEY,
//       httpOptions: {
//         headers: {
//           "User-Agent": "aistudio-build",
//         },
//       },
//     })
//   : null;

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
  },
  {
    id: "prod-002",
    sku: "DY-SUSU-01",
    name: "Susu Ultra",
    category: "Dairy",
    quantity: 75,
    unit: "1L",
    unitPrice: 15000,
    costPrice: 12000,
    expirationDate: getRelativeDateStr(30),
    status: "Active",
    appliedDiscount: 0,
  },
  {
    id: "prod-003",
    sku: "VG-BAYAM-01",
    name: "Bayam",
    category: "Vegetables",
    quantity: 30,
    unit: "ikat",
    unitPrice: 3500,
    costPrice: 2000,
    expirationDate: getRelativeDateStr(2),
    status: "Active",
    appliedDiscount: 0,
  },
  {
    id: "prod-004",
    sku: "OL-MINYAK-01",
    name: "Minyak Goreng",
    category: "Oils",
    quantity: 100,
    unit: "pouch_1L",
    unitPrice: 18000,
    costPrice: 15000,
    expirationDate: getRelativeDateStr(180),
    status: "Active",
    appliedDiscount: 0,
  },
];

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
  expirationDate: string;
  status: string;
  appliedDiscount: number;
}

interface WasteLog {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  timestamp: string;
  value: number;
}

// Helper functions to read/write files
function loadInventory(): InventoryItem[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error loading inventory:", e);
  }
  return DEFAULT_INVENTORY;
}

function saveInventory(data: InventoryItem[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saving inventory:", e);
  }
}

function loadWasteLogs(): WasteLog[] {
  try {
    if (fs.existsSync(WASTE_LOG_FILE)) {
      const data = fs.readFileSync(WASTE_LOG_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error loading waste logs:", e);
  }
  return [];
}

function saveWasteLogs(data: WasteLog[]): void {
  try {
    fs.writeFileSync(WASTE_LOG_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saving waste logs:", e);
  }
}

// API Routes

// Get all inventory
app.get("/api/inventory", (req, res) => {
  const inventory = loadInventory();
  res.json(inventory);
});

// Get inventory item by ID
app.get("/api/inventory/:id", (req, res) => {
  const inventory = loadInventory();
  const item = inventory.find((item) => item.id === req.params.id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

// Update inventory item
app.put("/api/inventory/:id", (req, res) => {
  const inventory = loadInventory();
  const index = inventory.findIndex((item) => item.id === req.params.id);
  if (index !== -1) {
    inventory[index] = { ...inventory[index], ...req.body };
    saveInventory(inventory);
    res.json(inventory[index]);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

// Add new inventory item
app.post("/api/inventory", (req, res) => {
  const inventory = loadInventory();
  const newItem: InventoryItem = {
    id: `prod-${Date.now()}`,
    ...req.body,
  };
  inventory.push(newItem);
  saveInventory(inventory);
  res.status(201).json(newItem);
});

// Delete inventory item
app.delete("/api/inventory/:id", (req, res) => {
  const inventory = loadInventory();
  const index = inventory.findIndex((item) => item.id === req.params.id);
  if (index !== -1) {
    const deleted = inventory.splice(index, 1);
    saveInventory(inventory);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: "Item not found" });
  }
});

// Get waste logs
app.get("/api/waste-logs", (req, res) => {
  const logs = loadWasteLogs();
  res.json(logs);
});

// Add waste log
app.post("/api/waste-logs", (req, res) => {
  const logs = loadWasteLogs();
  const newLog: WasteLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...req.body,
  };
  logs.push(newLog);
  saveWasteLogs(logs);
  res.status(201).json(newLog);
});

// Delete waste log
app.delete("/api/waste-logs/:id", (req, res) => {
  const logs = loadWasteLogs();
  const index = logs.findIndex((log) => log.id === req.params.id);
  if (index !== -1) {
    const deleted = logs.splice(index, 1);
    saveWasteLogs(logs);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: "Log not found" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
