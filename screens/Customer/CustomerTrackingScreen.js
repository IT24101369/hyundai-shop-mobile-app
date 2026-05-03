import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import MapView, { Marker } from '../../components/Map';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', success: '#10b981', danger: '#ef4444'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const CustomerTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    console.log('CustomerTrackingScreen loaded with OrderID:', orderId);
  }, [orderId]);

  const fetchRiderLocation = async () => {
    try {
      const response = await axios.get(`${API_BASE}/tracking/location/order/${orderId}`);
      if (response.data && response.data.latitude) {
        setRiderLocation({
          latitude: response.data.latitude,
          longitude: response.data.longitude,
        });
      }
    } catch (error) {
      // 404 is expected if rider hasn't started yet, so we just log and stop loading spinner
      console.log('Rider location not yet available.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderLocation();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchRiderLocation, 10000);
    
    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Track My Order</Text>
        <View style={{ width: 60 }} />
      </View>

      {!riderLocation ? (
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.golden} />
          ) : (
            <Text style={{ fontSize: 40, marginBottom: 20 }}>📦</Text>
          )}
          <Text style={styles.loadingText}>
            {loading ? 'Connecting to GPS...' : 'Order is being processed.\nLive tracking will start once the rider is on the way.'}
          </Text>
          {!loading && (
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchRiderLocation}>
              <Text style={styles.refreshBtnText}>Check Again</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: riderLocation.latitude,
              longitude: riderLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker
              coordinate={riderLocation}
              title="Rider Position"
              description="Your order is on the way!"
            >
              <View style={styles.riderMarker}>
                <Text style={{ fontSize: 24 }}>🛵</Text>
              </View>
            </Marker>
          </MapView>

          <View style={styles.infoPanel}>
            <View style={styles.statusRow}>
              <View style={styles.liveBadge}>
                <View style={styles.pulse} />
                <Text style={styles.liveText}>LIVE UPDATING</Text>
              </View>
              <Text style={styles.orderIdText}>Order: #{orderId?.slice(-6).toUpperCase()}</Text>
            </View>
            
            <Text style={styles.mainStatus}>Rider is on the way!</Text>
            <Text style={styles.subStatus}>Estimated arrival: 15-20 mins</Text>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.contactBtn} onPress={() => Alert.alert('Contact Rider', 'Feature coming soon!')}>
              <Text style={styles.contactBtnText}>📞 Contact Rider</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.silver },
  header: {
    backgroundColor: COLORS.sapphire, paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
  },
  backBtn: { padding: 5 },
  backText: { color: COLORS.diamond, fontSize: 16 },
  title: { color: COLORS.diamond, fontSize: 18, fontWeight: '700' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { color: COLORS.gray, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  refreshBtn: { marginTop: 20, backgroundColor: COLORS.golden, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  refreshBtnText: { color: COLORS.diamond, fontWeight: '700' },

  map: { flex: 1 },
  
  infoPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.diamond, padding: 25,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f2fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.golden, marginRight: 8 },
  liveText: { color: COLORS.golden, fontSize: 10, fontWeight: '800' },
  orderIdText: { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  
  mainStatus: { fontSize: 20, fontWeight: '800', color: COLORS.sapphire, marginBottom: 5 },
  subStatus: { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
  
  divider: { height: 1, backgroundColor: COLORS.icyLake, marginBottom: 20 },
  contactBtn: { backgroundColor: COLORS.silver, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.icyLake },
  contactBtnText: { color: COLORS.sapphire, fontSize: 15, fontWeight: '700' },
  
  riderMarker: { backgroundColor: COLORS.diamond, padding: 5, borderRadius: 20, borderWidth: 2, borderColor: COLORS.golden, elevation: 5 },
});

export default CustomerTrackingScreen;
