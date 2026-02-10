'use client';

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGlobalStore } from "@/store/useGlobalStore";
import { usePropertyStore } from "@/store/usePropertyStore";
import { useVehicleStore } from "@/store/useVehicleStore";

// Fix for Mapbox token
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZnJldGFrZWxlIiwiYSI6ImNtamtkNGI2ejAwM28wMXNnZWJibTI0MmwiH0.X";
if (token) {
    mapboxgl.accessToken = token;
}

const Map = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const { filters, searchType } = useGlobalStore();

    const { properties, isLoading: isPropLoading, error: propError, fetchProperties } = usePropertyStore();
    const { vehicles, isLoading: isVehLoading, error: vehError, fetchVehicles } = useVehicleStore();

    useEffect(() => {
        if (searchType === 'property') {
            fetchProperties(filters);
        } else {
            fetchVehicles(filters);
        }
    }, [filters, fetchProperties, fetchVehicles, searchType]);

    const isLoading = searchType === 'property' ? isPropLoading : isVehLoading;
    const isError = searchType === 'property' ? propError : vehError;
    const items = searchType === 'property' ? properties : vehicles;

    useEffect(() => {
        if (isLoading || isError || !mapContainerRef.current) return;
        if (!token) return;

        if (!mapRef.current) {
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: "mapbox://styles/mapbox/light-v11",
                center: (filters.coordinates && filters.coordinates[0]) ? [filters.coordinates[0]!, filters.coordinates[1]!] : [-74.5, 40],
                zoom: 9,
            });
            mapRef.current = map;
            map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
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

        if (items) {
            items.forEach((item: any) => {
                if (!item) return;
                const center = mapRef.current?.getCenter() || { lng: -74.5, lat: 40 };
                const lng = center.lng + (Math.random() - 0.5) * 0.1;
                const lat = center.lat + (Math.random() - 0.5) * 0.1;

                createMarker(item, mapRef.current!, [lng, lat], searchType);
            });
        }
    }, [isLoading, isError, items, filters, searchType]);

    useEffect(() => {
        const resizeMap = () => mapRef.current?.resize();
        window.addEventListener('resize', resizeMap);
        return () => window.removeEventListener('resize', resizeMap);
    }, []);

    if (!token) {
        return (
            <div className="w-full h-full bg-muted flex items-center justify-center rounded-xl font-medium text-muted-foreground border border-dashed">
                Map Unavailable (Token missing)
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
    el.className = 'marker';
    el.style.backgroundImage = `url(${item.image})`;
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
          <div class="h-24 w-full bg-cover bg-center" style="background-image: url('${item.image}')"></div>
          <div class="p-3">
            <h3 class="font-bold text-sm truncate text-foreground">${item.title}</h3>
            <p class="text-[10px] text-muted-foreground mb-1 font-medium uppercase truncate">${item.location}</p>
            <p class="font-bold text-primary text-base">ETB ${item.price.toLocaleString()}<span class="text-[10px] font-normal text-muted-foreground ml-1">${type === 'property' ? '/mo' : ''}</span></p>
          </div>
        </div>
        `
            )
        )
        .addTo(map);
};

export default Map;
