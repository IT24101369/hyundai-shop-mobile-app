import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  StatusBar, Alert, ActivityIndicator, Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', lightGray: '#e5e7eb', success: '#10b981', danger: '#ef4444'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const CustomerProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/orders/user/${user?.email}`);
      setOrders(response.data);
    } catch (error) {
      console.log('Error fetching orders', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: () => {
          logout();
          navigation.replace('Login');
        }
      },
    ]);
  };

  const totalSpent = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const completedOrders = orders.filter(o => o.status === 'Delivered').length;
  const activeOrders = orders.filter(o => o.status !== 'Delivered').length;

  const getInitials = (name = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status) => {
    if (status === 'Delivered') return COLORS.success;
    if (status === 'Out for Delivery') return '#f59e0b';
    if (status === 'Processing') return COLORS.golden;
    return COLORS.gray;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.sapphire} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'Customer'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>🛒 Customer Account</Text>
          </View>
        </View>

        {/* Stats Row */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.golden} style={{ margin: 20 }} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{orders.length}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{completedOrders}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: COLORS.golden }]}>{activeOrders}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#8b5cf6', fontSize: 13 }]}>Rs.{(totalSpent / 1000).toFixed(0)}k</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
          </View>
        )}

        {/* Account Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <View>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.name || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📧</Text>
            <View>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔑</Text>
            <View>
              <Text style={styles.infoLabel}>Account Role</Text>
              <Text style={styles.infoValue}>Customer</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet. Start shopping! 🛒</Text>
          ) : (
            orders.slice(0, 5).map((order) => (
              <View key={order._id} style={styles.orderRow}>
                <View style={styles.orderLeft}>
                  <Text style={styles.orderIdText}>#{order._id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.orderItemText} numberOfLines={1}>
                    {order.items?.[0]?.name}
                    {order.items?.length > 1 ? ` +${order.items.length - 1} more` : ''}
                  </Text>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                </View>
                <View>
                  <Text style={styles.orderAmount}>Rs. {order.grandTotal?.toLocaleString()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '22', borderColor: getStatusColor(order.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CustomerPaymentsScreen')}>
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>Payment History</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddComplaintScreen')}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Submit a Complaint</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('CartScreen')}>
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionText}>View My Cart</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutFullBtn} onPress={handleLogout}>
          <Text style={styles.logoutFullText}>🚪 Logout from Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.silver },

  header: {
    backgroundColor: COLORS.sapphire, paddingTop: 55, paddingBottom: 20,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  headerTitle: { color: COLORS.diamond, fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 5 },
  backText: { color: COLORS.diamond, fontSize: 15 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  logoutText: { color: COLORS.diamond, fontSize: 12, fontWeight: '600' },

  scroll: { flex: 1, padding: 16 },

  // Profile Card
  profileCard: {
    backgroundColor: COLORS.sapphire, borderRadius: 24, padding: 28,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.golden, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)'
  },
  avatarText: { color: COLORS.diamond, fontSize: 32, fontWeight: '900' },
  profileName: { color: COLORS.diamond, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  profileEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 12 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  roleText: { color: COLORS.diamond, fontSize: 12, fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.diamond, borderRadius: 14, padding: 14,
    alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5
  },
  statValue: { fontSize: 20, fontWeight: '900', color: COLORS.sapphire },
  statLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600', marginTop: 3, textAlign: 'center' },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.diamond, borderRadius: 16, padding: 18, marginBottom: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.sapphire, marginBottom: 16 },

  // Info Rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  infoIcon: { fontSize: 22, marginRight: 14 },
  infoLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  infoValue: { fontSize: 15, color: COLORS.blackTie, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.icyLake, marginVertical: 12 },

  // Orders
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.silver
  },
  orderLeft: { flex: 1, marginRight: 10 },
  orderIdText: { fontSize: 13, fontWeight: '800', color: COLORS.blackTie },
  orderItemText: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  orderDate: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  orderAmount: { fontSize: 13, fontWeight: '700', color: COLORS.sapphire, textAlign: 'right', marginBottom: 4 },
  statusBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignItems: 'center' },
  statusText: { fontSize: 10, fontWeight: '700' },
  emptyText: { color: COLORS.gray, textAlign: 'center', paddingVertical: 20 },

  // Quick Actions
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.silver
  },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.blackTie },
  actionArrow: { fontSize: 18, color: COLORS.golden, fontWeight: 'bold' },

  // Logout
  logoutFullBtn: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8
  },
  logoutFullText: { color: COLORS.danger, fontSize: 15, fontWeight: '800' },
});

export default CustomerProfileScreen;
