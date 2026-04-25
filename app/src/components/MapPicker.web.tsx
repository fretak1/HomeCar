import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

declare global {
  interface Window {
    mapboxgl?: any;
  }
}

type MapPickerLocation = {
  lat: number;
  lng: number;
};

type MapPickerProps = {
  initialLocation?: MapPickerLocation;
  onLocationSelect: (location: MapPickerLocation) => void;
  style?: any;
};

const DEFAULT_LOCATION: MapPickerLocation = {
  lat: 9.03,
  lng: 38.74,
};

const MAPBOX_SCRIPT_ID = 'homecar-mapbox-picker-script';
const MAPBOX_STYLE_ID = 'homecar-mapbox-picker-style';
const MAPBOX_SCRIPT_SRC = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js';
const MAPBOX_STYLE_SRC = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css';
const MAPBOX_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  '';

let loaderPromise: Promise<any> | null = null;

const ensureMapboxLoaded = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Mapbox can only load in the browser.'));
  }

  if (window.mapboxgl) {
    return Promise.resolve(window.mapboxgl);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    if (!document.getElementById(MAPBOX_STYLE_ID)) {
      const link = document.createElement('link');
      link.id = MAPBOX_STYLE_ID;
      link.rel = 'stylesheet';
      link.href = MAPBOX_STYLE_SRC;
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(MAPBOX_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.mapboxgl));
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load Mapbox script.')),
      );
      return;
    }

    const script = document.createElement('script');
    script.id = MAPBOX_SCRIPT_ID;
    script.src = MAPBOX_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.mapboxgl);
    script.onerror = () => reject(new Error('Failed to load Mapbox script.'));
    document.body.appendChild(script);
  });

  return loaderPromise;
};

export default function MapPicker({
  initialLocation,
  onLocationSelect,
  style,
}: MapPickerProps) {
  const safeInitialLocation = useMemo(
    () =>
      initialLocation &&
      Number.isFinite(initialLocation.lat) &&
      Number.isFinite(initialLocation.lng)
        ? initialLocation
        : DEFAULT_LOCATION,
    [initialLocation?.lat, initialLocation?.lng],
  );
  const [coordinates, setCoordinates] = useState<MapPickerLocation>(safeInitialLocation);
  const [loadFailed, setLoadFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    ensureMapboxLoaded()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current || mapRef.current) {
          return;
        }

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [safeInitialLocation.lng, safeInitialLocation.lat],
          zoom: 13,
        });

        const marker = new mapboxgl.Marker({
          draggable: true,
          color: '#065F46',
        })
          .setLngLat([safeInitialLocation.lng, safeInitialLocation.lat])
          .addTo(map);

        marker.on('dragend', () => {
          const next = marker.getLngLat();
          const nextLocation = {
            lat: next.lat,
            lng: next.lng,
          };
          setCoordinates(nextLocation);
          onLocationSelect(nextLocation);
        });

        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        map.on('click', (event: any) => {
          const nextLocation = {
            lat: event.lngLat.lat,
            lng: event.lngLat.lng,
          };
          marker.setLngLat([nextLocation.lng, nextLocation.lat]);
          setCoordinates(nextLocation);
          onLocationSelect(nextLocation);
        });

        mapRef.current = map;
        markerRef.current = marker;
      })
      .catch(() => {
        setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    setCoordinates(safeInitialLocation);

    if (!mapRef.current || !markerRef.current) {
      return;
    }

    markerRef.current.setLngLat([safeInitialLocation.lng, safeInitialLocation.lat]);
    mapRef.current.easeTo({
      center: [safeInitialLocation.lng, safeInitialLocation.lat],
      zoom: 13,
      duration: 350,
    });
  }, [safeInitialLocation]);

  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      <div ref={containerRef} style={styles.absoluteFill as any} />

      <View style={styles.infoCard} pointerEvents="none">
        <Text style={styles.infoLabel}>Selected Location</Text>
        <Text style={styles.infoValue}>
          {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </Text>
        <Text style={styles.infoHint}>Drag the marker or click the map</Text>
      </View>

      {loadFailed || !MAPBOX_TOKEN ? (
        <View style={styles.messageWrap} pointerEvents="none">
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>Mapbox failed to load</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D7E0EA',
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  infoCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  infoHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  messageWrap: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  messageCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },
});
