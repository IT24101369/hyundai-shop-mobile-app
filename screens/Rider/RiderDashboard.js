import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator, Platform
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
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const RiderDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({
    assigned: 0,
    delivered: 0,
    pending: 0,
    earnings: 0,
  });

  useEffect(() => {
    fetchRiderStats();
  }, []);

  const fetchRiderStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/orders`).catch(() => ({ data: [] }));
      const riderId = (user?._id || user?.id || '').toString();
      const allOrders = response.data || [];
      const myOrders = allOrders.filter(o => o.riderId && o.riderId.toString() === riderId);

      const delivered = myOrders.filter(o => o.status === 'Delivered').length;
      const pending = myOrders.filter(o => o.status === 'Out for Delivery').length;
      const earnings = myOrders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

      setLiveStats({
        assigned: myOrders.length,
        delivered,
        pending,
        earnings,
      });
    } catch (e) {
      console.log('Rider stats error', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        logout();
        navigation.replace('Login');
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          logout();
          navigation.replace('Login');
        }},
      ]);
    }
  };

  const menuItems = [
    { icon: '📦', title: 'My Deliveries', subtitle: 'View assigned orders', color: '#3b82f6' },
    { icon: '🗺️', title: 'Navigation', subtitle: 'Get directions', color: '#10b981' },
    { icon: '✅', title: 'Completed', subtitle: 'Delivery history', color: '#f59e0b' },
    { icon: '👤', title: 'My Profile', subtitle: 'Account settings', color: '#0f2747' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.sapphire} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Rider Portal</Text>
          <Text style={styles.userName}>{user?.name || 'Rider'} 🚴</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Badge + Live Status Strip */}
      <View style={styles.badgeContainer}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
            <Text style={styles.badgeText}>🚴 Delivery Rider</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.emailText}>{user?.email}</Text>

        {/* Live Status Strip */}
        <View style={styles.statusStrip}>
          <View style={styles.statusItem}>
            <Text style={styles.statusCount}>{liveStats.assigned}</Text>
            <Text style={styles.statusLabel}>Assigned</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={[styles.statusCount, { color: COLORS.warning }]}>{liveStats.pending}</Text>
            <Text style={styles.statusLabel}>Active</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={[styles.statusCount, { color: COLORS.success }]}>{liveStats.delivered}</Text>
            <Text style={styles.statusLabel}>Delivered</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={[styles.statusCount, { color: '#a78bfa', fontSize: 13 }]}>
              Rs.{liveStats.earnings >= 1000 ? (liveStats.earnings / 1000).toFixed(0) + 'k' : liveStats.earnings}
            </Text>
            <Text style={styles.statusLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Active Delivery Banner */}
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerTitle}>🚴 Ready to Deliver!</Text>
          <Text style={styles.activeBannerSub}>
            {liveStats.pending > 0
              ? `${liveStats.pending} active delivery in progress.`
              : 'No active delivery assigned yet.'}
          </Text>
        </View>

        {/* Stats Row */}
        <Text style={styles.sectionTitle}>Today's Stats</Text>
        {statsLoading ? (
          <ActivityIndicator color={COLORS.golden} style={{ marginBottom: 16 }} />
        ) : (
          <View style={styles.statsRow}>
            {[
              { label: 'Assigned', value: liveStats.assigned, icon: '📦', color: COLORS.golden },
              { label: 'Delivered', value: liveStats.delivered, icon: '✅', color: COLORS.success },
              { label: 'Active', value: liveStats.pending, icon: '⏳', color: COLORS.warning },
              {
                label: 'Earnings',
                value: liveStats.earnings >= 1000 ? 'Rs.' + (liveStats.earnings / 1000).toFixed(0) + 'k' : 'Rs.' + liveStats.earnings,
                icon: '💰',
                color: '#8b5cf6',
              },
            ].map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Menu */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => {
                if (item.title === 'My Deliveries') {
                  navigation.navigate('RiderOrdersScreen');
                } else if (item.title === 'Completed') {
                  navigation.navigate('RiderCompletedOrders');
                } else if (item.title === 'Navigation') {
                  navigation.navigate('RiderLiveTrackingScreen');
                } else if (item.title === 'My Profile') {
                  navigation.navigate('RiderProfileScreen');
                } else {
                  if (Platform.OS === 'web') window.alert(`${item.title} module is being built!`);
                  else Alert.alert('Coming Soon', `${item.title} module is being built!`);
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
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
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

  activeBanner: {
    backgroundColor: COLORS.sapphire, borderRadius: 18, padding: 20, marginBottom: 6,
    borderLeftWidth: 5, borderLeftColor: '#10b981',
  },
  activeBannerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.diamond, marginBottom: 4 },
  activeBannerSub: { fontSize: 13, color: COLORS.icyLake },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1, backgroundColor: COLORS.diamond, borderRadius: 14, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, elevation: 3,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.gray },

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

export default RiderDashboard;
