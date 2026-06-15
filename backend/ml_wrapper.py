"""
ML Model Wrapper for Backend Integration
Provides utility functions to load and use trained models
"""

import os
import pickle
import json
import pandas as pd
from typing import Dict, Any, List

class MLModelWrapper:
    """Wrapper class to manage trained ML models"""
    
    def __init__(self, model_dir='./models'):
        self.model_dir = model_dir
        self.demand_model = None
        self.risk_model = None
        self.label_encoders = None
        self.scaler = None
        self.feature_cols = [
            'quantity', 'price_IDR', 'expiry_days', 'storage_temperature_C',
            'day_of_week', 'is_weekend', 'product_encoded', 'unit_encoded',
            'month', 'day', 'quarter', 'price_per_unit', 'expiry_urgency',
            'temp_expiry_interaction', 'quantity_price_ratio'
        ]
        
        self.is_loaded = False
    
    def load_models(self) -> bool:
        """
        Load saved models and preprocessors
        Returns: True if successful, False otherwise
        """
        try:
            if not os.path.exists(self.model_dir):
                print(f"Model directory not found: {self.model_dir}")
                return False
            
            demand_path = os.path.join(self.model_dir, 'demand_model.pkl')
            risk_path = os.path.join(self.model_dir, 'risk_model.pkl')
            encoders_path = os.path.join(self.model_dir, 'label_encoders.pkl')
            scaler_path = os.path.join(self.model_dir, 'scaler.pkl')
            
            if not all(os.path.exists(p) for p in [demand_path, risk_path, encoders_path, scaler_path]):
                print("One or more model files not found. Train models first using ml_model.py")
                return False
            
            self.demand_model = pickle.load(open(demand_path, 'rb'))
            self.risk_model = pickle.load(open(risk_path, 'rb'))
            self.label_encoders = pickle.load(open(encoders_path, 'rb'))
            self.scaler = pickle.load(open(scaler_path, 'rb'))
            
            self.is_loaded = True
            print("Models loaded successfully")
            return True
        
        except Exception as e:
            print(f"Error loading models: {str(e)}")
            return False
    
    def preprocess_product_data(self, product_data: Dict[str, Any]) -> pd.DataFrame:
        """
        Preprocess and engineer features for a single product
        """
        # Make a copy to avoid modifying original
        data = product_data.copy()
        
        # Encode categorical features
        try:
            data['product_encoded'] = self.label_encoders['product'].transform(
                [data['product']]
            )[0]
            data['unit_encoded'] = self.label_encoders['unit'].transform(
                [data['unit']]
            )[0]
        except Exception as e:
            print(f"Error encoding categorical features: {str(e)}")
            return None
        
        # Feature engineering
        data['price_per_unit'] = data['price_IDR'] / (data['quantity'] + 1)
        data['expiry_urgency'] = 1 / (data['expiry_days'] + 1)
        data['temp_expiry_interaction'] = data['storage_temperature_C'] * data['expiry_days']
        data['quantity_price_ratio'] = data['quantity'] / (data['price_IDR'] + 1)
        
        # Create DataFrame with selected features
        X = pd.DataFrame([data])[self.feature_cols]
        
        return X
    
    def predict(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make predictions for a single product
        
        Args:
            product_data: Dictionary with product features
            
        Returns:
            Dictionary with demand prediction, risk level, and probabilities
        """
        if not self.is_loaded:
            return {'error': 'Models not loaded'}
        
        try:
            # Preprocess data
            X = self.preprocess_product_data(product_data)
            
            if X is None:
                return {'error': 'Failed to preprocess data'}
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Make predictions
            demand_pred = float(self.demand_model.predict(X_scaled)[0])
            risk_pred = int(self.risk_model.predict(X_scaled)[0])
            risk_proba = self.risk_model.predict_proba(X_scaled)[0]
            
            # Map risk encoding to labels
            risk_labels = ['LOW', 'MEDIUM', 'HIGH']
            risk_level = risk_labels[risk_pred]
            
            # Calculate discount recommendation based on risk level
            discount_mapping = {
                'LOW': 0.0,
                'MEDIUM': 10.0,
                'HIGH': 25.0
            }
            
            return {
                'success': True,
                'predicted_demand': round(demand_pred, 2),
                'risk_level': risk_level,
                'risk_probabilities': {
                    'LOW': float(round(risk_proba[0], 3)),
                    'MEDIUM': float(round(risk_proba[1], 3)),
                    'HIGH': float(round(risk_proba[2], 3))
                },
                'recommended_discount_percent': discount_mapping[risk_level],
                'confidence': float(round(max(risk_proba) * 100, 2))
            }
        
        except Exception as e:
            return {'error': f'Prediction failed: {str(e)}'}
    
    def predict_batch(self, products_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Make predictions for multiple products
        """
        results = []
        for product in products_data:
            result = self.predict(product)
            result['product'] = product.get('product', 'Unknown')
            results.append(result)
        return results
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        if not self.is_loaded:
            return {'status': 'Models not loaded'}
        
        return {
            'status': 'Ready',
            'demand_model': {
                'type': type(self.demand_model).__name__,
                'n_estimators': self.demand_model.n_estimators,
                'max_depth': self.demand_model.max_depth
            },
            'risk_model': {
                'type': type(self.risk_model).__name__,
                'n_estimators': self.risk_model.n_estimators,
                'max_depth': self.risk_model.max_depth
            },
            'features_used': len(self.feature_cols),
            'feature_names': self.feature_cols
        }
    
    def load_results(self) -> Dict[str, Any]:
        """Load model evaluation results"""
        results_path = os.path.join(self.model_dir, 'model_results.json')
        
        if not os.path.exists(results_path):
            return {'error': 'Results file not found'}
        
        try:
            with open(results_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            return {'error': f'Failed to load results: {str(e)}'}


# Example usage
if __name__ == "__main__":
    # Initialize wrapper
    ml = MLModelWrapper(model_dir='./models')
    
    # Load models
    if not ml.load_models():
        print("Failed to load models. Make sure to run ml_model.py first.")
        exit(1)
    
    # Print model info
    print("\n" + "="*60)
    print("MODEL INFORMATION")
    print("="*60)
    print(json.dumps(ml.get_model_info(), indent=2))
    
    # Print evaluation results
    print("\n" + "="*60)
    print("MODEL EVALUATION RESULTS")
    print("="*60)
    results = ml.load_results()
    if 'error' not in results:
        print(json.dumps(results, indent=2))
    
    # # Test with sample products
    # print("\n" + "="*60)
    # print("SAMPLE PREDICTIONS")
    # print("="*60)
    
    # sample_products = [
    #     {
    #         'product': 'Minyak Goreng',
    #         'unit': 'pouch_1L',
    #         'quantity': 50,
    #         'price_IDR': 18000,
    #         'expiry_days': 200,
    #         'storage_temperature_C': 25,
    #         'day_of_week': 3,
    #         'is_weekend': 0,
    #         'month': 6,
    #         'day': 14,
    #         'quarter': 2
    #     },
    #     {
    #         'product': 'Bayam',
    #         'unit': 'ikat',
    #         'quantity': 30,
    #         'price_IDR': 3500,
    #         'expiry_days': 2,
    #         'storage_temperature_C': 5,
    #         'day_of_week': 5,
    #         'is_weekend': 1,
    #         'month': 6,
    #         'day': 14,
    #         'quarter': 2
    #     }
    # ]
    
    # predictions = ml.predict_batch(sample_products)
    
    # for pred in predictions:
    #     print(f"\nProduct: {pred['product']}")
    #     if 'error' not in pred:
    #         print(f"  Predicted Demand: {pred['predicted_demand']}")
    #         print(f"  Risk Level: {pred['risk_level']}")
    #         print(f"  Risk Probabilities: {pred['risk_probabilities']}")
    #         print(f"  Recommended Discount: {pred['recommended_discount_percent']}%")
    #         print(f"  Confidence: {pred['confidence']}%")
    #     else:
    #         print(f"  Error: {pred['error']}")
