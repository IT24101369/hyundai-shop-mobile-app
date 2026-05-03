import React from 'react';
import { View, Text } from 'react-native';

const MapView = (props) => (
  <View style={[{ backgroundColor: '#e9f1fb', justifyContent: 'center', alignItems: 'center' }, props.style]}>
    <Text style={{ color: '#0f2747', fontWeight: 'bold' }}>Map View is only available on the Mobile App.</Text>
  </View>
);

export const Marker = () => null;
export const Polyline = () => null;

export default MapView;
