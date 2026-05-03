import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', success: '#10b981'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const RiderCompletedOrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedOrders = async () => {
    setLoading(true);
    try {
      // We fetch all orders and filter by riderId and status 'Delivered'
      const response = await axios.get(`${API_BASE}/orders`);
      const riderId = (user?._id || user?.id || '').toString();
      const completed = response.data.filter(
        order => order.riderId && order.riderId.toString() === riderId && order.status === 'Delivered'
      );
      setOrders(completed);
    } catch (error) {
      Alert.alert('Error', 'Could not load completed orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.headerRow}>
        <Text style={styles.orderId}>ID: {item._id.substring(item._id.length - 8).toUpperCase()}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>COMPLETED ✅</Text>
        </View>
      </View>
      
      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.label}>Customer:</Text>
        <Text style={styles.value}>{item.customerName}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Address:</Text>
        <Text style={styles.value} numberOfLines={1}>{item.address}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Amount:</Text>
        <Text style={styles.amount}>Rs. {item.grandTotal.toLocaleString()}</Text>
      </View>

      <View style={styles.divider} />
      <Text style={styles.dateText}>Delivered on: {new Date(item.updatedAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Completed Deliveries</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 18 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No completed deliveries yet.</Text>
            </View>
          }
          onRefresh={fetchCompletedOrders}
          refreshing={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.silver },
  header: {
    backgroundColor: COLORS.sapphire, paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  backBtn: { padding: 5 },
  backText: { color: COLORS.diamond, fontSize: 16 },
  title: { color: COLORS.diamond, fontSize: 18, fontWeight: '700' },
  
  orderCard: {
    backgroundColor: COLORS.diamond, borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 14, fontWeight: '800', color: COLORS.gray, letterSpacing: 1 },
  statusBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: COLORS.success, fontSize: 10, fontWeight: '800' },
  
  divider: { height: 1, backgroundColor: COLORS.icyLake, marginVertical: 10 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  value: { fontSize: 13, color: COLORS.blackTie, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 10 },
  amount: { fontSize: 14, color: COLORS.sapphire, fontWeight: '800' },
  
  dateText: { fontSize: 11, color: COLORS.gray, textAlign: 'right', fontStyle: 'italic' },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 10 },
  emptyText: { fontSize: 16, color: COLORS.gray, fontWeight: '600' }
});

export default RiderCompletedOrdersScreen;
