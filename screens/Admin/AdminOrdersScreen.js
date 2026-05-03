import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator, Linking
} from 'react-native';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981', warning: '#f59e0b'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const AdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/orders`);
      setOrders(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = (id, currentStatus) => {
    Alert.alert('Update Status', `Current: ${currentStatus}`, [
      { text: 'Pending', onPress: () => updateStatus(id, 'Pending') },
      { text: 'Processing', onPress: () => updateStatus(id, 'Processing') },
      { text: 'Shipped', onPress: () => updateStatus(id, 'Shipped') },
      { text: 'Delivered', onPress: () => updateStatus(id, 'Delivered') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE}/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', style: 'destructive', 
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE}/orders/${id}`);
            fetchOrders();
          } catch (error) {
            Alert.alert('Error', 'Could not delete order');
          }
        }
      }
    ]);
  };

  const openMap = (address) => {
    if (address) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
      Linking.openURL(url);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.headerRow}>
        <Text style={styles.orderId}>ID: {item._id.substring(item._id.length - 8).toUpperCase()}</Text>
        <TouchableOpacity style={styles.statusBadge} onPress={() => handleUpdateStatus(item._id, item.status)}>
          <Text style={styles.statusText}>{item.status}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.label}>Customer:</Text>
        <Text style={styles.value}>{item.customerName}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Method:</Text>
        <Text style={styles.value}>{item.paymentMethod}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Payment Status:</Text>
        <Text style={[styles.value, { color: item.paymentStatus === 'Paid' ? COLORS.success : COLORS.warning }]}>
          {item.paymentStatus}
        </Text>
      </View>
      
      <View style={styles.addressBox}>
        <Text style={styles.label}>Address:</Text>
        <Text style={styles.addressText}>{item.address}</Text>
        <TouchableOpacity style={styles.mapBtn} onPress={() => openMap(item.address)}>
          <Text style={styles.mapBtnText}>📍 Locate on Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.label}>Items ({item.items.length}):</Text>
        <Text style={styles.value}>Rs. {item.subtotal.toLocaleString()}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.grandTotalLabel}>{item.paymentStatus === 'Paid' ? 'Total Paid:' : 'Total To Pay:'}</Text>
        <Text style={styles.grandTotalValue}>Rs. {item.grandTotal.toLocaleString()}</Text>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
        <Text style={styles.deleteBtnText}>Delete Order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orders Dashboard</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{orders.length}</Text>
          <Text style={styles.overviewLabel}>Total Orders</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: COLORS.warning }]}>
            {orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length}
          </Text>
          <Text style={styles.overviewLabel}>Pending / Proc.</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 18 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders received yet.</Text>}
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
  
  overviewContainer: { flexDirection: 'row', paddingHorizontal: 18, paddingTop: 18, gap: 12 },
  overviewCard: { flex: 1, backgroundColor: COLORS.diamond, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08 },
  overviewValue: { fontSize: 20, fontWeight: '800', color: COLORS.sapphire, marginBottom: 4 },
  overviewLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },

  orderCard: {
    backgroundColor: COLORS.diamond, borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 14, fontWeight: '800', color: COLORS.gray, letterSpacing: 1 },
  statusBadge: { backgroundColor: COLORS.icyLake, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.golden },
  statusText: { color: COLORS.sapphire, fontSize: 12, fontWeight: '800' },
  
  divider: { height: 1, backgroundColor: COLORS.icyLake, marginVertical: 12 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  value: { fontSize: 13, color: COLORS.blackTie, fontWeight: '700' },
  
  addressBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginTop: 8 },
  addressText: { fontSize: 13, color: COLORS.blackTie, fontWeight: '600', marginBottom: 8 },
  mapBtn: { backgroundColor: COLORS.sapphire, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  mapBtnText: { color: COLORS.diamond, fontSize: 13, fontWeight: '700' },
  
  grandTotalLabel: { fontSize: 15, color: COLORS.sapphire, fontWeight: '800' },
  grandTotalValue: { fontSize: 15, color: COLORS.golden, fontWeight: '800' },
  
  deleteBtn: { marginTop: 14, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 6 },
  deleteBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.gray, fontSize: 16 }
});

export default AdminOrdersScreen;
