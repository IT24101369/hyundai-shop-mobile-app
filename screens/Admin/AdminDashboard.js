import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  sapphire: '#0f2747',
  golden: '#3b82f6',
  silver: '#f4f7fb',
  icyLake: '#e9f1fb',
  diamond: '#ffffff',
  blackTie: '#111827',
  gray: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    complaints: 0,
    payments: 0,
    promotions: 0,
  });

  useEffect(() => {
    // Stats are now loaded directly inside their respective management screens
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
        logout();
        navigation.replace('Login');
      }},
    ]);
  };

  const menuItems = [
    { icon: '📱', title: 'Inventory', subtitle: 'Manage products & stock', color: '#3b82f6' },
    { icon: '👥', title: 'Users', subtitle: 'Manage user accounts', color: '#10b981' },
    { icon: '📦', title: 'Orders', subtitle: 'View & manage orders', color: '#f59e0b' },
    { icon: '💳', title: 'Payments', subtitle: 'Transaction history', color: '#10b981' },
    { icon: '💬', title: 'Complaints', subtitle: 'Handle complaints', color: '#ef4444' },
    { icon: '🎟️', title: 'Promotions', subtitle: 'Manage promo codes', color: '#ec4899' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.sapphire} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.userName}>{user?.name || 'Admin'} 🛠️</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Badge + Live Status Strip */}
      <View style={styles.badgeContainer}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.badgeText}>🛠️ Administrator</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Menu Grid */}
        <Text style={styles.sectionTitle}>Management Modules</Text>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => {
                if (item.title === 'Inventory') {
                  navigation.navigate('InventoryScreen');
                } else if (item.title === 'Users') {
                  navigation.navigate('UserManagementScreen');
                } else if (item.title === 'Orders') {
                  navigation.navigate('AdminOrdersScreen');
                } else if (item.title === 'Payments') {
                  navigation.navigate('AdminPaymentsScreen');
                } else if (item.title === 'Complaints') {
                  navigation.navigate('AdminComplaintsScreen');
                } else if (item.title === 'Promotions') {
                  navigation.navigate('PromotionManagementScreen');
                } else {
                  Alert.alert('Coming Soon', `${item.title} module is being built!`);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.silver },
  header: {
    backgroundColor: COLORS.sapphire,
    paddingTop: 55, paddingBottom: 20, paddingHorizontal: 22,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: { fontSize: 14, color: COLORS.icyLake },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.diamond, marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  logoutText: { color: COLORS.diamond, fontSize: 13, fontWeight: '600' },

  badgeContainer: { backgroundColor: COLORS.sapphire, paddingHorizontal: 22, paddingBottom: 18 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: COLORS.diamond, fontSize: 12, fontWeight: '700' },
  livePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 5 },
  livePillText: { color: COLORS.success, fontSize: 10, fontWeight: '800' },
  emailText: { color: COLORS.icyLake, fontSize: 13, marginBottom: 14 },

  statusStrip: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8,
  },
  statusItem: { flex: 1, alignItems: 'center' },
  statusCount: { fontSize: 20, fontWeight: '900', color: COLORS.diamond },
  statusLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 3, textTransform: 'uppercase' },
  statusDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  scroll: { flex: 1, padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.sapphire, marginBottom: 14, marginTop: 8 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  statCard: {
    width: '31%', backgroundColor: COLORS.diamond, borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, elevation: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.gray },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 30 },
  menuCard: {
    backgroundColor: COLORS.diamond, borderRadius: 16, padding: 18, width: '47%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, elevation: 3,
  },
  iconCircle: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuIcon: { fontSize: 24 },
  menuTitle: { fontSize: 14, fontWeight: '700', color: COLORS.blackTie, marginBottom: 3 },
  menuSubtitle: { fontSize: 11, color: COLORS.gray },
});

export default AdminDashboard;
