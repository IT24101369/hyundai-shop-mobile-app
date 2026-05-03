import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const RiderOrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'mine'
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [availableRes, allRes] = await Promise.all([
        axios.get(`${API_BASE}/tracking/orders/available`),
        axios.get(`${API_BASE}/orders`),
      ]);

      setAvailableOrders(availableRes.data || []);

      const riderId = (user?._id || user?.id || '').toString();
      const mine = (allRes.data || []).filter(
        o => o.riderId && o.riderId.toString() === riderId && o.status === 'Out for Delivery'
      );
      setMyOrders(mine);
    } catch (error) {
      Alert.alert('Error', 'Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAcceptOrder = (orderId) => {
    Alert.alert('Accept Order', 'Are you sure you want to deliver this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await axios.post(`${API_BASE}/tracking/orders/${orderId}/accept`, {
              riderId: user._id || user.id,
              riderName: user.name,
            });
            Alert.alert('Success', 'Order accepted! Start tracking now.', [
              { text: 'OK', onPress: () => navigation.navigate('RiderLiveTrackingScreen', { orderId }) },
            ]);
            fetchOrders();
          } catch (error) {
            Alert.alert('Error', 'Could not accept order');
          }
        },
      },
    ]);
  };

  const handleStartNavigation = (orderId) => {
    navigation.navigate('RiderLiveTrackingScreen', { orderId });
  };

  const getPaymentBadgeColor = (method) => {
    if (method === 'Card Payment') return { bg: '#eff6ff', text: '#3b82f6' };
    return { bg: '#fef3c7', text: '#d97706' };
  };

  const renderAvailableItem = ({ item }) => {
    const payColor = getPaymentBadgeColor(item.paymentMethod);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.badge, { backgroundColor: COLORS.warning + '22' }]}>
            <Text style={[styles.badgeText, { color: COLORS.warning }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{item.customerName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Delivery Address</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{item.address}, {item.city}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📦</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Items</Text>
            <Text style={styles.infoValue}>
              {item.items?.[0]?.name}
              {item.items?.length > 1 ? ` +${item.items.length - 1} more` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalAmount}>Rs. {item.grandTotal?.toLocaleString()}</Text>
          </View>
          <View style={styles.footerRight}>
            <View style={[styles.payBadge, { backgroundColor: payColor.bg }]}>
              <Text style={[styles.payBadgeText, { color: payColor.text }]}>
                {item.paymentMethod === 'Card Payment' ? '💳 Card' : '💵 COD'}
              </Text>
            </View>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptOrder(item._id)}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderMyOrderItem = ({ item }) => {
    const payColor = getPaymentBadgeColor(item.paymentMethod);
    return (
      <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.success }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.badge, { backgroundColor: '#ecfdf5' }]}>
            <Text style={[styles.badgeText, { color: COLORS.success }]}>🚴 On the Way</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Delivering To</Text>
            <Text style={styles.infoValue}>{item.customerName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{item.address}, {item.city}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📦</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Items</Text>
            <Text style={styles.infoValue}>
              {item.items?.[0]?.name}
              {item.items?.length > 1 ? ` +${item.items.length - 1} more` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalAmount}>Rs. {item.grandTotal?.toLocaleString()}</Text>
            <View style={[styles.payBadge, { backgroundColor: payColor.bg, marginTop: 4 }]}>
              <Text style={[styles.payBadgeText, { color: payColor.text }]}>
                {item.paymentMethod === 'Card Payment' ? '💳 Card' : '💵 COD'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={() => handleStartNavigation(item._id)}>
            <Text style={styles.navBtnText}>🗺️ Navigate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const currentData = activeTab === 'available' ? availableOrders : myOrders;
  const currentRender = activeTab === 'available' ? renderAvailableItem : renderMyOrderItem;
  const emptyMsg = activeTab === 'available'
    ? 'No available orders at the moment.'
    : 'You have no active deliveries.';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Deliveries</Text>
        <TouchableOpacity onPress={fetchOrders} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            Available {availableOrders.length > 0 && `(${availableOrders.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
            My Deliveries {myOrders.length > 0 && `(${myOrders.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item._id}
          renderItem={currentRender}
          contentContainerStyle={{ padding: 18 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{activeTab === 'available' ? '📦' : '🛵'}</Text>
              <Text style={styles.emptyText}>{emptyMsg}</Text>
            </View>
          }
          onRefresh={fetchOrders}
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { padding: 5 },
  backText: { color: COLORS.diamond, fontSize: 16 },
  title: { color: COLORS.diamond, fontSize: 18, fontWeight: '700' },
  refreshBtn: { padding: 5 },
  refreshText: { color: COLORS.diamond, fontSize: 22, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.sapphire,
    paddingHorizontal: 18, paddingBottom: 0,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.golden },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: COLORS.diamond },

  card: {
    backgroundColor: COLORS.diamond, borderRadius: 16, padding: 18, marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontSize: 15, fontWeight: '800', color: COLORS.sapphire },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.icyLake, marginBottom: 14 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoIcon: { fontSize: 18, marginRight: 10, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 14, color: COLORS.blackTie, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  footerRight: { alignItems: 'flex-end', gap: 8 },
  totalLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },
  totalAmount: { fontSize: 20, fontWeight: '900', color: COLORS.golden },

  payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  payBadgeText: { fontSize: 11, fontWeight: '700' },

  acceptBtn: {
    backgroundColor: COLORS.sapphire, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  acceptBtnText: { color: COLORS.diamond, fontSize: 13, fontWeight: '800' },

  navBtn: {
    backgroundColor: COLORS.success, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, alignItems: 'center',
  },
  navBtnText: { color: COLORS.diamond, fontSize: 14, fontWeight: '800' },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 14 },
  emptyText: { fontSize: 16, color: COLORS.gray, fontWeight: '600', textAlign: 'center' },
});

export default RiderOrdersScreen;
