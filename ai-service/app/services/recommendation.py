import pandas as pd
import numpy as np
from app.database import (
    get_all_properties, 
    get_user_history, 
    get_user_profile, 
    get_user_search_history, 
    get_user_map_history
)

class RecommendationService:
    def __init__(self):
        pass

    def get_recommendations_for_user(self, user_id, limit=10):
        """
        Sophisticated recommendation engine using multiple intent signals.
        """
        history_df = get_user_history(user_id)
        profile_df = get_user_profile(user_id)
        search_df = get_user_search_history(user_id)
        map_df = get_user_map_history(user_id)
        
        if history_df.empty and search_df.empty and map_df.empty:
            return self.get_general_recommendations(limit)

        property_pool = get_all_properties()
        if property_pool.empty:
            return []

        return self._compute_weighted_recommendations(
            history_df, 
            property_pool, 
            limit,
            user_profile=profile_df,
            search_history=search_df,
            map_history=map_df
        )

    def _compute_weighted_recommendations(self, history, pool, limit, user_profile=None, search_history=None, map_history=None):
        """
        Multi-dimensional weighted scoring with granular breakdown.
        """
        weights = {
            'TRANSACTION': 6.0,
            'APPLICATION': 3.0,
            'FAVORITE': 1.0,
            'VIEW': 0.2
        }

        # Initialize score and breakdown
        pool['score'] = 0.0
        pool['score_breakdown'] = [{} for _ in range(len(pool))]
        
        def add_to_breakdown(idx, component, value):
            current = pool.at[idx, 'score_breakdown']
            current[component] = round(current.get(component, 0) + value, 3)
            pool.at[idx, 'score_breakdown'] = current

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
                matches = pool[pool['assetType'] == interaction['assetType']].index
                pool.loc[matches, 'score'] += 0.5 * weight
                for idx in matches: add_to_breakdown(idx, 'asset_type_match', 0.5 * weight)
                
                # 1.2 Location Hierarchy Match (Subcity, City, Region, Village)
                if interaction.get('subcity'):
                    matches = pool[pool['subcity'] == interaction['subcity']].index
                    pool.loc[matches, 'score'] += 0.4 * weight
                    for idx in matches: add_to_breakdown(idx, 'location_affinity', 0.4 * weight)
                
                if interaction.get('city'):
                    matches = pool[pool['city'] == interaction['city']].index
                    pool.loc[matches, 'score'] += 0.2 * weight
                    for idx in matches: add_to_breakdown(idx, 'regional_affinity', 0.2 * weight)

                if interaction.get('village'):
                    matches = pool[pool['village'] == interaction['village']].index
                    pool.loc[matches, 'score'] += 0.1 * weight
                    for idx in matches: add_to_breakdown(idx, 'local_niche_affinity', 0.1 * weight)
                
                # 1.3 Property Specifics Match (Bedrooms, Type)
                if interaction['assetType'] == 'HOME':
                    if interaction.get('bedrooms'):
                        matches = pool[pool['bedrooms'] == interaction['bedrooms']].index
                        pool.loc[matches, 'score'] += 0.3 * weight
                        for idx in matches: add_to_breakdown(idx, 'bedroom_preference', 0.3 * weight)
                    
                    if interaction.get('propertyType'):
                        matches = pool[pool['propertyType'] == interaction['propertyType']].index
                        pool.loc[matches, 'score'] += 0.2 * weight
                        for idx in matches: add_to_breakdown(idx, 'type_affinity', 0.2 * weight)
                
                # 1.4 Vehicle Specifics Match (Brand, Model, Transmission)
                if interaction['assetType'] == 'CAR':
                    if interaction.get('brand'):
                        search_brand = interaction['brand'].lower()
                        matches = pool[pool['brand'].str.lower().str.contains(search_brand, na=False)].index
                        pool.loc[matches, 'score'] += 0.3 * weight
                        for idx in matches: add_to_breakdown(idx, 'brand_intent', 0.3 * weight)
                    
                    if interaction.get('model'):
                        search_model = interaction['model'].lower()
                        matches = pool[pool['model'].str.lower().str.contains(search_model, na=False)].index
                        pool.loc[matches, 'score'] += 0.4 * weight
                        for idx in matches: add_to_breakdown(idx, 'model_intent', 0.4 * weight)
                    
                    if interaction.get('transmission'):
                        matches = pool[pool['transmission'] == interaction['transmission']].index
                        pool.loc[matches, 'score'] += 0.2 * weight
                        for idx in matches: add_to_breakdown(idx, 'drive_experience', 0.2 * weight)
                    
                    if interaction.get('year'):
                        matches = pool[pool['year'] == interaction['year']].index
                        pool.loc[matches, 'score'] += 0.2 * weight
                        for idx in matches: add_to_breakdown(idx, 'era_preference', 0.2 * weight)

                # 1.5 Price Proximity
                if interaction.get('price') and interaction['price'] > 0:
                    price_diff_ratio = (pool['price'] - interaction['price']).abs() / interaction['price']
                    matches = pool[price_diff_ratio < 0.25].index
                    pool.loc[matches, 'score'] += 0.3 * weight
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
                matches_beds = pool[pool['bedrooms'] >= kids_count].index
                pool.loc[matches_beds, 'score'] += 0.6
                for idx in matches_beds: add_to_breakdown(idx, 'family_size_boost', 0.6)

        # 3. Search Intent Boost (SMARTER PERSISTENCE)
        if search_history is not None and not search_history.empty:
            history_reset = search_history.reset_index(drop=True)
            
            # Active Tab / Asset Match Boost (Push current context to the top)
            active_search_type = history_reset.at[0, 'searchType'].lower() if not history_reset.empty else None
            if active_search_type == 'property':
                matches = pool[pool['assetType'] == 'HOME'].index
                pool.loc[matches, 'score'] += 0.8
                for idx in matches: add_to_breakdown(idx, 'active_tab_intent', 0.8)
            elif active_search_type == 'vehicle':
                matches = pool[pool['assetType'] == 'CAR'].index
                pool.loc[matches, 'score'] += 0.8
                for idx in matches: add_to_breakdown(idx, 'active_tab_intent', 0.8)

            # Step A: Scan history to identify ALL specific intents for each tray
            intent_map = {
                'listing_intent': 'listingType',
                'bedroom_preference': 'beds',
                'bath_preference': 'baths',
                'type_affinity': 'propertyType',
                'brand_intent': 'brand',
                'model_intent': 'model',
                'fuel_tech_intent': 'fuelTech',
                'drive_experience': 'transmission',
                'region_affinity': 'region',
                'city_affinity': 'city',
                'subcity_affinity': 'subCity'
            }
            
            all_specifics = {} # category -> { val_lower -> (val, index, search_type) }
            
            history_reset = search_history.reset_index(drop=True)
            for index, search in history_reset.iterrows():
                filters = search.get('filters', {})
                st = search.get('searchType', 'any').lower()
                for cat, f_key in intent_map.items():
                    val = filters.get(f_key)
                    if val and str(val).lower() not in ['none', '', 'any'] and val != [1990, 2025] and val != []:
                        if cat not in all_specifics: 
                            all_specifics[cat] = {}
                        val_lookup = str(val).lower()
                        if val_lookup not in all_specifics[cat]: 
                            all_specifics[cat][val_lookup] = (val, index, st)

            # Step B: Apply Boosts using "Intent Anchoring" (Relative Category Age)
            # This ensures intent ONLY decays when the specific category is changed to something else.
            decay_base = 0.95
            
            flattened_specifics = []
            for cat, values_dict in all_specifics.items():
                for val_lookup, data in values_dict.items():
                    flattened_specifics.append((cat, val_lookup, data[0], data[1], data[2]))

            for cat, val_lookup, val, index, search_type in flattened_specifics:
                f_key = intent_map[cat]

                # Calculate Relative Age: How many times has THIS category been set to a DIFFERENT specific value since?
                relative_age = 0
                for i in range(index):
                    hist_val = history_reset.at[i, 'filters'].get(f_key, 'any')
                    
                    # Robust reset detection
                    is_reset = hist_val in [None, '', 'any', 'Any', []] or hist_val == [1990, 2025]
                    
                    # Only age the intent if the user picks a DIFFERENT specific value. 
                    if not is_reset and str(hist_val).lower() != val_lookup:
                        relative_age += 1
                
                # Final weight: Based on how many times the user "moved away" from this intent
                weight = (decay_base ** relative_age)

                # 3.1 Listing Type (Applies to both)
                if cat == 'listing_intent':
                    lt = val
                    if isinstance(lt, list) and len(lt) > 0: lt = lt[0]
                    lt_upper = str(lt).upper()
                    matches = pool[pool['listingType'].apply(lambda x: lt_upper in [i.upper() for i in x] if isinstance(x, list) else (str(x).upper() == lt_upper))].index
                    boost = 0.8 * weight # UP from 0.3 - renting vs buying is a strict financial barrier
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'listing_intent', boost)

                # 3.2 Property Specifics
                if cat == 'bedroom_preference':
                    try:
                        beds_val = str(val)
                        matches = []
                        if '+' in beds_val:
                            min_beds = int(beds_val.replace('+', ''))
                            matches = pool[pool['bedrooms'] >= min_beds].index
                        else:
                            target_beds = int(beds_val)
                            matches = pool[pool['bedrooms'] == target_beds].index
                        
                        boost = 0.6 * weight # Stable at 0.6 - strong family size proxy
                        pool.loc[matches, 'score'] += boost
                        for idx in matches: add_to_breakdown(idx, 'bedroom_preference', boost)
                    except: pass

                if cat == 'bath_preference':
                    try:
                        baths_val = str(val)
                        matches = []
                        if '+' in baths_val:
                            min_baths = int(baths_val.replace('+', ''))
                            matches = pool[pool['bathrooms'] >= min_baths].index
                        else:
                            target_baths = int(baths_val)
                            matches = pool[pool['bathrooms'] == target_baths].index
                        
                        boost = 0.2 * weight # Stable at 0.2 - highly flexible user preference
                        pool.loc[matches, 'score'] += boost
                        for idx in matches: add_to_breakdown(idx, 'bath_preference', boost)
                    except: pass

                if cat == 'type_affinity':
                    target_type = str(val).lower().strip()
                    matches = pool[pool['propertyType'].str.lower().str.strip() == target_type].index
                    boost = 0.5 * weight # UP from 0.4 - aesthetic and practical lifestyle choice
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'type_affinity', boost)

                # 3.3 Vehicle Specifics
                if cat == 'brand_intent':
                    search_brand = str(val).lower()
                    matches = pool[pool['brand'].str.lower().str.contains(search_brand, na=False)].index
                    boost = 0.6 * weight # Adjusted from 0.8
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'brand_intent', boost)

                if cat == 'model_intent':
                    search_model = str(val).lower()
                    matches = pool[pool['model'].str.lower().str.contains(search_model, na=False)].index
                    boost = 0.8 * weight # Adjusted from 1.0
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'model_intent', boost)

                if cat == 'fuel_tech_intent':
                    target_fuel = str(val).lower()
                    matches = pool[pool['fuelType'].str.lower() == target_fuel].index
                    boost = 0.5 * weight # UP from 0.4 - EV vs Gas is a hard infrastructural requirement
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'fuel_tech_intent', boost)

                if cat == 'drive_experience':
                    target_trans = str(val).lower()
                    matches = pool[pool['transmission'].str.lower() == target_trans].index
                    boost = 0.5 * weight # UP from 0.4 - Manual vs Auto is often a strict skill barrier
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'drive_experience', boost)

                # 3.4 Geographical Intent (Anchored)
                if cat == 'region_affinity':
                    target = str(val).lower().strip()
                    matches = pool[pool['region'].str.lower().str.strip() == target].index
                    boost = 0.1 * weight
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'region_intent', boost)
                
                if cat == 'city_affinity':
                    target = str(val).lower().strip()
                    matches = pool[pool['city'].str.lower().str.strip() == target].index
                    boost = 0.4 * weight
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'city_intent', boost)

                if cat == 'subcity_affinity':
                    target = str(val).lower().strip()
                    matches = pool[pool['subcity'].str.lower().str.strip() == target].index
                    boost = 0.8 * weight
                    pool.loc[matches, 'score'] += boost
                    for idx in matches: add_to_breakdown(idx, 'subcity_intent', boost)

            # 3.4 Era Preference (Handled with Relative Age as well)
            latest_year_range = None
            for index, search in history_reset.iterrows():
                filters = search.get('filters', {})
                if filters.get('year') and isinstance(filters['year'], list) and len(filters['year']) == 2:
                    y_range = filters['year']
                    if not (y_range[0] == 1990 and y_range[1] == 2025):
                        # Calculate relative age for year range
                        rel_age_year = 0
                        for i in range(index):
                            h_year = history_reset.at[i, 'filters'].get('year', [1990, 2025])
                            # FIX: Ignore default/reset year range [1990, 2025]
                            is_reset_year = (h_year == [1990, 2025] or h_year is None)
                            if not is_reset_year and h_year != y_range:
                                rel_age_year += 1
                        
                        matches = pool[(pool['year'] >= y_range[0]) & (pool['year'] <= y_range[1])].index
                        boost = 0.8 * (decay_base ** rel_age_year)
                        pool.loc[matches, 'score'] += boost
                        for idx in matches: add_to_breakdown(idx, 'era_preference', boost)
                        break

            # 3.4 Price Range Intent (Power Filter)
            for index, search in history_reset.iterrows():
                p_range = search.get('filters', {}).get('priceRange')
                if p_range and isinstance(p_range, list) and len(p_range) == 2:
                    p_min, p_max = p_range
                    if p_min is not None or p_max is not None:
                        # Calculate relative age
                        rel_age_price = 0
                        for i in range(index):
                            h_price = history_reset.at[i, 'filters'].get('priceRange', [None, None])
                            if h_price != p_range and h_price != [None, None]:
                                rel_age_price += 1
                        
                        query = pd.Series([True] * len(pool), index=pool.index)
                        if p_min is not None: query &= (pool['price'] >= p_min)
                        if p_max is not None: query &= (pool['price'] <= p_max)
                        
                        matches = pool[query].index
                        boost = 0.8 * (decay_base ** rel_age_price)
                        pool.loc[matches, 'score'] += boost
                        for idx in matches: add_to_breakdown(idx, 'price_range_intent', boost)
                        break


            # 3.4 Amenities (Intent Anchored)
            all_amenities_found = {} # amenity_name -> index of latest presence
            for index, search in history_reset.iterrows():
                ams = search.get('filters', {}).get('amenities', [])
                if ams:
                    for a in ams:
                        if a not in all_amenities_found:
                            all_amenities_found[a] = index
            
            for amenity, latest_idx in all_amenities_found.items():
                # Relative age: How many times since then has it been MISSING or DIFFERENTLY CASED?
                rel_age_am = 0
                target_am = amenity.lower()
                for i in range(latest_idx):
                    hist_filters = history_reset.at[i, 'filters']
                    hist_amenities_list = hist_filters.get('amenities', [])
                    
                    # FIX: If the user didn't specify ANY amenities in this search, skip decay.
                    # This treat resets as neutral exploration.
                    if not hist_amenities_list:
                        continue
                        
                    hist_amenities = [str(a).lower() for a in hist_amenities_list]
                    if target_am not in hist_amenities:
                        rel_age_am += 1
                
                # Fix: Case-insensitive match for each amenity in the database property's list
                matches = pool[pool['amenities'].apply(lambda x: any(target_am == str(a).lower() for a in x) if isinstance(x, list) else False)].index
                boost = 0.1 * (decay_base ** rel_age_am)
                pool.loc[matches, 'score'] += boost
                for idx in matches: add_to_breakdown(idx, f'amenity_{target_am}', boost)

        # 4. Map Intent Boost
        if map_history is not None and not map_history.empty:
            recent_map = map_history.iloc[0]
            lat_dist = (pool['lat'] - recent_map['lat']).abs()
            lng_dist = (pool['lng'] - recent_map['lng']).abs()
            matches = pool[(lat_dist < 0.05) & (lng_dist < 0.05)].index
            pool.loc[matches, 'score'] += 0.4
            for idx in matches: add_to_breakdown(idx, 'map_region_affinity', 0.4)

        # Clean Pool
        if not history.empty:
            history_ids = history['propertyId'].unique()
            pool = pool[~pool['id'].isin(history_ids)]

        # Sort and return
        recommendations = pool.sort_values(by='score', ascending=False).head(limit)
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

    def get_general_recommendations(self, limit=10):
        pool = get_all_properties()
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
                "version": "2.0-granular"
            },
            "interaction_signals": {
                "transactions": len(history[history['interaction_type'] == 'TRANSACTION']),
                "applications": len(history[history['interaction_type'] == 'APPLICATION']),
                "favorites": len(history[history['interaction_type'] == 'FAVORITE']),
                "views": len(history[history['interaction_type'] == 'VIEW']),
                "total_timeline_events": len(history)
            },
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
            "results": self.get_recommendations_for_user(user_id, 10)
        }
        return explanation

recommendation_service = RecommendationService()
