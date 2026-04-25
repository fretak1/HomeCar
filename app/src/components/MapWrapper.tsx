import React, { useEffect, useRef } from 'react';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';

export default function MapWrapper({ 
  region, 
  onRegionChangeComplete, 
  children,
  style,
  mapType = 'standard'
}: any) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 500);
    }
  }, [region?.latitude, region?.longitude]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={style}
      initialRegion={region}
      zoomEnabled={true}
      zoomControlEnabled={true}
      scrollEnabled={true}
      pitchEnabled={true}
      rotateEnabled={true}
      onRegionChangeComplete={onRegionChangeComplete}
      mapType={mapType}
      googleMapsParameters={{
        gestureHandling: 'greedy',
      }}
    >
      {children}
    </MapView>
  );
}

export { Marker, Callout };
