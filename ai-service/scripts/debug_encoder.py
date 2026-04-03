import joblib
import pandas as pd
import numpy as np

encoder = joblib.load("models/car_buy_encoder.joblib")
model = joblib.load("models/car_buy_model.joblib")

print("Encoder categories:")
for i, col in enumerate(encoder.feature_names_in_):
    print(f"{col}: {encoder.categories_[i]}")

def test_predict(trans_case):
    input_df = pd.DataFrame([{
        'brand': 'Suzuki',
        'model': 'Alto',
        'year': 2023,
        'fuelType': 'Petrol',
        'transmission': trans_case,
        'city': 'Addis Ababa'
    }])

    categorical_cols = ['brand', 'model', 'fuelType', 'transmission', 'city']
    X_encoded = encoder.transform(input_df[categorical_cols])
    X_final = np.hstack([X_encoded, input_df[['year']].values])

    prediction = model.predict(X_final)[0]
    print(f"Prediction for {trans_case}: {prediction:,.2f}")

test_predict("Automatic")
test_predict("Manual")
test_predict("automatic")
test_predict("manual")
