import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

declare global {
  interface Window {
    mapboxgl?: any;
  }
}

const MAPBOX_SCRIPT_ID = 'homecar-mapbox-script';
const MAPBOX_STYLE_ID = 'homecar-mapbox-style';
const MAPBOX_SCRIPT_SRC = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js';
const MAPBOX_STYLE_SRC = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css';
const MAPBOX_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  '';

let loaderPromise: Promise<any> | null = null;

const getMapStyle = (mapType?: string) =>
  mapType === 'satellite'
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/streets-v12';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const zoomFromRegion = (region: any) => {
  const longitudeDelta = Math.max(Number(region?.longitudeDelta || 0.06), 0.0001);
  return clamp(Math.log2(360 / longitudeDelta), 1, 20);
};

const regionFromMap = (map: any) => {
  const center = map.getCenter();
  const bounds = map.getBounds();

  return {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: Math.abs(bounds.getNorth() - bounds.getSouth()),
    longitudeDelta: Math.abs(bounds.getEast() - bounds.getWest()),
  };
};

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

export default function MapWrapper({
  children,
  region,
  style,
  mapType = 'standard',
  onRegionChangeComplete,
}: any) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const lastMapRegionRef = useRef<any>(null);
  const ignoreNextRegionSyncRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const childElements = useMemo(() => React.Children.toArray(children), [children]);
  const markerElements = useMemo(
    () =>
      childElements.filter(
        (child: any) => React.isValidElement(child) && child?.props?.coordinate,
      ) as any[],
    [childElements],
  );
  const overlayChildren = useMemo(
    () =>
      childElements.filter(
        (child: any) => !(React.isValidElement(child) && child?.props?.coordinate),
      ),
    [childElements],
  );

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
          style: getMapStyle(mapType),
          center: [
            Number(region?.longitude || 38.7525),
            Number(region?.latitude || 9.0192),
          ],
          zoom: zoomFromRegion(region),
        });

        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        map.on('load', () => setIsReady(true));

        map.on('moveend', () => {
          const nextRegion = regionFromMap(map);
          lastMapRegionRef.current = nextRegion;
          ignoreNextRegionSyncRef.current = true;
          onRegionChangeComplete?.(nextRegion);
        });

        mapRef.current = map;
      })
      .catch(() => {
        setIsReady(false);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const nextStyle = getMapStyle(mapType);
    if (map.getStyle()?.sprite?.includes(mapType === 'satellite' ? 'satellite' : 'streets')) {
      return;
    }

    map.setStyle(nextStyle);
  }, [mapType]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !region) {
      return;
    }

    const lastMapRegion = lastMapRegionRef.current;
    if (ignoreNextRegionSyncRef.current && lastMapRegion) {
      const sameLat =
        Math.abs(Number(lastMapRegion.latitude || 0) - Number(region.latitude || 0)) < 0.0001;
      const sameLng =
        Math.abs(Number(lastMapRegion.longitude || 0) - Number(region.longitude || 0)) < 0.0001;
      const sameLatDelta =
        Math.abs(Number(lastMapRegion.latitudeDelta || 0) - Number(region.latitudeDelta || 0)) <
        0.0001;
      const sameLngDelta =
        Math.abs(Number(lastMapRegion.longitudeDelta || 0) - Number(region.longitudeDelta || 0)) <
        0.0001;

      if (sameLat && sameLng && sameLatDelta && sameLngDelta) {
        ignoreNextRegionSyncRef.current = false;
        return;
      }
    }

    ignoreNextRegionSyncRef.current = false;

    const center = map.getCenter();
    const nextZoom = zoomFromRegion(region);
    const currentZoom = map.getZoom();
    const latDiff = Math.abs(center.lat - Number(region.latitude || 0));
    const lngDiff = Math.abs(center.lng - Number(region.longitude || 0));
    const zoomDiff = Math.abs(currentZoom - nextZoom);

    if (latDiff < 0.0001 && lngDiff < 0.0001 && zoomDiff < 0.08) {
      return;
    }

    map.easeTo({
      center: [Number(region.longitude || 38.7525), Number(region.latitude || 9.0192)],
      zoom: nextZoom,
      duration: 300,
    });
  }, [region?.latitude, region?.longitude, region?.longitudeDelta, region?.latitudeDelta]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !window.mapboxgl) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    markerElements.forEach((child: any) => {
      const coordinate = child?.props?.coordinate;
      if (!coordinate) {
        return;
      }

      const el = document.createElement('button');
      el.type = 'button';
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '9999px';
      el.style.background = '#065F46';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 6px 16px rgba(15, 23, 42, 0.22)';
      el.style.cursor = 'pointer';
      el.style.padding = '0';

      if (typeof child?.props?.onPress === 'function') {
        el.addEventListener('click', () => child.props.onPress());
      }

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([Number(coordinate.longitude), Number(coordinate.latitude)])
        .addTo(map);

      if (child?.props?.title) {
        marker.setPopup(new window.mapboxgl.Popup({ offset: 18 }).setText(child.props.title));
      }

      markersRef.current.push(marker);
    });
  }, [isReady, markerElements]);

  const mergedStyle = StyleSheet.flatten([style, styles.container]) || styles.container;

  return (
    <View style={mergedStyle}>
      <div ref={containerRef} style={styles.absoluteFill as any} />
      <View style={styles.overlay} pointerEvents="box-none">
        {overlayChildren}
      </View>
      {!MAPBOX_TOKEN ? (
        <View style={styles.messageWrap} pointerEvents="none">
          <View style={styles.messageCard}>
            <span style={styles.messageText}>Mapbox token missing</span>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export const Marker = (_props: any) => null;
export const Callout = (_props: any) => null;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
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
