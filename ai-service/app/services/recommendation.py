import os
import pandas as pd
import numpy as np
from app.database import (
    get_all_properties,
    get_user_history,
    get_user_profile, 
    get_user_search_history, 
    get_user_map_history
)
from app.services.recommendation_ml import RecommendationMLService

class RecommendationService:
    def __init__(self):
        self.ml_service = RecommendationMLService()
        self.engine_mode = os.getenv("RECOMMENDATION_ENGINE_MODE", "auto").lower()

    def reload_model(self):
        self.ml_service.reload_model()

    def get_recommendations(self, history, limit=15):
        """
        Compatibility path for callers that provide manual interaction history
        instead of a stored user ID.
        """
        history_df = self._normalize_manual_history(history)
        property_pool = get_all_properties()
        if property_pool.empty:
            return []

        if history_df.empty:
            return self.get_general_recommendations(limit)

        ml_results = self._get_ml_recommendations(
            property_pool=property_pool,
            history_df=history_df,
            profile_df=pd.DataFrame(),
            search_df=pd.DataFrame(),
            map_df=pd.DataFrame(),
            limit=limit,
        )
        if ml_results:
            return ml_results

        return self._compute_weighted_recommendations(history_df, property_pool, limit)

    def get_recommendations_for_user(self, user_id, limit=15):
        """
        Recommendation engine with a heuristic fallback and an optional ML ranker.
        """
        history_df = get_user_history(user_id)
        profile_df = get_user_profile(user_id)
        search_df = get_user_search_history(user_id)
        map_df = get_user_map_history(user_id)
        
        # We fetch property pool once
        property_pool = get_all_properties()
        if property_pool.empty:
            return []

        # If user has no history or search intent, we provide general.
        if history_df.empty and search_df.empty and map_df.empty:
            return self.get_general_recommendations(limit)

        ml_results = self._get_ml_recommendations(
            property_pool=property_pool,
            history_df=history_df,
            profile_df=profile_df,
            search_df=search_df,
            map_df=map_df,
            limit=limit,
        )
        if ml_results:
            return ml_results

        results = self._compute_weighted_recommendations(
            history_df, 
            property_pool, 
            limit,
            user_profile=profile_df,
            search_history=search_df,
            map_history=map_df
        )
        return results

    def _normalize_manual_history(self, history):
        rows = []
        now = pd.Timestamp.now(tz="UTC").strftime("%Y-%m-%dT%H:%M:%SZ")

        for item in history or []:
            if hasattr(item, "model_dump"):
                raw = item.model_dump()
            elif hasattr(item, "dict"):
                raw = item.dict()
            else:
                raw = dict(item)

            location = raw.get("location")
            rows.append({
                "interaction_type": "VIEW",
                "propertyId": raw.get("propertyId"),
                "assetType": raw.get("assetType"),
                "listingType": raw.get("listingType"),
                "price": raw.get("price"),
                "bedrooms": raw.get("bedrooms"),
                "bathrooms": raw.get("bathrooms"),
                "propertyType": raw.get("propertyType"),
                "brand": raw.get("brand"),
                "model": raw.get("model"),
                "year": raw.get("year"),
                "fuelType": raw.get("fuelType"),
                "transmission": raw.get("transmission"),
                "city": location,
                "subcity": location,
                "region": None,
                "village": None,
                "createdAt": now,
            })

        return pd.DataFrame(rows)

    def _should_try_ml(self):
        return self.engine_mode in {"auto", "ml", "hybrid"}

    def _get_ml_recommendations(self, property_pool, history_df, profile_df, search_df, map_df, limit=15):
        if not self._should_try_ml():
            return []

        scored_pool = self.ml_service.score_property_pool(
            property_pool=property_pool,
            history_df=history_df,
            profile_df=profile_df,
            search_df=search_df,
            map_df=map_df,
        )
        if scored_pool is None or scored_pool.empty:
            return []

        ranked = scored_pool.copy()
        if not history_df.empty and "propertyId" in history_df.columns:
            ranked = ranked[~ranked["id"].isin(history_df["propertyId"].dropna().unique())]
        if ranked.empty:
            return []

        sort_fields = ["score"]
        ascending = [False]
        if "createdAt" in ranked.columns:
            sort_fields.append("createdAt")
            ascending.append(False)

        ranked = ranked.sort_values(by=sort_fields, ascending=ascending).head(limit).copy()
        ranked["propertyId"] = ranked["id"]
        return self._format_results(ranked.to_dict("records"))

    def _compute_weighted_recommendations(self, history, pool, limit=15, user_profile=None, search_history=None, map_history=None, already_initialized=False):
        """
        Multi-dimensional weighted scoring with granular breakdown.
        """
        weights = {
            'TRANSACTION': 3.0,
            'APPLICATION': 2.0,
            'FAVORITE': 1.0,
            'VIEW': 0.2
        }

        # Use pool from parent call
        property_pool = pool
        
        if not already_initialized:
            property_pool['score'] = 0.0
            property_pool['score_breakdown'] = [{} for _ in range(len(property_pool))]
        
        def add_to_breakdown(idx, component, value):
            current = property_pool.at[idx, 'score_breakdown']
            current[component] = round(current.get(component, 0) + value, 3)
            property_pool.at[idx, 'score_breakdown'] = current

        now = pd.Timestamp.now(tz='UTC')

        # 1. Process Interaction History with Temporal Decay
        if not history.empty:
            history['createdAt'] = pd.to_datetime(history['createdAt'], utc=True)
            history['age_days'] = (now - history['createdAt']).dt.total_seconds() / (24 * 3600)
            history['decay'] = np.exp(-history['age_days'] / 14.0)
            
            for _, interaction in history.iterrows():
                decay_factor = interaction['decay']
                weight = weights.get(interaction['interaction_type'], 0.1) * decay_factor
                
                # 1.1 Asset Type Match
                matches = property_pool[property_pool['assetType'] == interaction['assetType']].index
                property_pool.loc[matches, 'score'] += 0.3 * weight
                for idx in matches: add_to_breakdown(idx, 'asset_type_match', 0.3 * weight)
                
                # 1.2 Location Hierarchy Match (Subcity, City, Region, Village)
                if interaction.get('subcity'):
                    matches = property_pool[property_pool['subcity'] == interaction['subcity']].index
                    property_pool.loc[matches, 'score'] += 0.2 * weight
                    for idx in matches: add_to_breakdown(idx, 'location_affinity', 0.2 * weight)
                
                if interaction.get('city'):
                    matches = property_pool[property_pool['city'] == interaction['city']].index
                    property_pool.loc[matches, 'score'] += 0.15 * weight
                    for idx in matches: add_to_breakdown(idx, 'regional_affinity', 0.15 * weight)

                if interaction.get('village'):
                    matches = property_pool[property_pool['village'] == interaction['village']].index
                    property_pool.loc[matches, 'score'] += 0.3 * weight # User update: 0.3
                    for idx in matches: add_to_breakdown(idx, 'local_niche_affinity', 0.3 * weight)
                
                # 1.3 Property Specifics Match (Bedrooms, Type)
                if interaction['assetType'] == 'HOME':
                    if interaction.get('bedrooms'):
                        matches = property_pool[property_pool['bedrooms'] == interaction['bedrooms']].index
                        property_pool.loc[matches, 'score'] += 0.3 * weight
                        for idx in matches: add_to_breakdown(idx, 'bedroom_preference', 0.3 * weight)
                    
                    if interaction.get('propertyType'):
                        matches = property_pool[property_pool['propertyType'] == interaction['propertyType']].index
                        property_pool.loc[matches, 'score'] += 0.2 * weight
                        for idx in matches: add_to_breakdown(idx, 'type_affinity', 0.2 * weight)
                
                # 1.4 Vehicle Specifics Match (Brand, Model, Transmission)
                if interaction['assetType'] == 'CAR':
                    if interaction.get('brand'):
                        search_brand = interaction['brand'].lower()
                        matches = property_pool[property_pool['brand'].str.lower().str.contains(search_brand, na=False)].index
                        property_pool.loc[matches, 'score'] += 0.3 * weight
                        for idx in matches: add_to_breakdown(idx, 'brand_intent', 0.3 * weight)
                    
                    if interaction.get('model'):
                        search_model = interaction['model'].lower()
                        matches = property_pool[property_pool['model'].str.lower().str.contains(search_model, na=False)].index
                        property_pool.loc[matches, 'score'] += 0.4 * weight
                        for idx in matches: add_to_breakdown(idx, 'model_intent', 0.4 * weight)
                    
                    if interaction.get('transmission'):
                        matches = property_pool[property_pool['transmission'] == interaction['transmission']].index
                        property_pool.loc[matches, 'score'] += 0.2 * weight
                        for idx in matches: add_to_breakdown(idx, 'drive_experience', 0.2 * weight)
                    
                    if interaction.get('year'):
                        matches = property_pool[property_pool['year'] == interaction['year']].index
                        property_pool.loc[matches, 'score'] += 0.2 * weight
                        for idx in matches: add_to_breakdown(idx, 'era_preference', 0.2 * weight)

                # 1.5 Price Proximity
                if interaction.get('price') and interaction['price'] > 0:
                    price_diff_ratio = (property_pool['price'] - interaction['price']).abs() / interaction['price']
                    matches = property_pool[price_diff_ratio < 0.25].index
                    property_pool.loc[matches, 'score'] += 0.3 * weight
                    for idx in matches: add_to_breakdown(idx, 'price_proximity', 0.3 * weight)

        # 2. Demographic Boost (NOW DYNAMIC & KID-CENTRIC)
        if user_profile is not None and not user_profile.empty:
            profile = user_profile.iloc[0]
            kids_str = str(profile.get('kids', 'none')).lower().replace('+', '')
            
            # Parse kids count (e.g., 'none' -> 0, '1' -> 1, '3+' -> 3)
            kids_count = 0
            if kids_str not in ['none', 'nan', 'null', '']:
                try:
                    kids_count = int(kids_str)
                except: pass

            if kids_count > 0:
                # Rule: Boost properties with Bedroom Count >= Kid Count (e.g., 2 kids -> 2+ beds)
                matches_beds = property_pool[property_pool['bedrooms'] >= kids_count].index
                property_pool.loc[matches_beds, 'score'] += 0.6
                for idx in matches_beds: add_to_breakdown(idx, 'family_size_boost', 0.6)

        # 3. Search Intent Boost (SMARTER PERSISTENCE)
        if search_history is not None and not search_history.empty:
            history_reset = search_history.reset_index(drop=True)
            
            # Active Tab / Asset Match Boost (Only if user has performed a REAL search)
            if not history_reset.empty:
                first_search = history_reset.iloc[0]
                filters = first_search.get('filters', {})
                
                # Check for "Real" filter activity
                has_real_filters = False
                for k, v in filters.items():
                    if k in ['searchType', 'sort']: continue # Meta filters don't count
                    if v and str(v).lower() not in ['none', '', 'any', 'all', '[]'] and v != [1990, 2025] and v != [None, None]:
                        has_real_filters = True
                        break
                
                if has_real_filters:
                    active_search_type = first_search.get('searchType', 'any').lower()
                    if active_search_type == 'property':
                        matches = property_pool[property_pool['assetType'] == 'HOME'].index
                        property_pool.loc[matches, 'score'] += 0.2
                        for idx in matches: add_to_breakdown(idx, 'active_tab_intent', 0.2)
                    elif active_search_type == 'vehicle':
                        matches = property_pool[property_pool['assetType'] == 'CAR'].index
                        property_pool.loc[matches, 'score'] += 0.2
                        for idx in matches: add_to_breakdown(idx, 'active_tab_intent', 0.2)

            # Step A: Scan history to identify ALL specific intents for each tray
            intent_map = {
                'home_listing_intent': 'listingType',
                'car_listing_intent': 'listingType',
                'home_bedroom_preference': 'beds',
                'home_bath_preference': 'baths',
                'home_type_affinity': 'propertyType',
                'car_brand_intent': 'brand',
                'car_model_intent': 'model',
                'car_fuel_tech_intent': 'fuelTech',
                'car_drive_experience': 'transmission',
                'region_affinity': 'region',
                'city_affinity': 'city',
                'subcity_affinity': 'subCity',
                'local_niche_affinity': 'village'
            }
            
            all_specifics = {} # category -> { (val_lookup, search_type) -> (val, index) }
            
            history_reset = search_history.reset_index(drop=True)
            for index, search in history_reset.iterrows():
                filters = search.get('filters', {})
                st = search.get('searchType', 'any').lower()
                for cat, f_key in intent_map.items():
                    val = filters.get(f_key)
                    if val and str(val).lower() not in ['none', '', 'any'] and val != [1990, 2025] and val != []:
                        # Skip if category-mismatch (Strict Category Isolation)
                        if cat.startswith('home_') and st != 'property': continue
                        if cat.startswith('car_') and st != 'vehicle': continue

                        if cat not in all_specifics: 
                            all_specifics[cat] = {}
                        
                        val_lookup = str(val).lower()
                        
                        # Universal vs Category-Specific Intents
                        # Geographic intents should be universal (don't double boost)
                        # Asset-specific intents (listingType, brands, etc) should be category-specific
                        geographic_cats = ['region_affinity', 'city_affinity', 'subcity_affinity', 'local_niche_affinity']
                        
                        if cat in geographic_cats:
                            intent_key = val_lookup # Universal (prevents doubling)
                        else:
                            intent_key = (val_lookup, st) # Category-specific (prevents overwriting)
                        
                        if intent_key not in all_specifics[cat]: 
                            # For universal keys, we store the data in the same format for consistency
                            all_specifics[cat][intent_key] = (val, index, st)

            # Step B: Apply Boosts using "Intent Anchoring" (Relative Category Age)
            # This ensures intent ONLY decays when the specific category is changed to something else.
            decay_base = 0.98
            
            flattened_specifics = []
            for cat, values_dict in all_specifics.items():
                for intent_key, data in values_dict.items():
                    # Handle both universal (string) and category-specific (tuple) keys
                    val_lookup = intent_key[0] if isinstance(intent_key, tuple) else intent_key
                    search_type = intent_key[1] if isinstance(intent_key, tuple) else data[2]
                    flattened_specifics.append((cat, val_lookup, data[0], data[1], search_type))

            for cat, val_lookup, val, index, search_type in flattened_specifics:
                f_key = intent_map[cat]

                # Calculate Relative Age: How many times has THIS category been set to a DIFFERENT
                # specific value since? 
                # Category-Specific (Listing, etc): ONLY count searches of the SAME asset type.
                # Universal (Geographic): Count searches of ANY asset type.
                geographic_cats = ['region_affinity', 'city_affinity', 'subcity_affinity', 'local_niche_affinity']
                is_universal = cat in geographic_cats
                
                relative_age = 0
                aging_events = []
                for i in range(index):
                    hist_search = history_reset.iloc[i]
                    hist_st = str(hist_search.get('searchType', 'any')).lower()
                    
                    # For non-universal intents, only age against the same category
                    if not is_universal and hist_st != search_type:
                        continue
                    
                    hist_val = hist_search.get('filters', {}).get(f_key, 'any')
                    
                    # Robust reset detection
                    is_reset = hist_val in [None, '', 'any', 'Any', []] or hist_val == [1990, 2025]
                    
                    # Robust Comparison (Handles both strings and lists)
                    def normalize_to_set(v):
                        if isinstance(v, list): return set(str(i).lower() for i in v)
                        return {str(v).lower()}
                    
                    hist_val_set = normalize_to_set(hist_val)
                    val_lookup_set = normalize_to_set(val) # Using the original val for better type check
                    
                    # Only age the intent if the user picks a DIFFERENT specific value in the same category
                    # We check if the NEW search has ANY overlap with the OLD intent.
                    # If they are completely different, then it's an aging event.
                    if not is_reset and not (hist_val_set & val_lookup_set):
                        relative_age += 1
                        aging_events.append(str(hist_val))
                
                # Final weight: Based on how many times the user "moved away" from this intent
                weight = (decay_base ** relative_age)

                # 3.1 Listing Type (Strictly divided by category)
                if cat == 'home_listing_intent':
                    lt = str(val).upper()
                    if isinstance(val, list) and len(val) > 0: lt = str(val[0]).upper()
                    
                    search_terms = [lt]
                    if lt == 'BUY': search_terms.append('SALE')
                    if lt == 'SALE': search_terms.append('BUY')
                    
                    def check_home_listing(row):
                        if row['assetType'] != 'HOME': return False
                        listing_vals = [str(i).upper() for i in row['listingType']] if isinstance(row['listingType'], list) else [str(row['listingType']).upper()]
                        return any(term in listing_vals for term in search_terms)

                    matches = property_pool[property_pool.apply(check_home_listing, axis=1)].index
                    boost = 2.0 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'home_listing_intent', boost)

                if cat == 'car_listing_intent':
                    lt = str(val).upper()
                    if isinstance(val, list) and len(val) > 0: lt = str(val[0]).upper()
                    
                    search_terms = [lt]
                    if lt == 'BUY': search_terms.append('SALE')
                    if lt == 'SALE': search_terms.append('BUY')
                    
                    def check_car_listing(row):
                        if row['assetType'] != 'CAR': return False
                        listing_vals = [str(i).upper() for i in row['listingType']] if isinstance(row['listingType'], list) else [str(row['listingType']).upper()]
                        return any(term in listing_vals for term in search_terms)

                    matches = property_pool[property_pool.apply(check_car_listing, axis=1)].index
                    boost = 2.0 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'listing_intent', boost)

                # 3.2 Property Specifics
                if cat == 'home_bedroom_preference':
                    try:
                        beds_val = str(val)
                        matches = []
                        if '+' in beds_val:
                            min_beds = int(beds_val.replace('+', ''))
                            matches = property_pool[(property_pool['assetType'] == 'HOME') & (property_pool['bedrooms'] >= min_beds)].index
                        else:
                            target_beds = int(beds_val)
                            matches = property_pool[(property_pool['assetType'] == 'HOME') & (property_pool['bedrooms'] == target_beds)].index
                        
                        boost = 0.6 * weight
                        property_pool.loc[matches, 'score'] += boost
                        for idx in matches: add_to_breakdown(idx, 'bedroom_preference', boost)
                    except: pass

                if cat == 'home_bath_preference':
                    try:
                        baths_val = str(val)
                        matches = []
                        if '+' in baths_val:
                            min_baths = int(baths_val.replace('+', ''))
                            matches = property_pool[(property_pool['assetType'] == 'HOME') & (property_pool['bathrooms'] >= min_baths)].index
                        else:
                            target_baths = int(baths_val)
                            matches = property_pool[(property_pool['assetType'] == 'HOME') & (property_pool['bathrooms'] == target_baths)].index
                        
                        boost = 0.2 * weight
                        property_pool.loc[matches, 'score'] += boost
                        for idx in matches: add_to_breakdown(idx, 'bath_preference', boost)
                    except: pass

                if cat == 'home_type_affinity':
                    target_type = str(val).lower().strip()
                    matches = property_pool[(property_pool['assetType'] == 'HOME') & (property_pool['propertyType'].str.lower().str.strip() == target_type)].index
                    boost = 0.9 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'type_affinity', boost)

                # 3.3 Vehicle Specifics
                if cat == 'car_brand_intent':
                    search_brand = str(val).lower()
                    matches = property_pool[(property_pool['assetType'] == 'CAR') & (property_pool['brand'].str.lower().str.contains(search_brand, na=False))].index
                    boost = 0.8 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'brand_intent', boost)

                if cat == 'car_model_intent':
                    search_model = str(val).lower()
                    matches = property_pool[(property_pool['assetType'] == 'CAR') & (property_pool['model'].str.lower().str.contains(search_model, na=False))].index
                    boost = 0.4 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'model_intent', boost)

                if cat == 'car_fuel_tech_intent':
                    target_fuel = str(val).lower()
                    matches = property_pool[(property_pool['assetType'] == 'CAR') & (property_pool['fuelType'].str.lower() == target_fuel)].index
                    boost = 0.5 * weight # UP from 0.4 - EV vs Gas is a hard infrastructural requirement
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'fuel_tech_intent', boost)

                if cat == 'car_drive_experience':
                    target_trans = str(val).lower()
                    matches = property_pool[(property_pool['assetType'] == 'CAR') & (property_pool['transmission'].str.lower() == target_trans)].index
                    boost = 0.5 * weight # UP from 0.4 - Manual vs Auto is often a strict skill barrier
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'drive_experience', boost)

                # 3.4 Geographical Intent (Anchored)
                if cat == 'region_affinity':
                    target = str(val).lower().strip()
                    matches = property_pool[property_pool['region'].str.lower().str.strip() == target].index
                    boost = 0.2 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'region_intent', boost)
                
                if cat == 'local_niche_affinity':
                    target = str(val).lower().strip()
                    matches = property_pool[property_pool['village'].str.lower().str.strip() == target].index
                    boost = 1.02 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'local_niche_intent', boost)

                if cat == 'city_affinity':
                    target = str(val).lower().strip()
                    matches = property_pool[property_pool['city'].str.lower().str.strip() == target].index
                    boost = 0.8 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'city_intent', boost)

                if cat == 'subcity_affinity':
                    target = str(val).lower().strip()
                    matches = property_pool[property_pool['subcity'].str.lower().str.strip() == target].index
                    boost = 0.8 * weight
                    property_pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'subcity_intent', boost)

            # 3.4 Era Preference (Asset Type Isolated - CAR ONLY)
            for index, search in history_reset.iterrows():
                st_current = str(search.get('searchType', 'any')).lower()
                if st_current != 'vehicle': continue # Era preference only from car searches
                
                filters = search.get('filters', {})
                if filters.get('year') and isinstance(filters['year'], list) and len(filters['year']) == 2:
                    y_range = filters['year']
                    if not (y_range[0] == 1990 and y_range[1] == 2025):
                        # Filter for CARS within the year range
                        matches = property_pool[
                            (property_pool['assetType'] == 'CAR') & 
                            (property_pool['year'] >= y_range[0]) & 
                            (property_pool['year'] <= y_range[1])
                        ].index
                        
                        if len(matches) == 0: continue

                        # Calculate relative age (Category Isolated)
                        rel_age_year = 0
                        for i in range(index):
                            h_search = history_reset.iloc[i]
                            h_st = str(h_search.get('searchType', 'any')).lower()
                            if h_st != 'vehicle': continue
                            
                            h_year = h_search.get('filters', {}).get('year', [1990, 2025])
                            # FIX: Ignore default/reset year range [1990, 2025]
                            is_reset_year = (h_year == [1990, 2025] or h_year is None)
                            if not is_reset_year and h_year != y_range:
                                rel_age_year += 1
                        
                        boost = 0.6 * (decay_base ** rel_age_year)
                        property_pool.loc[matches, 'score'] += boost
                        for idx in matches: add_to_breakdown(idx, 'era_preference', boost)
                        break

            # 3.4 Price Range Intent (Power Filter - Asset Type Isolated)
            for st_target in ['property', 'vehicle']:
                for index, search in history_reset.iterrows():
                    st_current = str(search.get('searchType', 'any')).lower()
                    if st_current != st_target: continue
                    
                    p_range = search.get('filters', {}).get('priceRange')
                    if p_range and isinstance(p_range, list) and len(p_range) == 2:
                        p_min, p_max = p_range
                        if p_min is not None or p_max is not None:
                            # Calculate relative age (Category Isolated)
                            rel_age_price = 0
                            for i in range(index):
                                h_search = history_reset.iloc[i]
                                h_st = str(h_search.get('searchType', 'any')).lower()
                                if h_st != st_target: continue
                                
                                h_price = h_search.get('filters', {}).get('priceRange', [None, None])
                                if h_price != p_range and h_price != [None, None]:
                                    rel_age_price += 1
                            
                            # Match only the correct asset type
                            asset_type_map = {'property': 'HOME', 'vehicle': 'CAR'}
                            target_asset = asset_type_map[st_target]
                            
                            query = (property_pool['assetType'] == target_asset)
                            if p_min is not None: query &= (property_pool['price'] >= p_min)
                            if p_max is not None: query &= (property_pool['price'] <= p_max)
                            
                            matches = property_pool[query].index
                            boost = 1.2 * (decay_base ** rel_age_price)
                            property_pool.loc[matches, 'score'] += boost
                            display_key = f"{'home' if st_target == 'property' else 'car'}_price_range"
                            for idx in matches: add_to_breakdown(idx, display_key, boost)
                            break # Found latest price intent for this asset type


            # 3.4 Amenities (Intent Anchored - Category Isolated)
            all_amenities_found = {} # amenity_name -> (index of latest presence, st)
            for index, search in history_reset.iterrows():
                ams = search.get('filters', {}).get('amenities', [])
                st = str(search.get('searchType', 'any')).lower()
                if ams:
                    for a in ams:
                        if a not in all_amenities_found:
                            all_amenities_found[a] = (index, st)
            
            for amenity, data in all_amenities_found.items():
                latest_idx, st_target = data
                # Relative age: How many times since then has it been MISSING?
                # ONLY count searches in the SAME asset category.
                rel_age_am = 0
                target_am = amenity.lower()
                for i in range(latest_idx):
                    hist_search = history_reset.iloc[i]
                    hist_st = str(hist_search.get('searchType', 'any')).lower()
                    
                    # CATEGORY ISOLATION: A home search doesn't age a car feature
                    if hist_st != st_target: continue
                    
                    hist_filters = hist_search.get('filters', {})
                    hist_amenities_list = hist_filters.get('amenities', [])
                    
                    # If the user didn't specify ANY amenities in this search, skip decay (neutral exploration)
                    if not hist_amenities_list:
                        continue
                        
                    hist_amenities = [str(a).lower() for a in hist_amenities_list]
                    if target_am not in hist_amenities:
                        rel_age_am += 1
                
                # Boost only the correct asset type pool
                asset_type_map = {'property': 'HOME', 'vehicle': 'CAR'}
                target_asset = asset_type_map[st_target]
                
                matches = property_pool[
                    (property_pool['assetType'] == target_asset) & 
                    (property_pool['amenities'].apply(lambda x: any(target_am == str(a).lower() for a in x) if isinstance(x, list) else False))
                ].index
                
                boost = 0.1 * (decay_base ** rel_age_am)
                property_pool.loc[matches, 'score'] += boost
                for idx in matches: add_to_breakdown(idx, f'amenity_{target_am}', boost)

        # 4. Map Intent Boost
        if map_history is not None and not map_history.empty:
            recent_map = map_history.iloc[0]
            lat_dist = (property_pool['lat'] - recent_map['lat']).abs()
            lng_dist = (property_pool['lng'] - recent_map['lng']).abs()
            matches = property_pool[(lat_dist < 0.05) & (lng_dist < 0.05)].index
            property_pool.loc[matches, 'score'] += 0.4
            for idx in matches: add_to_breakdown(idx, 'map_region_affinity', 0.4)

        # Clean Pool
        if not history.empty:
            history_ids = history['propertyId'].unique()
            property_pool = property_pool[~property_pool['id'].isin(history_ids)]

        # Sort and return
        recommendations = property_pool.sort_values(by='score', ascending=False).head(limit)
        # Keep id but also provide propertyId as an alias for compatibility
        results = recommendations.copy()
        results['propertyId'] = results['id']
        return self._format_results(results.to_dict('records'))

    def _format_results(self, results):
        """Standardize the nesting of location and image data for the frontend."""
        for r in results:
            # Nest location data
            r['location'] = {
                'city': r.pop('city', None),
                'subcity': r.pop('subcity', None),
                'village': r.pop('village', None),
                'lat': r.pop('lat', None),
                'lng': r.pop('lng', None)
            }
        return results

    def get_general_recommendations(self, limit=15):
        # Only fetch a reasonable pool for general recommendations to avoid timeouts
        pool = get_all_properties(limit=max(100, limit * 2))
        if pool.empty: return []
        pool['score_breakdown'] = [{} for _ in range(len(pool))]
        pool['score'] = 0.0
        results = pool.sort_values(by='createdAt', ascending=False).head(limit).copy()
        results['propertyId'] = results['id']
        return self._format_results(results.to_dict('records'))

    def explain_recommendations(self, user_id):
        """
        Deep dive into WHY these items were recommended.
        Now includes granular breakdowns for every result.
        """
        history = get_user_history(user_id)
        profile = get_user_profile(user_id)
        
        explanation = {
            "meta": {
                "user_id": user_id,
                "traced_at": pd.Timestamp.now(tz='UTC').strftime('%Y-%m-%dT%H:%M:%SZ'),
                "version": "1.1-hybrid-ready",
                "engine_mode": self.engine_mode
            },
            "interaction_signals": {
                "transactions": len(history[history['interaction_type'] == 'TRANSACTION']),
                "applications": len(history[history['interaction_type'] == 'APPLICATION']),
                "favorites": len(history[history['interaction_type'] == 'FAVORITE']),
                "views": len(history[history['interaction_type'] == 'VIEW']),
                "total_timeline_events": len(history)
            },
            "ml_status": self.ml_service.get_status(),
            "base_weights": {
                "TRANSACTION": 6.0,
                "APPLICATION": 3.0,
                "FAVORITE": 1.0,
                "VIEW": 0.2
            },
            "demographic_profile": profile.to_dict('records')[0] if not profile.empty else "Standard",
            "logic_components": [
                {"name": "Temporal Decay", "impact": "High", "desc": "Diminishes old actions over a 14-day half-life"},
                {"name": "Geographic Affinity", "impact": "Extreme", "desc": "Boosts items within 5km of map exploration"},
                {"name": "Implicit Filter Tracking", "impact": "Medium", "desc": "Captures car brands and home amenities"},
                {"name": "Demographic Sensitivity", "impact": "High", "desc": "Married users/parents get larger home priority"}
            ],
            "results": self.get_recommendations_for_user(user_id, 15)
        }
        return explanation

recommendation_service = RecommendationService()
