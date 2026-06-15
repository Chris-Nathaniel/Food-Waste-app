"""
Food Waste Management ML Model
Predicts demand and classifies risk levels using XGBoost
"""

import pandas as pd
import numpy as np
import pickle
import json
from datetime import datetime
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    mean_squared_error, r2_score, mean_absolute_error,
    classification_report, confusion_matrix, accuracy_score
)
import xgboost as xgb
import matplotlib.pyplot as plt
import seaborn as sns

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 6)

class FoodWasteMLModel:
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.X_train = None
        self.X_test = None
        self.y_train_demand = None
        self.y_test_demand = None
        self.y_train_risk = None
        self.y_test_risk = None
        
        self.demand_model = None
        self.risk_model = None
        
        self.label_encoders = {}
        self.scaler = StandardScaler()
        
        self.results = {
            'demand': {},
            'risk': {}
        }
    
    def load_data(self):
        """Load the CSV dataset"""
        print("Loading data...")
        self.df = pd.read_csv(self.data_path)
        print(f"Dataset shape: {self.df.shape}")
        print(f"\nFirst few rows:\n{self.df.head()}")
        print(f"\nData types:\n{self.df.dtypes}")
        print(f"\nMissing values:\n{self.df.isnull().sum()}")
        return self.df
    
    def explore_data(self):
        """Exploratory data analysis"""
        print("\n" + "="*50)
        print("EXPLORATORY DATA ANALYSIS")
        print("="*50)
        
        print(f"\nDataset Statistics:\n{self.df.describe()}")
        
        print(f"\nRisk Level Distribution:\n{self.df['risk_level'].value_counts()}")
        print(f"\nDemand Statistics:\n{self.df['predicted_demand'].describe()}")
        
        # Check correlations with numeric columns
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        print(f"\nCorrelation with demand:\n{self.df[numeric_cols].corr()['predicted_demand'].sort_values(ascending=False)}")
    
    def preprocess_data(self):
        """Preprocess and feature engineer the data"""
        print("\n" + "="*50)
        print("PREPROCESSING DATA")
        print("="*50)
        
        df = self.df.copy()
        
        # Parse DateTime
        df['DateTime'] = pd.to_datetime(df['DateTime'])
        
        # Extract temporal features
        df['month'] = df['DateTime'].dt.month
        df['day'] = df['DateTime'].dt.day
        df['quarter'] = df['DateTime'].dt.quarter
        
        # Encode categorical variables
        categorical_cols = ['product', 'unit']
        
        for col in categorical_cols:
            le = LabelEncoder()
            df[col + '_encoded'] = le.fit_transform(df[col])
            self.label_encoders[col] = le
            print(f"Encoded {col}: {len(le.classes_)} unique values")
        
        # Feature engineering
        df['price_per_unit'] = df['price_IDR'] / (df['quantity'] + 1)  # Avoid division by zero
        df['expiry_urgency'] = 1 / (df['expiry_days'] + 1)  # Inverse relationship
        df['temp_expiry_interaction'] = df['storage_temperature_C'] * df['expiry_days']
        df['quantity_price_ratio'] = df['quantity'] / (df['price_IDR'] + 1)
        
        # Risk encoding for modeling
        risk_mapping = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2}
        df['risk_encoded'] = df['risk_level'].map(risk_mapping)
        
        print("\nFeatures created:")
        print("- Temporal: month, day, quarter")
        print("- Engineered: price_per_unit, expiry_urgency, temp_expiry_interaction, quantity_price_ratio")
        
        self.df = df
        return df
    
    def select_features(self):
        """Select features for modeling"""
        feature_cols = [
            'quantity', 'price_IDR', 'expiry_days', 'storage_temperature_C',
            'day_of_week', 'is_weekend', 'product_encoded', 'unit_encoded',
            'month', 'day', 'quarter', 'price_per_unit', 'expiry_urgency',
            'temp_expiry_interaction', 'quantity_price_ratio'
        ]
        
        X = self.df[feature_cols]
        y_demand = self.df['predicted_demand']
        y_risk = self.df['risk_encoded']
        
        print(f"\nSelected features ({len(feature_cols)}):")
        print(feature_cols)
        
        return X, y_demand, y_risk
    
    def split_data(self, X, y_demand, y_risk, test_size=0.2, random_state=42):
        """Split data into train and test sets"""
        print("\n" + "="*50)
        print("SPLITTING DATA")
        print("="*50)
        
        self.X_train, self.X_test, self.y_train_demand, self.y_test_demand = train_test_split(
            X, y_demand, test_size=test_size, random_state=random_state
        )
        
        _, _, self.y_train_risk, self.y_test_risk = train_test_split(
            X, y_risk, test_size=test_size, random_state=random_state
        )
        
        print(f"Training set size: {self.X_train.shape}")
        print(f"Test set size: {self.X_test.shape}")
        
        # Scale features
        self.X_train_scaled = self.scaler.fit_transform(self.X_train)
        self.X_test_scaled = self.scaler.transform(self.X_test)
        
        print("Features scaled using StandardScaler")
    
    def train_demand_model(self):
        """Train XGBoost model for demand prediction"""
        print("\n" + "="*50)
        print("TRAINING DEMAND PREDICTION MODEL")
        print("="*50)
        
        self.demand_model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            tree_method='hist',
            device='cpu',
            verbosity=0
        )
        
        print("Training XGBoost Regressor...")
        self.demand_model.fit(
            self.X_train_scaled, self.y_train_demand,
            eval_set=[(self.X_test_scaled, self.y_test_demand)],
            verbose=False
        )
        
        # Predictions
        y_train_pred = self.demand_model.predict(self.X_train_scaled)
        y_test_pred = self.demand_model.predict(self.X_test_scaled)
        
        # Metrics
        train_rmse = np.sqrt(mean_squared_error(self.y_train_demand, y_train_pred))
        test_rmse = np.sqrt(mean_squared_error(self.y_test_demand, y_test_pred))
        train_mae = mean_absolute_error(self.y_train_demand, y_train_pred)
        test_mae = mean_absolute_error(self.y_test_demand, y_test_pred)
        train_r2 = r2_score(self.y_train_demand, y_train_pred)
        test_r2 = r2_score(self.y_test_demand, y_test_pred)
        
        self.results['demand'] = {
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
            'train_mae': float(train_mae),
            'test_mae': float(test_mae),
            'train_r2': float(train_r2),
            'test_r2': float(test_r2)
        }
        
        print(f"\nDemand Model Performance:")
        print(f"  Train RMSE: {train_rmse:.4f} | Test RMSE: {test_rmse:.4f}")
        print(f"  Train MAE:  {train_mae:.4f} | Test MAE:  {test_mae:.4f}")
        print(f"  Train R²:   {train_r2:.4f} | Test R²:   {test_r2:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.X_train.columns,
            'importance': self.demand_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\nTop 10 Important Features (Demand):")
        print(feature_importance.head(10))
        
        return feature_importance
    
    def train_risk_model(self):
        """Train XGBoost model for risk classification"""
        print("\n" + "="*50)
        print("TRAINING RISK CLASSIFICATION MODEL")
        print("="*50)
        
        self.risk_model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            tree_method='hist',
            num_class=3,
            device='cpu',
            verbosity=0
        )
        
        print("Training XGBoost Classifier...")
        self.risk_model.fit(
            self.X_train_scaled, self.y_train_risk,
            eval_set=[(self.X_test_scaled, self.y_test_risk)],
            verbose=False
        )
        
        # Predictions
        y_train_pred = self.risk_model.predict(self.X_train_scaled)
        y_test_pred = self.risk_model.predict(self.X_test_scaled)
        
        # Metrics
        train_acc = accuracy_score(self.y_train_risk, y_train_pred)
        test_acc = accuracy_score(self.y_test_risk, y_test_pred)
        
        self.results['risk'] = {
            'train_accuracy': float(train_acc),
            'test_accuracy': float(test_acc),
            'classification_report': classification_report(
                self.y_test_risk, y_test_pred,
                target_names=['LOW', 'MEDIUM', 'HIGH']
            ),
            'confusion_matrix': confusion_matrix(self.y_test_risk, y_test_pred).tolist()
        }
        
        print(f"\nRisk Classification Model Performance:")
        print(f"  Train Accuracy: {train_acc:.4f}")
        print(f"  Test Accuracy:  {test_acc:.4f}")
        print(f"\nClassification Report:")
        print(self.results['risk']['classification_report'])
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.X_train.columns,
            'importance': self.risk_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\nTop 10 Important Features (Risk):")
        print(feature_importance.head(10))
        
        return feature_importance
    
    def save_models(self, model_dir='./models'):
        """Save trained models and preprocessors"""
        Path(model_dir).mkdir(exist_ok=True)
        
        # Save models
        pickle.dump(self.demand_model, open(f'{model_dir}/demand_model.pkl', 'wb'))
        pickle.dump(self.risk_model, open(f'{model_dir}/risk_model.pkl', 'wb'))
        
        # Save preprocessors
        pickle.dump(self.label_encoders, open(f'{model_dir}/label_encoders.pkl', 'wb'))
        pickle.dump(self.scaler, open(f'{model_dir}/scaler.pkl', 'wb'))
        
        # Save results
        with open(f'{model_dir}/model_results.json', 'w') as f:
            json.dump(self.results, f, indent=4)
        
        print(f"\nModels saved to {model_dir}/")
        print("  - demand_model.pkl")
        print("  - risk_model.pkl")
        print("  - label_encoders.pkl")
        print("  - scaler.pkl")
        print("  - model_results.json")
    
    def plot_results(self, save_path='./models'):
        """Visualize model results"""
        Path(save_path).mkdir(exist_ok=True)
        
        # Get predictions for plotting
        y_train_pred_demand = self.demand_model.predict(self.X_train_scaled)
        y_test_pred_demand = self.demand_model.predict(self.X_test_scaled)
        
        # Plot 1: Demand prediction scatter
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        
        axes[0].scatter(self.y_train_demand, y_train_pred_demand, alpha=0.5, label='Train')
        axes[0].scatter(self.y_test_demand, y_test_pred_demand, alpha=0.5, label='Test')
        axes[0].plot([self.y_train_demand.min(), self.y_train_demand.max()],
                     [self.y_train_demand.min(), self.y_train_demand.max()], 'r--', lw=2)
        axes[0].set_xlabel('Actual Demand')
        axes[0].set_ylabel('Predicted Demand')
        axes[0].set_title('Demand Prediction Performance')
        axes[0].legend()
        axes[0].grid(True)
        
        # Plot 2: Confusion matrix
        cm = np.array(self.results['risk']['confusion_matrix'])
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[1],
                    xticklabels=['LOW', 'MEDIUM', 'HIGH'],
                    yticklabels=['LOW', 'MEDIUM', 'HIGH'])
        axes[1].set_xlabel('Predicted Risk')
        axes[1].set_ylabel('Actual Risk')
        axes[1].set_title('Risk Classification Confusion Matrix')
        
        plt.tight_layout()
        plt.savefig(f'{save_path}/model_performance.png', dpi=300, bbox_inches='tight')
        print(f"Performance plot saved to {save_path}/model_performance.png")
        plt.close()
    
    def predict(self, product_data):
        """
        Make predictions for new data
        product_data: dict with product features
        """
        # Encode categorical features
        product_data['product_encoded'] = self.label_encoders['product'].transform(
            [product_data['product']]
        )[0]
        product_data['unit_encoded'] = self.label_encoders['unit'].transform(
            [product_data['unit']]
        )[0]
        
        # Feature engineering
        product_data['price_per_unit'] = product_data['price_IDR'] / (product_data['quantity'] + 1)
        product_data['expiry_urgency'] = 1 / (product_data['expiry_days'] + 1)
        product_data['temp_expiry_interaction'] = product_data['storage_temperature_C'] * product_data['expiry_days']
        product_data['quantity_price_ratio'] = product_data['quantity'] / (product_data['price_IDR'] + 1)
        
        feature_cols = [
            'quantity', 'price_IDR', 'expiry_days', 'storage_temperature_C',
            'day_of_week', 'is_weekend', 'product_encoded', 'unit_encoded',
            'month', 'day', 'quarter', 'price_per_unit', 'expiry_urgency',
            'temp_expiry_interaction', 'quantity_price_ratio'
        ]
        
        X = pd.DataFrame([product_data])[feature_cols]
        X_scaled = self.scaler.transform(X)
        
        demand_pred = self.demand_model.predict(X_scaled)[0]
        risk_pred = self.risk_model.predict(X_scaled)[0]
        risk_proba = self.risk_model.predict_proba(X_scaled)[0]
        
        risk_labels = ['LOW', 'MEDIUM', 'HIGH']
        
        return {
            'predicted_demand': float(demand_pred),
            'risk_level': risk_labels[int(risk_pred)],
            'risk_probabilities': {
                'LOW': float(risk_proba[0]),
                'MEDIUM': float(risk_proba[1]),
                'HIGH': float(risk_proba[2])
            }
        }
    
    def run_pipeline(self):
        """Run the complete ML pipeline"""
        print("\n" + "="*60)
        print("FOOD WASTE MANAGEMENT - ML PIPELINE")
        print("="*60)
        
        self.load_data()
        self.explore_data()
        self.preprocess_data()
        
        X, y_demand, y_risk = self.select_features()
        self.split_data(X, y_demand, y_risk)
        
        demand_importance = self.train_demand_model()
        risk_importance = self.train_risk_model()
        
        self.save_models()
        self.plot_results()
        
        print("\n" + "="*60)
        print("PIPELINE COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        return {
            'demand_importance': demand_importance,
            'risk_importance': risk_importance,
            'results': self.results
        }


if __name__ == "__main__":
    # Get the data file path (in same directory as this script)
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, 'food_waste_indonesia_1000.csv')
    
    # Initialize and run the pipeline
    model = FoodWasteMLModel(data_path)
    results = model.run_pipeline()

    # Example prediction
    # print("\n" + "="*60)
    # print("EXAMPLE PREDICTION")
    # print("="*60)
    
    # example_product = {
    #     'product': 'Minyak Goreng',
    #     'unit': 'pouch_1L',
    #     'quantity': 50,
    #     'price_IDR': 18000,
    #     'expiry_days': 200,
    #     'storage_temperature_C': 25,
    #     'day_of_week': 3,
    #     'is_weekend': 0,
    #     'month': 6,
    #     'day': 14,
    #     'quarter': 2
    # }

    # prediction = model.predict(example_product)
    # print(f"\nProduct: {example_product['product']}")
    # print(f"Predicted Demand: {prediction['predicted_demand']:.2f}")
    # print(f"Risk Level: {prediction['risk_level']}")
    # print(f"Risk Probabilities: {json.dumps(prediction['risk_probabilities'], indent=2)}")
