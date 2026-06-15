/**
 * ML API Client for React Components
 * Handles all communication with the Python Flask ML API server
 */

export interface ProductData {
  product: string;
  unit: string;
  quantity: number;
  price_IDR: number;
  expiry_days: number;
  storage_temperature_C: number;
  day_of_week: number;
  is_weekend: number;
  month: number;
  day: number;
  quarter: number;
}

export interface RiskProbabilities {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
}

export interface PredictionResult {
  success: boolean;
  predicted_demand: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_probabilities: RiskProbabilities;
  recommended_discount_percent: number;
  confidence: number;
  product?: string;
  error?: string;
}

export interface DiscountRecommendation extends PredictionResult {
  current_price: number;
  discount_amount: number;
  new_price: number;
}

export interface BatchPredictionResponse {
  success: boolean;
  count: number;
  predictions: PredictionResult[];
}

export interface ModelInfo {
  status: string;
  demand_model: {
    type: string;
    n_estimators: number;
    max_depth: number;
  };
  risk_model: {
    type: string;
    n_estimators: number;
    max_depth: number;
  };
  features_used: number;
  feature_names: string[];
}

export interface HealthStatus {
  status: string;
  models_loaded: boolean;
  timestamp: string;
}

class MLClientError extends Error {
  constructor(
    public statusCode: number,
    public responseBody: string,
    message: string
  ) {
    super(message);
    this.name = 'MLClientError';
  }
}

export class MLClient {
  private static readonly DEFAULT_BASE_URL = 'http://localhost:5000/api/ml';
  private baseUrl: string;
  private timeout: number;

  constructor(
    baseUrl: string = process.env.REACT_APP_ML_API_URL || MLClient.DEFAULT_BASE_URL,
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  /**
   * Make a request to the ML API with timeout
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseBody = await response.text();

      if (!response.ok) {
        throw new MLClientError(
          response.status,
          responseBody,
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return responseBody ? JSON.parse(responseBody) : ({} as T);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check API health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/health', {
      method: 'GET',
    });
  }

  /**
   * Predict demand and risk for a single product
   */
  async predict(productData: ProductData): Promise<PredictionResult> {
    if (!this.validateProductData(productData)) {
      throw new Error('Invalid product data: missing required fields');
    }

    return this.request<PredictionResult>('/predict', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  /**
   * Predict for multiple products in a single batch
   */
  async predictBatch(products: ProductData[]): Promise<PredictionResult[]> {
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('Products must be a non-empty array');
    }

    if (products.length > 1000) {
      throw new Error('Maximum 1000 products per batch');
    }

    // Validate all products
    for (const product of products) {
      if (!this.validateProductData(product)) {
        throw new Error('Invalid product data: missing required fields');
      }
    }

    const response = await this.request<BatchPredictionResponse>('/predict-batch', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });

    return response.predictions;
  }

  /**
   * Get discount recommendation with adjusted discount based on demand
   */
  async recommendDiscount(
    productData: ProductData & { current_price: number }
  ): Promise<DiscountRecommendation> {
    if (!this.validateProductData(productData)) {
      throw new Error('Invalid product data: missing required fields');
    }

    if (productData.current_price < 0) {
      throw new Error('Current price must be non-negative');
    }

    return this.request<DiscountRecommendation>('/recommend-discount', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  /**
   * Get information about the loaded models
   */
  async getModelInfo(): Promise<ModelInfo> {
    return this.request<ModelInfo>('/model-info', {
      method: 'GET',
    });
  }

  /**
   * Get detailed model evaluation results
   */
  async getModelResults(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/results', {
      method: 'GET',
    });
  }

  /**
   * Validate that product data has all required fields
   */
  private validateProductData(data: ProductData): boolean {
    const requiredFields: (keyof ProductData)[] = [
      'product',
      'unit',
      'quantity',
      'price_IDR',
      'expiry_days',
      'storage_temperature_C',
      'day_of_week',
      'is_weekend',
      'month',
      'day',
      'quarter',
    ];

    return requiredFields.every((field) => field in data && data[field] !== undefined);
  }

  /**
   * Get color for risk level (useful for UI)
   */
  static getRiskColor(riskLevel: string): string {
    const colors: Record<string, string> = {
      LOW: '#10b981', // Green
      MEDIUM: '#f59e0b', // Amber
      HIGH: '#ef4444', // Red
    };
    return colors[riskLevel] || '#6b7280';
  }

  /**
   * Get icon for risk level
   */
  static getRiskIcon(riskLevel: string): string {
    const icons: Record<string, string> = {
      LOW: '✓',
      MEDIUM: '⚠',
      HIGH: '✕',
    };
    return icons[riskLevel] || '?';
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  /**
   * Format currency (IDR)
   */
  static formatCurrency(value: number, currency: string = 'Rp'): string {
    return `${currency} ${value.toLocaleString('id-ID')}`;
  }
}

// Create singleton instance
export const mlClient = new MLClient();

// Export for use in React components
export default MLClient;
