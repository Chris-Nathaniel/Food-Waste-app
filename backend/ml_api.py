"""
Flask API Server for ML Model Integration
Provides REST endpoints for ML predictions
This runs as a separate Python service that the Node.js server can communicate with
"""

from flask import Flask, request, jsonify
import os
import sys
from pathlib import Path
from flask_cors import CORS


# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from ml_wrapper import MLModelWrapper

# Update data path references for backend
DATA_PATH = './data.csv'
MODELS_DIR = './models'

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Enable CORS so the React dev server can call this API
# Adjust allowed origins if your frontend runs on a different port.
CORS(app, resources={"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)


# Initialize ML model wrapper
ml = MLModelWrapper(model_dir='./models')

@app.route('/api/ml/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': ml.is_loaded,
        'timestamp': pd.Timestamp.now().isoformat()
    })

@app.route('/api/ml/predict', methods=['POST'])
def predict():
    """
    Predict demand and risk level for a product
    
    Expected JSON payload:
    {
        "product": "Minyak Goreng",
        "unit": "pouch_1L",
        "quantity": 50,
        "price_IDR": 18000,
        "expiry_days": 200,
        "storage_temperature_C": 25,
        "day_of_week": 3,
        "is_weekend": 0,
        "month": 6,
        "day": 14,
        "quarter": 2
    }
    """
    if not ml.is_loaded:
        return jsonify({'error': 'Models not loaded'}), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        required_fields = [
            'product', 'unit', 'quantity', 'price_IDR', 'expiry_days',
            'storage_temperature_C', 'day_of_week', 'is_weekend',
            'month', 'day', 'quarter'
        ]
        
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Make prediction
        prediction = ml.predict(data)
        
        if 'error' in prediction:
            return jsonify(prediction), 400
        
        return jsonify(prediction), 200
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/ml/predict-batch', methods=['POST'])
def predict_batch():
    """
    Predict for multiple products at once
    
    Expected JSON payload:
    {
        "products": [
            {product_data_1},
            {product_data_2},
            ...
        ]
    }
    """
    if not ml.is_loaded:
        return jsonify({'error': 'Models not loaded'}), 503
    
    try:
        data = request.get_json()
        
        if not data or 'products' not in data:
            return jsonify({'error': 'Missing "products" array in request'}), 400
        
        products = data['products']
        
        if not isinstance(products, list):
            return jsonify({'error': '"products" must be an array'}), 400
        
        if len(products) > 1000:
            return jsonify({'error': 'Maximum 1000 products per request'}), 400
        
        # Make predictions
        predictions = ml.predict_batch(products)
        
        return jsonify({
            'success': True,
            'count': len(predictions),
            'predictions': predictions
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/ml/model-info', methods=['GET'])
def model_info():
    """Get information about loaded models"""
    return jsonify(ml.get_model_info()), 200

@app.route('/api/ml/results', methods=['GET'])
def model_results():
    """Get model evaluation results"""
    return jsonify(ml.load_results()), 200

@app.route('/api/ml/recommend-discount', methods=['POST'])
def recommend_discount():
    """
    Recommend discount percentage based on inventory data
    This is a convenience endpoint that combines prediction with discount logic
    
    Expected JSON payload:
    {
        "product": "Minyak Goreng",
        "unit": "pouch_1L",
        "quantity": 50,
        "price_IDR": 18000,
        "expiry_days": 200,
        "storage_temperature_C": 25,
        "day_of_week": 3,
        "is_weekend": 0,
        "month": 6,
        "day": 14,
        "quarter": 2,
        "current_price": 18000
    }
    """
    if not ml.is_loaded:
        return jsonify({'error': 'Models not loaded'}), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Get prediction
        prediction = ml.predict(data)
        
        if 'error' in prediction:
            return jsonify(prediction), 400
        
        # Enhanced discount logic based on risk and demand
        base_discount = prediction['recommended_discount_percent']
        
        # Adjust discount based on demand
        demand = prediction['predicted_demand']
        if demand < 30:  # Low demand
            base_discount += 5
        elif demand > 150:  # High demand
            base_discount = max(0, base_discount - 5)  # Reduce discount for high demand
        
        # Calculate new price
        current_price = data.get('current_price', data.get('price_IDR', 0))
        discount_amount = current_price * (base_discount / 100)
        new_price = current_price - discount_amount
        
        return jsonify({
            'success': True,
            'product': data.get('product', 'Unknown'),
            'current_price': current_price,
            'recommended_discount_percent': base_discount,
            'discount_amount': round(discount_amount, 2),
            'new_price': round(new_price, 2),
            'risk_level': prediction['risk_level'],
            'predicted_demand': prediction['predicted_demand'],
            'confidence': prediction['confidence']
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    import pandas as pd
    
    # Load models at startup
    with app.app_context():
        if not ml.load_models():
            print("WARNING: Could not load ML models on startup")
    
    # Get host and port from environment or use defaults
    host = os.getenv('ML_API_HOST', '127.0.0.1')
    port = int(os.getenv('ML_API_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting ML API server on {host}:{port}")
    print("Endpoints:")
    print(f"  GET  /api/ml/health")
    print(f"  POST /api/ml/predict")
    print(f"  POST /api/ml/predict-batch")
    print(f"  GET  /api/ml/model-info")
    print(f"  GET  /api/ml/results")
    print(f"  POST /api/ml/recommend-discount")
    
    app.run(host=host, port=port, debug=debug)
