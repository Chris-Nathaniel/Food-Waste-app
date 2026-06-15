/**
 * Prediction Card Component
 * Displays ML predictions for inventory items
 */

import React, { useState } from 'react';
import { MLClient, PredictionResult, ProductData } from '../utils/mlClient';
import '../styles/PredictionCard.css';

interface PredictionCardProps {
  product: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    price_IDR: number;
    expirationDate: string;
    storageTemp?: number;
  };
  onDiscountRecommended?: (discount: number, newPrice: number) => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  product,
  onDiscountRecommended,
}) => {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mlClient = new MLClient();

  // Calculate days until expiration
  const calculateExpiryDays = (expirationDate: string): number => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get current date info
  const getTodayInfo = () => {
    const today = new Date();
    return {
      month: today.getMonth() + 1,
      day: today.getDate(),
      quarter: Math.ceil((today.getMonth() + 1) / 3),
      dayOfWeek: today.getDay() || 7, // 1-7, Sunday = 7
      isWeekend: [0, 6].includes(today.getDay()) ? 1 : 0,
    };
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateInfo = getTodayInfo();
      const expiryDays = calculateExpiryDays(product.expirationDate);

      const productData: ProductData = {
        product: product.name,
        unit: product.unit,
        quantity: product.quantity,
        price_IDR: product.price_IDR,
        expiry_days: expiryDays,
        storage_temperature_C: product.storageTemp || 25,
        day_of_week: dateInfo.dayOfWeek,
        is_weekend: dateInfo.isWeekend,
        month: dateInfo.month,
        day: dateInfo.day,
        quarter: dateInfo.quarter,
      };

      const result = await mlClient.predict(productData);

      if (result.success) {
        setPrediction(result);

        // Calculate discount if high risk
        if (result.risk_level === 'HIGH' && onDiscountRecommended) {
          const discountAmount = product.price_IDR * (result.recommended_discount_percent / 100);
          const newPrice = product.price_IDR - discountAmount;
          onDiscountRecommended(result.recommended_discount_percent, newPrice);
        }
      } else {
        setError(result.error || 'Prediction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string): string => {
    const colors: Record<string, string> = {
      LOW: '#10b981',
      MEDIUM: '#f59e0b',
      HIGH: '#ef4444',
    };
    return colors[risk] || '#6b7280';
  };

  const getRiskIcon = (risk: string): string => {
    const icons: Record<string, string> = {
      LOW: '✓',
      MEDIUM: '⚠',
      HIGH: '✕',
    };
    return icons[risk] || '?';
  };

  return (
    <div className="prediction-card">
      <div className="card-header">
        <h3>{product.name}</h3>
        <p className="product-unit">
          {product.quantity} {product.unit}
        </p>
      </div>

      <div className="card-body">
        <div className="product-info">
          <div className="info-row">
            <span className="label">Price:</span>
            <span className="value">Rp {product.price_IDR.toLocaleString('id-ID')}</span>
          </div>
          <div className="info-row">
            <span className="label">Expiration:</span>
            <span className="value">{product.expirationDate}</span>
          </div>
        </div>

        {!prediction ? (
          <button
            className="predict-btn"
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Get ML Prediction'}
          </button>
        ) : (
          <div className="prediction-results">
            <div className="prediction-row">
              <span className="label">Predicted Demand:</span>
              <span className="value demand">
                {prediction.predicted_demand.toFixed(0)} units
              </span>
            </div>

            <div className="prediction-row">
              <span className="label">Risk Level:</span>
              <span
                className="value risk-badge"
                style={{ backgroundColor: getRiskColor(prediction.risk_level) }}
              >
                {getRiskIcon(prediction.risk_level)} {prediction.risk_level}
              </span>
            </div>

            <div className="prediction-row">
              <span className="label">Confidence:</span>
              <span className="value">{prediction.confidence.toFixed(1)}%</span>
            </div>

            {prediction.recommended_discount_percent > 0 && (
              <div className="prediction-row discount-recommendation">
                <span className="label">Suggested Discount:</span>
                <span className="value discount">
                  {prediction.recommended_discount_percent.toFixed(0)}%
                </span>
              </div>
            )}

            <div className="risk-probabilities">
              <div className="prob-item">
                <span>Low Risk</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill low"
                    style={{ width: `${prediction.risk_probabilities.LOW * 100}%` }}
                  />
                </div>
                <span className="prob-value">
                  {(prediction.risk_probabilities.LOW * 100).toFixed(0)}%
                </span>
              </div>

              <div className="prob-item">
                <span>Medium Risk</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill medium"
                    style={{ width: `${prediction.risk_probabilities.MEDIUM * 100}%` }}
                  />
                </div>
                <span className="prob-value">
                  {(prediction.risk_probabilities.MEDIUM * 100).toFixed(0)}%
                </span>
              </div>

              <div className="prob-item">
                <span>High Risk</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill high"
                    style={{ width: `${prediction.risk_probabilities.HIGH * 100}%` }}
                  />
                </div>
                <span className="prob-value">
                  {(prediction.risk_probabilities.HIGH * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <button
              className="predict-btn secondary"
              onClick={() => {
                setPrediction(null);
                setError(null);
              }}
            >
              New Prediction
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span>⚠ {error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
