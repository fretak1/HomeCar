import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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

const toRegion = (location: MapPickerLocation) => ({
  latitude: location.lat,
  longitude: location.lng,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
});

export default function MapPicker({
  initialLocation,
  onLocationSelect,
  style,
}: MapPickerProps) {
  const mapRef = useRef<MapView>(null);
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

  useEffect(() => {
    setCoordinates(safeInitialLocation);
    mapRef.current?.animateToRegion(toRegion(safeInitialLocation), 400);
  }, [safeInitialLocation]);

  const updateLocation = (nextLocation: MapPickerLocation) => {
    setCoordinates(nextLocation);
    onLocationSelect(nextLocation);
  };

  return (
    <View style={StyleSheet.flatten([styles.container, style])}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={toRegion(safeInitialLocation)}
        mapType="satellite"
        zoomEnabled
        zoomControlEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        onPress={(event) =>
          updateLocation({
            lat: event.nativeEvent.coordinate.latitude,
            lng: event.nativeEvent.coordinate.longitude,
          })
        }
      >
        <Marker
          draggable
          coordinate={{
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          }}
          pinColor="#065F46"
          onDragEnd={(event) =>
            updateLocation({
              lat: event.nativeEvent.coordinate.latitude,
              lng: event.nativeEvent.coordinate.longitude,
            })
          }
        />
      </MapView>

      <View style={styles.infoCard} pointerEvents="none">
        <Text style={styles.infoLabel}>Selected Location</Text>
        <Text style={styles.infoValue}>
          {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </Text>
        <Text style={styles.infoHint}>Tap map or drag marker</Text>
      </View>
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
});
