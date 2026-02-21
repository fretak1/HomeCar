"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Set Mapbox Access Token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface MapPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; address?: any }) => void;
    initialLocation?: { lat: number; lng: number };
}

export const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect, initialLocation }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(initialLocation || { lat: 9.03, lng: 38.74 }); // Default to Addis Ababa

    useEffect(() => {
        if (!mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [coordinates.lng, coordinates.lat],
            zoom: 12
        });

        marker.current = new mapboxgl.Marker({
            draggable: true,
            color: '#005a41'
        })
            .setLngLat([coordinates.lng, coordinates.lat])
            .addTo(map.current);

        marker.current.on('dragend', () => {
            const lngLat = marker.current?.getLngLat();
            if (lngLat) {
                const newCoords = { lat: lngLat.lat, lng: lngLat.lng };
                setCoordinates(newCoords);
                onLocationSelect(newCoords);
            }
        });

        map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            marker.current?.setLngLat([lng, lat]);
            const newCoords = { lat, lng };
            setCoordinates(newCoords);
            onLocationSelect(newCoords);
        });

        return () => {
            map.current?.remove();
        };
    }, []);

    // When initialLocation changes (e.g. async data arrives for edit mode), move map and marker
    useEffect(() => {
        if (!initialLocation || (!initialLocation.lat && !initialLocation.lng)) return;
        const { lat, lng } = initialLocation;
        if (lat === 9.03 && lng === 38.74) return; // skip default, only act on real data
        setCoordinates({ lat, lng });
        if (map.current) {
            map.current.flyTo({ center: [lng, lat], zoom: 14 });
        }
        if (marker.current) {
            marker.current.setLngLat([lng, lat]);
        }
    }, [initialLocation?.lat, initialLocation?.lng]);

    const handleZoomIn = () => map.current?.zoomIn();
    const handleZoomOut = () => map.current?.zoomOut();
    const handleReset = () => {
        const defaultCoords = { lat: 9.03, lng: 38.74 }; // Addis Ababa
        map.current?.flyTo({ center: [defaultCoords.lng, defaultCoords.lat], zoom: 12 });
        marker.current?.setLngLat([defaultCoords.lng, defaultCoords.lat]);
        setCoordinates(defaultCoords);
        onLocationSelect(defaultCoords);
    };

    return (
        <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-border shadow-inner group">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Overlay Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomIn}
                    className="bg-slate-900/80 hover:bg-slate-900 text-white shadow-xl border-white/10 backdrop-blur-md transition-all hover:scale-105"
                >
                    <ZoomIn className="h-4 w-4 text-emerald-400" />
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomOut}
                    className="bg-slate-900/80 hover:bg-slate-900 text-white shadow-xl border-white/10 backdrop-blur-md transition-all hover:scale-105"
                >
                    <ZoomOut className="h-4 w-4 text-emerald-400" />
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={handleReset}
                    className="bg-slate-900/80 hover:bg-slate-900 text-white shadow-xl border-white/10 backdrop-blur-md transition-all hover:scale-105"
                >
                    <Navigation className="h-4 w-4 text-emerald-400" />
                </Button>
            </div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-border/50 shadow-lg flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Selected Location</p>
                        <p className="text-xs font-medium font-mono text-foreground">
                            {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                        </p>
                    </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium bg-muted/20 px-2 py-1 rounded-md">
                    Drag marker or click map
                </div>
            </div>
        </div>
    );
};
