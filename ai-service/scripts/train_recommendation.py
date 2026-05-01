import json
import os
import sys
from datetime import datetime, timezone

import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.recommendation_ml import (  # noqa: E402
    CATEGORICAL_FEATURES,
    FEATURE_SCHEMA_VERSION,
    META_PATH,
    MIN_TRAINING_REQUIREMENTS,
    MODEL_FEATURES,
    MODEL_PATH,
    NUMERIC_FEATURES,
    build_training_dataset,
)


def _build_pipeline():
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", categorical_transformer, CATEGORICAL_FEATURES),
            ("numeric", numeric_transformer, NUMERIC_FEATURES),
        ]
    )

    return Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", RandomForestRegressor(
            n_estimators=250,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )),
    ])


def train_model():
    training_df, dataset_meta = build_training_dataset()

    if training_df.empty:
        print("No recommendation training data is available yet.")
        return {"status": "skipped", "reason": "empty_dataset", "dataset": dataset_meta}

    positive_pairs = int(dataset_meta.get("positive_pairs", 0))
    unique_users = int(dataset_meta.get("unique_users", 0))
    unique_properties = int(dataset_meta.get("unique_properties", 0))

    if (
        positive_pairs < MIN_TRAINING_REQUIREMENTS["positive_pairs"]
        or unique_users < MIN_TRAINING_REQUIREMENTS["unique_users"]
        or unique_properties < MIN_TRAINING_REQUIREMENTS["unique_properties"]
    ):
        print("Not enough real interaction data to train the recommendation ranker yet.")
        print(f"Positive pairs: {positive_pairs}")
        print(f"Unique users: {unique_users}")
        print(f"Unique properties: {unique_properties}")
        return {
            "status": "skipped",
            "reason": "insufficient_data",
            "dataset": dataset_meta,
            "minimum_requirements": MIN_TRAINING_REQUIREMENTS,
        }

    X = training_df[MODEL_FEATURES].copy()
    y = training_df["label"].astype(float)

    pipeline = _build_pipeline()
    metrics = {}

    if len(training_df) >= 25:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
        )
        pipeline.fit(X_train, y_train)
        predictions = pipeline.predict(X_test)
        metrics = {
            "mae": float(mean_absolute_error(y_test, predictions)),
            "rmse": float(mean_squared_error(y_test, predictions) ** 0.5),
            "r2": float(r2_score(y_test, predictions)),
            "test_rows": int(len(X_test)),
        }
    else:
        pipeline.fit(X, y)
        metrics = {
            "mae": None,
            "rmse": None,
            "r2": None,
            "test_rows": 0,
        }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    metadata = {
        "schema_version": FEATURE_SCHEMA_VERSION,
        "trained_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "model_type": "RandomForestRegressor",
        "engine_mode_hint": "auto",
        "feature_count": len(MODEL_FEATURES),
        "dataset": {
            **dataset_meta,
            "rows": int(len(training_df)),
            "columns": len(MODEL_FEATURES),
        },
        "metrics": metrics,
        "minimum_requirements": MIN_TRAINING_REQUIREMENTS,
    }

    with META_PATH.open("w", encoding="utf-8") as meta_file:
        json.dump(metadata, meta_file, indent=2)

    print(f"Recommendation ranker trained successfully on {len(training_df)} rows.")
    print(f"Model saved to {MODEL_PATH}")
    print(f"Metadata saved to {META_PATH}")

    return {"status": "trained", "metadata": metadata}


if __name__ == "__main__":
    train_model()
