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
            'TRANSACTION': 3.0,
            'APPLICATION': 2.0,
            'FAVORITE': 0.8,
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
                
                # 1.4 Vehicle Specifics Match (Brand, Transmission)
                if interaction['assetType'] == 'CAR':
                    if interaction.get('brand'):
                        search_brand = interaction['brand'].lower()
                        matches = pool[pool['brand'].str.lower().str.contains(search_brand, na=False)].index
                        pool.loc[matches, 'score'] += 0.3 * weight
                        for idx in matches: add_to_breakdown(idx, 'brand_intent', 0.3 * weight)
                    
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

        # 3. Search Intent Boost (NOW EXPANDED & SANITIZED)
        if search_history is not None and not search_history.empty:
            for _, search in search_history.iterrows():
                filters = search.get('filters', {})
                search_type = search.get('searchType', 'any').lower() # 'property' or 'vehicle'
                if not filters: continue
                
                # 3.1 Basic Brand Match (Cars Only)
                if search_type == 'vehicle' and filters.get('brand') and filters['brand'] != 'any':
                    search_brand = filters['brand'].lower()
                    matches = pool[pool['brand'].str.lower().str.contains(search_brand, na=False)].index
                    pool.loc[matches, 'score'] += 0.5
                    for idx in matches: add_to_breakdown(idx, 'brand_intent', 0.5)
                
                # 3.2 Property Specifics (Property Searches Only)
                if search_type == 'property':
                    if filters.get('beds') and filters['beds'] != 'any':
                        try:
                            target_beds = int(filters['beds'])
                            matches = pool[pool['bedrooms'] == target_beds].index
                            pool.loc[matches, 'score'] += 0.6
                            for idx in matches: add_to_breakdown(idx, 'bedroom_preference', 0.6)
                        except: pass

                    if filters.get('propertyType') and filters['propertyType'] != 'any':
                        matches = pool[pool['propertyType'] == filters['propertyType']].index
                        pool.loc[matches, 'score'] += 0.4
                        for idx in matches: add_to_breakdown(idx, 'type_affinity', 0.4)

                # 3.3 Listing Type (Applies to both)
                if filters.get('listingType') and filters['listingType'] != 'any':
                    lt = filters['listingType']
                    if isinstance(lt, list) and len(lt) > 0: lt = lt[0]
                    matches = pool[pool['listingType'].apply(lambda x: lt in x if isinstance(x, list) else x == lt)].index
                    pool.loc[matches, 'score'] += 0.3
                    for idx in matches: add_to_breakdown(idx, 'listing_intent', 0.3)

                # 3.4 Vehicle Specifics (Vehicle Searches Only)
                if search_type == 'vehicle':
                    if filters.get('year') and isinstance(filters['year'], list) and len(filters['year']) == 2:
                        y_min, y_max = filters['year']
                        # ONLY apply if the user has actually narrowed the year range (ignoring default 1990-2025)
                        if not (y_min == 1990 and y_max == 2025):
                            matches = pool[(pool['year'] >= y_min) & (pool['year'] <= y_max)].index
                            pool.loc[matches, 'score'] += 0.2
                            for idx in matches: add_to_breakdown(idx, 'era_preference', 0.2)

                    if filters.get('fuelTech') and filters['fuelTech'] != 'any':
                        matches = pool[pool['fuelType'] == filters['fuelTech']].index
                        pool.loc[matches, 'score'] += 0.4
                        for idx in matches: add_to_breakdown(idx, 'fuel_tech_intent', 0.4)

                    if filters.get('transmission') and filters['transmission'] != 'any':
                        matches = pool[pool['transmission'] == filters['transmission']].index
                        pool.loc[matches, 'score'] += 0.4
                        for idx in matches: add_to_breakdown(idx, 'drive_experience', 0.4)

                # 3.4 Amenities
                amenities = filters.get('amenities', [])
                if amenities:
                    for amenity in amenities:
                        matches = pool[pool['amenities'].apply(lambda x: amenity in x if isinstance(x, list) else False)].index
                        pool.loc[matches, 'score'] += 0.1
                        for idx in matches: add_to_breakdown(idx, f'amenity_{amenity}', 0.1)

        # 4. Map Intent Boost
        if map_history is not None and not map_history.empty:
            recent_map = map_history.iloc[0]
            lat_dist = (pool['lat'] - recent_map['lat']).abs()
            lng_dist = (pool['lng'] - recent_map['lng']).abs()
            matches = pool[(lat_dist < 0.05) & (lng_dist < 0.05)].index
            pool.loc[matches, 'score'] += 0.8
            for idx in matches: add_to_breakdown(idx, 'map_region_affinity', 0.8)

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
