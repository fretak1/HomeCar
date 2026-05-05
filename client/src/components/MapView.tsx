"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapViewProps {
    location: { lat?: number; lng?: number; address?: string };
    height?: string;
}

export const MapView: React.FC<MapViewProps> = ({ location, height = 'h-[300px]' }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    
    // Safely parse lat/lng ensuring they are valid numbers, otherwise default to Addis Ababa
    const lat = typeof location.lat === 'number' && !isNaN(location.lat) ? location.lat : (parseFloat(location.lat as unknown as string) || 9.032);
    const lng = typeof location.lng === 'number' && !isNaN(location.lng) ? location.lng : (parseFloat(location.lng as unknown as string) || 38.740);

    useEffect(() => {
        if (!mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [lng, lat],
            zoom: 14,
            interactive: true,
            dragRotate: false
        });

        // Add standard navigation control for mobile pinch/zoom etc.
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        marker.current = new mapboxgl.Marker({
            color: '#0ea5e9' // Matches the primary theme 
        })
            .setLngLat([lng, lat])
            .addTo(map.current);

        return () => {
            map.current?.remove();
        };
    }, [lat, lng]);

    return (
        <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-border shadow-sm group`}>
            <div ref={mapContainer} className="w-full h-full" />
            
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50 shadow-md">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Exact Location</p>
                <p className="text-xs font-medium font-mono text-foreground">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
            </div>
        </div>
    );
};
