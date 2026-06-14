export interface ProductHistory {
  timestamp: string;
  action: string;
  comment: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string; // 'Produce' | 'Meat & Seafood' | 'Dairy' | 'Bakery' | 'Pantry' | 'Deli'
  quantity: number;
  unit: string; // 'packs' | 'kg' | 'pcs' | 'bags' | 'bottles' | 'tubs' | 'items' | 'jars'
  unitPrice: number; // Retail Price
  costPrice: number; // Wholesale Cost
  expirationDate: string; // YYYY-MM-DD
  status: 'Active' | 'Discounted' | 'Expired' | 'Sold' | 'Repurposed' | 'Donated' | 'Discarded';
  appliedDiscount: number; // percentage (e.g., 30 for 30%)
  history: ProductHistory[];
}

export type WasteActionType = 'Composted' | 'Donated' | 'Deli Repurposed' | 'Discarded';

export interface WasteLog {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  category: string;
  quantity: number;
  unit: string;
  lossAmount: number; // wholesale cost lost or retail lost
  potentialLossSaved: number; // retail value captured or saved
  action: WasteActionType;
  date: string; // YYYY-MM-DD
  comment: string;
}

export interface PricingRecommendation {
  suggestedDiscount: number; // percentage
  suggestedRetailPrice: number;
  reasoning: string;
  wasteImpactDescription: string;
  repurposeIdea: {
    title: string;
    description: string;
    deliUpsellTitle: string;
  };
  isFallback?: boolean;
  fallbackReason?: string;
}

export const categoryLabels: Record<string, string> = {
  "Produce": "Sayuran & Buah",
  "Meat & Seafood": "Daging & Makanan Laut",
  "Dairy": "Susu & Olahannya",
  "Bakery": "Roti & Kue",
  "Pantry": "Sembako",
  "Deli": "Deli & Dapur"
};
