import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
from app.database import get_all_properties, query_to_dataframe

MODEL_DIR = Path(__file__).resolve().parents[2] / "models"
MODEL_PATH = MODEL_DIR / "recommendation_ranker.joblib"
META_PATH = MODEL_DIR / "recommendation_ranker_meta.json"
FEATURE_SCHEMA_VERSION = "recommendation-ranker-v1"

INTERACTION_LABELS = {
    "VIEW": 1.0,
    "FAVORITE": 4.0,
    "APPLICATION": 12.0,
    "TRANSACTION": 20.0,
}

MIN_TRAINING_REQUIREMENTS = {
    "positive_pairs": 40,
    "unique_users": 5,
    "unique_properties": 20,
}

CATEGORICAL_FEATURES = [
    "assetType",
    "listingTypePrimary",
    "propertyType",
    "brand",
    "model",
    "fuelType",
    "transmission",
    "city",
    "subcity",
    "region",
    "village",
    "marriageStatus",
    "dominantAssetType",
    "dominantListingType",
    "dominantCity",
    "dominantSubcity",
    "dominantBrand",
    "dominantModel",
    "dominantPropertyType",
    "searchType",
    "searchListingIntent",
    "searchPropertyType",
    "searchBrand",
    "searchModel",
    "searchTransmission",
    "searchFuelType",
    "searchRegion",
    "searchCity",
    "searchSubcity",
]

NUMERIC_FEATURES = [
    "price",
    "bedrooms",
    "bathrooms",
    "year",
    "area",
    "lat",
    "lng",
    "amenitiesCount",
    "kidsCount",
    "historyCount",
    "favoriteCount",
    "applicationCount",
    "transactionCount",
    "viewCount",
    "avgInteractedPrice",
    "avgBedroomsViewed",
    "avgBathroomsViewed",
    "avgYearViewed",
    "searchPriceMin",
    "searchPriceMax",
    "searchBeds",
    "searchBaths",
    "searchYearMin",
    "searchYearMax",
    "searchAmenitiesCount",
    "hasSearchFilters",
    "hasMapIntent",
    "hasProfileSignals",
    "assetTypeMatch",
    "listingIntentMatch",
    "propertyTypeMatch",
    "brandMatch",
    "modelMatch",
    "transmissionMatch",
    "fuelTypeMatch",
    "cityMatch",
    "subcityMatch",
    "regionMatch",
    "priceDiffRatio",
    "bedroomGap",
    "bathroomGap",
    "yearGap",
    "mapDistance",
]

MODEL_FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES


def _normalize_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and pd.isna(value):
        return ""
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "null"}:
        return ""
    return text.lower()


def _primary_listing_type(value: Any) -> str:
    if isinstance(value, list):
        return _normalize_text(value[0]) if value else ""
    if isinstance(value, str) and value.startswith("{") and value.endswith("}"):
        parts = [part.strip() for part in value.strip("{}").split(",") if part.strip()]
        return _normalize_text(parts[0]) if parts else ""
    if isinstance(value, str) and "," in value:
        return _normalize_text(value.split(",")[0])
    return _normalize_text(value)


def _to_filters(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return value
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return {}
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def _safe_numeric(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        if isinstance(value, str) and not value.strip():
            return None
        if pd.isna(value):
            return None
    except TypeError:
        pass
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_mode(series: pd.Series) -> str:
    cleaned = [_normalize_text(value) for value in series.tolist()]
    cleaned = [value for value in cleaned if value]
    if not cleaned:
        return ""
    return pd.Series(cleaned).mode().iloc[0]


def _parse_kids_count(value: Any) -> float:
    text = _normalize_text(value).replace("+", "")
    if not text or text == "none":
        return 0.0
    try:
        return float(int(text))
    except ValueError:
        return 0.0


def _extract_intent_value(filters: Dict[str, Any], key: str) -> str:
    raw = filters.get(key)
    if isinstance(raw, list):
        if not raw:
            return ""
        return _normalize_text(raw[0])
    return _normalize_text(raw)


def _extract_numeric_filter(filters: Dict[str, Any], key: str) -> Optional[float]:
    raw = filters.get(key)
    if isinstance(raw, list):
        if not raw:
            return None
        raw = raw[0]
    text = _normalize_text(raw)
    if text.endswith("+"):
        text = text[:-1]
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _extract_range(filters: Dict[str, Any], key: str) -> Tuple[Optional[float], Optional[float]]:
    raw = filters.get(key)
    if not isinstance(raw, list) or len(raw) != 2:
        return None, None
    return _safe_numeric(raw[0]), _safe_numeric(raw[1])


def _list_count(value: Any) -> float:
    if isinstance(value, list):
        return float(len(value))
    if isinstance(value, str) and value.startswith("{") and value.endswith("}"):
        cleaned = [part for part in value.strip("{}").split(",") if part]
        return float(len(cleaned))
    return 0.0


def _relative_gap(series: pd.Series, target: Optional[float]) -> pd.Series:
    if target is None or target <= 0:
        return pd.Series(0.0, index=series.index)
    numeric = pd.to_numeric(series, errors="coerce")
    return (numeric.fillna(target) - target).abs() / max(target, 1.0)


def _absolute_gap(series: pd.Series, target: Optional[float]) -> pd.Series:
    if target is None:
        return pd.Series(0.0, index=series.index)
    numeric = pd.to_numeric(series, errors="coerce")
    return (numeric.fillna(target) - target).abs()


def _normalize_property_pool(property_pool: pd.DataFrame) -> pd.DataFrame:
    pool = property_pool.copy()
    for column in [
        "assetType",
        "listingType",
        "propertyType",
        "brand",
        "model",
        "fuelType",
        "transmission",
        "city",
        "subcity",
        "region",
        "village",
        "price",
        "bedrooms",
        "bathrooms",
        "year",
        "area",
        "lat",
        "lng",
        "amenities",
    ]:
        if column not in pool.columns:
            pool[column] = None

    pool["listingTypePrimary"] = pool["listingType"].apply(_primary_listing_type)
    pool["amenitiesCount"] = pool["amenities"].apply(_list_count)

    for numeric_col in ["price", "bedrooms", "bathrooms", "year", "area", "lat", "lng"]:
        pool[numeric_col] = pd.to_numeric(pool[numeric_col], errors="coerce")

    return pool


def build_user_state(
    history_df: Optional[pd.DataFrame],
    profile_df: Optional[pd.DataFrame],
    search_df: Optional[pd.DataFrame],
    map_df: Optional[pd.DataFrame],
) -> Dict[str, Any]:
    state: Dict[str, Any] = {
        "marriageStatus": "",
        "kidsCount": 0.0,
        "historyCount": 0.0,
        "favoriteCount": 0.0,
        "applicationCount": 0.0,
        "transactionCount": 0.0,
        "viewCount": 0.0,
        "avgInteractedPrice": 0.0,
        "avgBedroomsViewed": 0.0,
        "avgBathroomsViewed": 0.0,
        "avgYearViewed": 0.0,
        "dominantAssetType": "",
        "dominantListingType": "",
        "dominantCity": "",
        "dominantSubcity": "",
        "dominantBrand": "",
        "dominantModel": "",
        "dominantPropertyType": "",
        "searchType": "",
        "searchListingIntent": "",
        "searchPropertyType": "",
        "searchBrand": "",
        "searchModel": "",
        "searchTransmission": "",
        "searchFuelType": "",
        "searchRegion": "",
        "searchCity": "",
        "searchSubcity": "",
        "searchPriceMin": 0.0,
        "searchPriceMax": 0.0,
        "searchBeds": 0.0,
        "searchBaths": 0.0,
        "searchYearMin": 0.0,
        "searchYearMax": 0.0,
        "searchAmenitiesCount": 0.0,
        "hasSearchFilters": 0.0,
        "hasMapIntent": 0.0,
        "hasProfileSignals": 0.0,
        "mapLat": None,
        "mapLng": None,
    }

    if profile_df is not None and not profile_df.empty:
        profile = profile_df.iloc[0]
        state["marriageStatus"] = _normalize_text(profile.get("marriageStatus"))
        state["kidsCount"] = _parse_kids_count(profile.get("kids"))
        state["hasProfileSignals"] = 1.0

    if history_df is not None and not history_df.empty:
        history = history_df.copy()
        if "listingType" in history.columns:
            history["listingTypePrimary"] = history["listingType"].apply(_primary_listing_type)
        else:
            history["listingTypePrimary"] = ""
        for numeric_col in ["price", "bedrooms", "bathrooms", "year"]:
            if numeric_col not in history.columns:
                history[numeric_col] = None
            history[numeric_col] = pd.to_numeric(history[numeric_col], errors="coerce")

        state["historyCount"] = float(len(history))
        state["favoriteCount"] = float((history["interaction_type"] == "FAVORITE").sum()) if "interaction_type" in history.columns else 0.0
        state["applicationCount"] = float((history["interaction_type"] == "APPLICATION").sum()) if "interaction_type" in history.columns else 0.0
        state["transactionCount"] = float((history["interaction_type"] == "TRANSACTION").sum()) if "interaction_type" in history.columns else 0.0
        state["viewCount"] = float((history["interaction_type"] == "VIEW").sum()) if "interaction_type" in history.columns else 0.0
        state["avgInteractedPrice"] = float(history["price"].dropna().mean()) if not history["price"].dropna().empty else 0.0
        state["avgBedroomsViewed"] = float(history["bedrooms"].dropna().mean()) if not history["bedrooms"].dropna().empty else 0.0
        state["avgBathroomsViewed"] = float(history["bathrooms"].dropna().mean()) if not history["bathrooms"].dropna().empty else 0.0
        state["avgYearViewed"] = float(history["year"].dropna().mean()) if not history["year"].dropna().empty else 0.0
        state["dominantAssetType"] = _safe_mode(history["assetType"]) if "assetType" in history.columns else ""
        state["dominantListingType"] = _safe_mode(history["listingTypePrimary"])
        state["dominantCity"] = _safe_mode(history["city"]) if "city" in history.columns else ""
        state["dominantSubcity"] = _safe_mode(history["subcity"]) if "subcity" in history.columns else ""
        state["dominantBrand"] = _safe_mode(history["brand"]) if "brand" in history.columns else ""
        state["dominantModel"] = _safe_mode(history["model"]) if "model" in history.columns else ""
        state["dominantPropertyType"] = _safe_mode(history["propertyType"]) if "propertyType" in history.columns else ""

    if search_df is not None and not search_df.empty:
        latest = search_df.iloc[0]
        filters = _to_filters(latest.get("filters"))
        state["searchType"] = _normalize_text(latest.get("searchType"))
        state["searchListingIntent"] = _extract_intent_value(filters, "listingType")
        state["searchPropertyType"] = _extract_intent_value(filters, "propertyType")
        state["searchBrand"] = _extract_intent_value(filters, "brand")
        state["searchModel"] = _extract_intent_value(filters, "model")
        state["searchTransmission"] = _extract_intent_value(filters, "transmission")
        state["searchFuelType"] = _extract_intent_value(filters, "fuelTech")
        state["searchRegion"] = _extract_intent_value(filters, "region")
        state["searchCity"] = _extract_intent_value(filters, "city")
        state["searchSubcity"] = _extract_intent_value(filters, "subCity")
        state["searchBeds"] = _extract_numeric_filter(filters, "beds") or 0.0
        state["searchBaths"] = _extract_numeric_filter(filters, "baths") or 0.0
        price_min, price_max = _extract_range(filters, "priceRange")
        year_min, year_max = _extract_range(filters, "year")
        state["searchPriceMin"] = price_min or 0.0
        state["searchPriceMax"] = price_max or 0.0
        state["searchYearMin"] = year_min or 0.0
        state["searchYearMax"] = year_max or 0.0
        state["searchAmenitiesCount"] = float(len(filters.get("amenities", []))) if isinstance(filters.get("amenities"), list) else 0.0
        state["hasSearchFilters"] = 1.0 if filters else 0.0

    if map_df is not None and not map_df.empty:
        recent_map = map_df.iloc[0]
        lat = _safe_numeric(recent_map.get("lat"))
        lng = _safe_numeric(recent_map.get("lng"))
        if lat is not None and lng is not None:
            state["mapLat"] = lat
            state["mapLng"] = lng
            state["hasMapIntent"] = 1.0

    return state


def build_feature_frame(property_pool: pd.DataFrame, user_state: Dict[str, Any]) -> pd.DataFrame:
    pool = _normalize_property_pool(property_pool)
    features = pd.DataFrame(index=pool.index)

    for column in [
        "assetType",
        "listingTypePrimary",
        "propertyType",
        "brand",
        "model",
        "fuelType",
        "transmission",
        "city",
        "subcity",
        "region",
        "village",
    ]:
        features[column] = pool[column].apply(_normalize_text)

    for column in [
        "marriageStatus",
        "dominantAssetType",
        "dominantListingType",
        "dominantCity",
        "dominantSubcity",
        "dominantBrand",
        "dominantModel",
        "dominantPropertyType",
        "searchType",
        "searchListingIntent",
        "searchPropertyType",
        "searchBrand",
        "searchModel",
        "searchTransmission",
        "searchFuelType",
        "searchRegion",
        "searchCity",
        "searchSubcity",
    ]:
        features[column] = user_state.get(column, "")

    for numeric_col in ["price", "bedrooms", "bathrooms", "year", "area", "lat", "lng", "amenitiesCount"]:
        features[numeric_col] = pd.to_numeric(pool[numeric_col], errors="coerce")

    for numeric_col in [
        "kidsCount",
        "historyCount",
        "favoriteCount",
        "applicationCount",
        "transactionCount",
        "viewCount",
        "avgInteractedPrice",
        "avgBedroomsViewed",
        "avgBathroomsViewed",
        "avgYearViewed",
        "searchPriceMin",
        "searchPriceMax",
        "searchBeds",
        "searchBaths",
        "searchYearMin",
        "searchYearMax",
        "searchAmenitiesCount",
        "hasSearchFilters",
        "hasMapIntent",
        "hasProfileSignals",
    ]:
        features[numeric_col] = float(user_state.get(numeric_col, 0.0) or 0.0)

    features["assetTypeMatch"] = (features["assetType"] == user_state.get("dominantAssetType", "")).astype(float)
    features["listingIntentMatch"] = (features["listingTypePrimary"] == user_state.get("searchListingIntent", "")).astype(float)
    features["propertyTypeMatch"] = (
        (features["propertyType"] == user_state.get("searchPropertyType", ""))
        | (features["propertyType"] == user_state.get("dominantPropertyType", ""))
    ).astype(float)
    features["brandMatch"] = (
        (features["brand"] == user_state.get("searchBrand", ""))
        | (features["brand"] == user_state.get("dominantBrand", ""))
    ).astype(float)
    features["modelMatch"] = (
        (features["model"] == user_state.get("searchModel", ""))
        | (features["model"] == user_state.get("dominantModel", ""))
    ).astype(float)
    features["transmissionMatch"] = (features["transmission"] == user_state.get("searchTransmission", "")).astype(float)
    features["fuelTypeMatch"] = (features["fuelType"] == user_state.get("searchFuelType", "")).astype(float)
    features["cityMatch"] = (
        (features["city"] == user_state.get("searchCity", ""))
        | (features["city"] == user_state.get("dominantCity", ""))
    ).astype(float)
    features["subcityMatch"] = (
        (features["subcity"] == user_state.get("searchSubcity", ""))
        | (features["subcity"] == user_state.get("dominantSubcity", ""))
    ).astype(float)
    features["regionMatch"] = (features["region"] == user_state.get("searchRegion", "")).astype(float)

    price_anchor = user_state.get("searchPriceMax") or user_state.get("avgInteractedPrice") or None
    if user_state.get("searchPriceMin") and user_state.get("searchPriceMax"):
        price_anchor = (user_state["searchPriceMin"] + user_state["searchPriceMax"]) / 2.0
    features["priceDiffRatio"] = _relative_gap(features["price"], price_anchor)

    bed_anchor = user_state.get("searchBeds") or user_state.get("avgBedroomsViewed") or None
    bath_anchor = user_state.get("searchBaths") or user_state.get("avgBathroomsViewed") or None
    year_anchor = None
    if user_state.get("searchYearMin") and user_state.get("searchYearMax"):
        year_anchor = (user_state["searchYearMin"] + user_state["searchYearMax"]) / 2.0
    elif user_state.get("avgYearViewed"):
        year_anchor = user_state["avgYearViewed"]

    features["bedroomGap"] = _absolute_gap(features["bedrooms"], bed_anchor)
    features["bathroomGap"] = _absolute_gap(features["bathrooms"], bath_anchor)
    features["yearGap"] = _absolute_gap(features["year"], year_anchor)

    map_lat = user_state.get("mapLat")
    map_lng = user_state.get("mapLng")
    if map_lat is None or map_lng is None:
        features["mapDistance"] = 0.0
    else:
        lat_gap = pd.to_numeric(pool["lat"], errors="coerce").fillna(map_lat) - map_lat
        lng_gap = pd.to_numeric(pool["lng"], errors="coerce").fillna(map_lng) - map_lng
        features["mapDistance"] = np.sqrt((lat_gap ** 2) + (lng_gap ** 2))

    for feature_name in MODEL_FEATURES:
        if feature_name not in features.columns:
            features[feature_name] = 0.0 if feature_name in NUMERIC_FEATURES else ""

    return features[MODEL_FEATURES]


def fetch_training_frames() -> Dict[str, pd.DataFrame]:
    interactions = query_to_dataframe(
        """
        SELECT
            'VIEW' AS interaction_type,
            v."userId",
            v."propertyId",
            v."viewedAt" AS "createdAt",
            p."assetType",
            p."listingType",
            p.price,
            p.bedrooms,
            p.bathrooms,
            p."propertyType",
            p.brand,
            p.model,
            p.year,
            p."fuelType",
            p.transmission,
            l.city,
            l.subcity,
            l.region,
            l.village
        FROM "PropertyView" v
        JOIN "Property" p ON p.id = v."propertyId"
        LEFT JOIN "Location" l ON l.id = p."locationId"

        UNION ALL

        SELECT
            'FAVORITE' AS interaction_type,
            f."userId",
            f."propertyId",
            f."createdAt",
            p."assetType",
            p."listingType",
            p.price,
            p.bedrooms,
            p.bathrooms,
            p."propertyType",
            p.brand,
            p.model,
            p.year,
            p."fuelType",
            p.transmission,
            l.city,
            l.subcity,
            l.region,
            l.village
        FROM "Favorite" f
        JOIN "Property" p ON p.id = f."propertyId"
        LEFT JOIN "Location" l ON l.id = p."locationId"

        UNION ALL

        SELECT
            'APPLICATION' AS interaction_type,
            a."customerId" AS "userId",
            a."propertyId",
            a."createdAt",
            p."assetType",
            p."listingType",
            p.price,
            p.bedrooms,
            p.bathrooms,
            p."propertyType",
            p.brand,
            p.model,
            p.year,
            p."fuelType",
            p.transmission,
            l.city,
            l.subcity,
            l.region,
            l.village
        FROM "Application" a
        JOIN "Property" p ON p.id = a."propertyId"
        LEFT JOIN "Location" l ON l.id = p."locationId"

        UNION ALL

        SELECT
            'TRANSACTION' AS interaction_type,
            t."payerId" AS "userId",
            t."propertyId",
            t."createdAt",
            p."assetType",
            p."listingType",
            p.price,
            p.bedrooms,
            p.bathrooms,
            p."propertyType",
            p.brand,
            p.model,
            p.year,
            p."fuelType",
            p.transmission,
            l.city,
            l.subcity,
            l.region,
            l.village
        FROM "Transaction" t
        JOIN "Property" p ON p.id = t."propertyId"
        LEFT JOIN "Location" l ON l.id = p."locationId"
        WHERE t.status = 'COMPLETED'
        """
    )

    profiles = query_to_dataframe(
        """
        SELECT id AS "userId", kids, "marriageStatus"
        FROM "User"
        """
    )

    searches = query_to_dataframe(
        """
        SELECT "userId", "searchType", filters, "createdAt"
        FROM "SearchFilterLog"
        ORDER BY "createdAt" DESC
        """
    )

    map_history = query_to_dataframe(
        """
        SELECT "userId", lat, lng, zoom, "createdAt"
        FROM "MapInteraction"
        ORDER BY "createdAt" DESC
        """
    )

    properties = get_all_properties(include_images=False)

    return {
        "interactions": interactions,
        "profiles": profiles,
        "searches": searches,
        "maps": map_history,
        "properties": properties,
    }


def build_training_dataset(
    negative_ratio: int = 2,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    frames = fetch_training_frames()
    interactions = frames["interactions"]
    profiles = frames["profiles"]
    searches = frames["searches"]
    map_history = frames["maps"]
    properties = _normalize_property_pool(frames["properties"])

    metadata: Dict[str, Any] = {
        "schema_version": FEATURE_SCHEMA_VERSION,
        "positive_pairs": 0,
        "negative_pairs": 0,
        "unique_users": 0,
        "unique_properties": 0,
        "status": "empty",
    }

    if interactions.empty or properties.empty:
        return pd.DataFrame(), metadata

    interactions = interactions.copy()
    interactions["label"] = interactions["interaction_type"].map(INTERACTION_LABELS).fillna(0.0)
    grouped = interactions.groupby(["userId", "propertyId"], as_index=False)["label"].sum()

    metadata["positive_pairs"] = int(len(grouped))
    metadata["unique_users"] = int(grouped["userId"].nunique())
    metadata["unique_properties"] = int(grouped["propertyId"].nunique())

    property_index = properties.set_index("id", drop=False)
    profile_lookup = (
        {user_id: group.reset_index(drop=True) for user_id, group in profiles.groupby("userId")}
        if not profiles.empty and "userId" in profiles.columns
        else {}
    )
    search_lookup = (
        {user_id: group.reset_index(drop=True) for user_id, group in searches.groupby("userId")}
        if not searches.empty and "userId" in searches.columns
        else {}
    )
    map_lookup = (
        {user_id: group.reset_index(drop=True) for user_id, group in map_history.groupby("userId")}
        if not map_history.empty and "userId" in map_history.columns
        else {}
    )
    history_lookup = (
        {user_id: group.reset_index(drop=True) for user_id, group in interactions.groupby("userId")}
        if "userId" in interactions.columns
        else {}
    )

    positive_sets = grouped.groupby("userId")["propertyId"].apply(set).to_dict()
    all_ids = properties["id"].tolist()
    rng = np.random.default_rng(random_state)
    rows = []

    for row in grouped.itertuples(index=False):
        if row.propertyId not in property_index.index:
            continue
        history_df = history_lookup.get(row.userId, pd.DataFrame())
        user_state = build_user_state(
            history_df,
            profile_lookup.get(row.userId),
            search_lookup.get(row.userId),
            map_lookup.get(row.userId),
        )
        feature_row = build_feature_frame(property_index.loc[[row.propertyId]], user_state).iloc[0].to_dict()
        feature_row["userId"] = row.userId
        feature_row["propertyId"] = row.propertyId
        feature_row["label"] = float(row.label)
        rows.append(feature_row)

    negative_pairs = 0
    for user_id, positive_ids in positive_sets.items():
        user_state = build_user_state(
            history_lookup.get(user_id, pd.DataFrame()),
            profile_lookup.get(user_id),
            search_lookup.get(user_id),
            map_lookup.get(user_id),
        )
        candidate_pool = properties
        preferred_asset = user_state.get("dominantAssetType")
        if preferred_asset:
            narrowed = properties[properties["assetType"].apply(_normalize_text) == preferred_asset]
            if not narrowed.empty:
                candidate_pool = narrowed

        available_ids = [prop_id for prop_id in candidate_pool["id"].tolist() if prop_id not in positive_ids]
        if not available_ids:
            available_ids = [prop_id for prop_id in all_ids if prop_id not in positive_ids]
        if not available_ids:
            continue

        target_count = min(len(available_ids), max(1, len(positive_ids) * negative_ratio))
        sampled_ids = rng.choice(np.array(available_ids, dtype=object), size=target_count, replace=False)
        negative_frame = build_feature_frame(property_index.loc[list(sampled_ids)], user_state)

        for prop_id, feature_values in zip(sampled_ids.tolist(), negative_frame.to_dict("records")):
            feature_values["userId"] = user_id
            feature_values["propertyId"] = prop_id
            feature_values["label"] = 0.0
            rows.append(feature_values)
            negative_pairs += 1

    metadata["negative_pairs"] = negative_pairs
    if not rows:
        return pd.DataFrame(), metadata

    training_df = pd.DataFrame(rows)
    metadata["status"] = "ready"
    return training_df, metadata


class RecommendationMLService:
    def __init__(self) -> None:
        self.model = None
        self.metadata: Optional[Dict[str, Any]] = None
        self.last_load_error: Optional[str] = None
        self.reload_model()

    def reload_model(self) -> None:
        self.model = None
        self.metadata = None
        self.last_load_error = None

        if not MODEL_PATH.exists() or not META_PATH.exists():
            self.last_load_error = "Recommendation ranker has not been trained yet."
            return

        try:
            with META_PATH.open("r", encoding="utf-8") as meta_file:
                metadata = json.load(meta_file)
            if metadata.get("schema_version") != FEATURE_SCHEMA_VERSION:
                self.last_load_error = "Recommendation ranker metadata is from an older schema."
                return

            self.model = joblib.load(MODEL_PATH)
            self.metadata = metadata
        except Exception as exc:  # pragma: no cover - defensive load guard
            self.model = None
            self.metadata = None
            self.last_load_error = str(exc)

    def is_ready(self) -> bool:
        return self.model is not None and self.metadata is not None

    def get_status(self) -> Dict[str, Any]:
        return {
            "ready": self.is_ready(),
            "schema_version": FEATURE_SCHEMA_VERSION,
            "model_path": str(MODEL_PATH),
            "metadata_path": str(META_PATH),
            "reason": self.last_load_error,
            "metadata": self.metadata,
        }

    def score_property_pool(
        self,
        property_pool: pd.DataFrame,
        history_df: Optional[pd.DataFrame],
        profile_df: Optional[pd.DataFrame],
        search_df: Optional[pd.DataFrame],
        map_df: Optional[pd.DataFrame],
    ) -> Optional[pd.DataFrame]:
        if not self.is_ready():
            return None

        if property_pool.empty:
            return property_pool.copy()

        user_state = build_user_state(history_df, profile_df, search_df, map_df)
        features = build_feature_frame(property_pool, user_state)

        scored = property_pool.copy()
        predictions = self.model.predict(features)
        scored["score"] = predictions.astype(float)
        scored["ml_score"] = scored["score"]
        scored["score_breakdown"] = [
            {"ml_ranker": round(float(score), 4)} for score in scored["score"]
        ]
        return scored
