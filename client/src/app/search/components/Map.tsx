'use client';

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGlobalStore } from "@/store/useGlobalStore";
import { usePropertyStore } from "@/store/usePropertyStore";
import { useUserStore } from "@/store/useUserStore";
import { useInteractionStore } from "@/store/useInteractionStore";
import { formatLocation, getListingMainImage } from "@/lib/utils";

// Fix for Mapbox token
const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (token) {
    mapboxgl.accessToken = token;
}

const Map = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const { filters, searchType } = useGlobalStore();
    const { currentUser } = useUserStore();
    const { logMapInteraction } = useInteractionStore();

    const { properties, isLoading, error } = usePropertyStore();

    const items = properties;

    useEffect(() => {
        if (isLoading || error || !mapContainerRef.current) return;
        if (!token) return;

        if (!mapRef.current) {
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: "mapbox://styles/mapbox/satellite-streets-v12",
                center: (filters.coordinates && filters.coordinates[0]) ? [filters.coordinates[0]!, filters.coordinates[1]!] : [-74.5, 40],
                zoom: 9,
            });
            mapRef.current = map;
            map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

            // Log map interactions
            map.on('moveend', () => {
                if (currentUser?.id) {
                    const center = map.getCenter();
                    const zoom = map.getZoom();
                    logMapInteraction(currentUser.id, center.lat, center.lng, zoom);
                }
            });
        } else {
            if (filters.coordinates && filters.coordinates[0] !== null) {
                mapRef.current.flyTo({
                    center: [filters.coordinates[0]!, filters.coordinates[1]!],
                    zoom: 12
                });
            }
        }

        const currentMarkers = document.getElementsByClassName('mapboxgl-marker');
        while (currentMarkers[0]) {
            currentMarkers[0].parentNode?.removeChild(currentMarkers[0]);
        }

        if (items && items.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            let hasValidCoords = false;

            items.forEach((item: any) => {
                if (!item) return;

                // Use real coordinates from location object
                const lat = item.location?.lat;
                const lng = item.location?.lng;

                if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
                    createMarker(item, mapRef.current!, [lng, lat], searchType);
                    bounds.extend([lng, lat]);
                    hasValidCoords = true;
                } else {
                    // Fallback to random placement near center if no coordinates
                    const center = mapRef.current?.getCenter() || { lng: -74.5, lat: 40 };
                    const fallbackLng = center.lng + (Math.random() - 0.5) * 0.01;
                    const fallbackLat = center.lat + (Math.random() - 0.5) * 0.01;
                    createMarker(item, mapRef.current!, [fallbackLng, fallbackLat], searchType);
                }
            });

            // Automatically fit the map to show all markers
            if (hasValidCoords && mapRef.current) {
                mapRef.current.fitBounds(bounds, {
                    padding: { top: 50, bottom: 50, left: 50, right: 50 },
                    maxZoom: 14,
                    duration: 1500
                });
            }
        }
    }, [isLoading, error, items, filters, searchType]);

    useEffect(() => {
        const resizeMap = () => mapRef.current?.resize();
        window.addEventListener('resize', resizeMap);
        return () => window.removeEventListener('resize', resizeMap);
    }, []);

    if (!token || token === "pk.eyJ1IjoiZnJldGFrZWxlIiwiYSI6ImNtamtkNGI2ejAwM28wMXNnZWJibTI0MmwiH0.X") {
        return (
            <div className="flex-[2] relative rounded-xl overflow-hidden shadow-sm border border-border hidden lg:block mx-1 bg-muted/30">
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="bg-background rounded-full p-4 mb-4 shadow-sm border border-border">
                        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Maps Configuration Required</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-4">
                        A valid Mapbox access token is required to display the search results on a map.
                    </p>
                    <div className="text-xs text-left bg-background p-3 rounded-lg border border-border font-mono text-muted-foreground">
                        1. Go to mapbox.com<br />
                        2. Get your access token<br />
                        3. Add it to .env as:<br />
                        NEXT_PUBLIC_MAPBOX_TOKEN=pk...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-[2] relative rounded-xl overflow-hidden shadow-sm border border-border hidden lg:block mx-1">
            <div className="map-container h-full w-full" ref={mapContainerRef} />
        </div>
    );
};

const createMarker = (item: any, map: mapboxgl.Map, lngLat: [number, number], type: string) => {
    const el = document.createElement('div');
    const imageUrl = getListingMainImage(item);
    const locationStr = formatLocation(item.location);

    el.className = 'marker';
    el.style.backgroundImage = `url(${imageUrl})`;
    el.style.width = '42px';
    el.style.height = '42px';
    el.style.backgroundSize = 'cover';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    el.style.cursor = 'pointer';

    const priceTag = document.createElement('div');
    priceTag.innerText = `ETB ${(item.price / 1000).toFixed(0)}k`;
    priceTag.className = "bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md absolute -bottom-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10 border border-white/20";

    const container = document.createElement('div');
    container.className = "relative group hover:scale-110 transition-transform duration-200 z-0 hover:z-50";
    container.appendChild(el);
    container.appendChild(priceTag);

    return new mapboxgl.Marker(container)
        .setLngLat(lngLat)
        .setPopup(
            new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(
                `
        <div class="p-0 w-48 overflow-hidden rounded-xl bg-card border border-border shadow-xl">
          <div class="h-24 w-full bg-cover bg-center" style="background-image: url('${imageUrl}')"></div>
          <div class="p-3">
            <h3 class="font-bold text-sm truncate text-foreground">${item.title}</h3>
            <p class="text-[10px] text-muted-foreground mb-1 font-medium uppercase truncate">${locationStr}</p>
            <p class="font-bold text-primary text-base">ETB ${item.price.toLocaleString()}<span class="text-[10px] font-normal text-muted-foreground ml-1">${type === 'property' ? '/mo' : ''}</span></p>
          </div>
        </div>
        `
            )
        )
        .addTo(map);
};

export default Map;
