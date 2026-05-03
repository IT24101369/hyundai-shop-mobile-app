import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Linking
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', success: '#10b981', danger: '#ef4444'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const RiderLiveTrackingScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { orderId } = route.params || {};
  const [location, setLocation] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    // If no orderId was passed, show error and don't start GPS
    if (!orderId) {
      setErrorMsg('No active order. Please accept an order first from My Deliveries.');
      return;
    }

    fetchOrderDetails();
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Start watching location
      const locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, 
          distanceInterval: 10,
        },
        (newLocation) => {
          const { latitude, longitude } = newLocation.coords;
          setLocation({ latitude, longitude });
          updateBackendLocation(latitude, longitude);
        }
      );

      return () => {
        if (locationWatcher) locationWatcher.remove();
      };
    })();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE}/orders/${orderId}`);
      setOrderDetail(response.data);
    } catch (error) {
      console.log('Error fetching order details', error);
    }
  };

  const updateBackendLocation = async (lat, lng) => {
    const riderId = user?._id || user?.id;
    if (!riderId || !orderId) {
      console.log('Cannot update location: Missing IDs', { riderId, orderId });
      return;
    }

    try {
      await axios.post(`${API_BASE}/tracking/location/update`, {
        riderId,
        orderId,
        latitude: lat,
        longitude: lng,
      });
    } catch (error) {
      console.log('Error updating backend location', error.response?.data?.message || error.message);
    }
  };

  const handleCompleteDelivery = async () => {
    Alert.alert('Complete Delivery', 'Has the order been delivered successfully?', [
      { text: 'No', style: 'cancel' },
      { 
        text: 'Yes, Delivered', 
        onPress: async () => {
          try {
            await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: 'Delivered' });
            setIsTracking(false);
            Alert.alert('Success', 'Delivery completed! Great job.');
            navigation.navigate('RiderDashboard');
          } catch (error) {
            Alert.alert('Error', 'Could not update order status');
          }
        }
      }
    ]);
  };

  const openInGoogleMaps = () => {
    if (orderDetail?.customerLat && orderDetail?.customerLng) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${orderDetail.customerLat},${orderDetail.customerLng}&travelmode=driving`;
      Linking.openURL(url);
    } else if (orderDetail?.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderDetail.address)}`;
      Linking.openURL(url);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnSmall}>
          <Text style={styles.backBtnTextSmall}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Delivery Tracking</Text>
        <View style={{ width: 60 }} />
      </View>

      {!location ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.golden} />
          <Text style={styles.loadingText}>Fetching GPS Location...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            followsUserLocation={true}
          >
            <Marker
              coordinate={location}
              title="My Position"
              description="Updating live location..."
            >
              <View style={styles.riderMarker}>
                <Text style={{ fontSize: 24 }}>🛵</Text>
              </View>
            </Marker>

            {orderDetail?.customerLat && orderDetail?.customerLng && (
              <Marker
                coordinate={{
                  latitude: orderDetail.customerLat,
                  longitude: orderDetail.customerLng,
                }}
                title="Customer Destination"
                pinColor={COLORS.danger}
              />
            )}
            
            {orderDetail?.customerLat && (
              <Polyline
                coordinates={[
                  { latitude: location.latitude, longitude: location.longitude },
                  { latitude: orderDetail.customerLat, longitude: orderDetail.customerLng }
                ]}
                strokeColor={COLORS.golden}
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>

          <View style={styles.infoPanel}>
            <View style={styles.statusRow}>
              <View style={styles.liveBadge}>
                <View style={styles.pulse} />
                <Text style={styles.liveText}>LIVE TRACKING ACTIVE</Text>
              </View>
              <Text style={styles.orderIdText}>Order: #{orderId?.slice(-6).toUpperCase()}</Text>
            </View>
            
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.navBtn} onPress={openInGoogleMaps}>
                <Text style={styles.navBtnText}>🧭 Navigate in Google Maps</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteDelivery}>
              <Text style={styles.completeBtnText}>Mark as Delivered</Text>
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
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: COLORS.gray, fontWeight: '600' },
  errorText: { color: COLORS.danger, textAlign: 'center', fontSize: 16, marginBottom: 20 },
  
  map: { flex: 1 },
  
  infoPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.diamond, padding: 25,
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 8 },
  liveText: { color: COLORS.success, fontSize: 10, fontWeight: '800' },
  orderIdText: { fontSize: 12, fontWeight: '700', color: COLORS.gray },
  
  navRow: { marginBottom: 15 },
  navBtn: { backgroundColor: COLORS.diamond, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: COLORS.golden },
  navBtnText: { color: COLORS.golden, fontSize: 14, fontWeight: '800' },

  completeBtn: { backgroundColor: COLORS.success, paddingVertical: 16, borderRadius: 15, alignItems: 'center' },
  completeBtnText: { color: COLORS.diamond, fontSize: 16, fontWeight: '800' },
  
  riderMarker: { backgroundColor: COLORS.diamond, padding: 5, borderRadius: 20, borderWidth: 2, borderColor: COLORS.golden, elevation: 5 },
  backBtnSmall: { backgroundColor: COLORS.sapphire, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnTextSmall: { color: COLORS.diamond, fontWeight: '700' }
});

export default RiderLiveTrackingScreen;
