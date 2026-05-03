import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981', warning: '#f59e0b'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const AdminPaymentsScreen = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/payments`);
      setPayments(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.paymentId}>#{item.paymentId}</Text>
          <Text style={styles.dateText}>{new Date(item.paymentDate || item.createdAt).toLocaleString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'PAID' ? '#ecfdf5' : '#fff7ed' }]}>
          <Text style={[styles.statusText, { color: item.status === 'PAID' ? COLORS.success : COLORS.warning }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.label}>Customer:</Text>
        <Text style={styles.value}>{item.fullName}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{item.email}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>Method:</Text>
        <Text style={styles.value}>{item.paymentMethod === 'CARD' ? '💳 Card Payment' : item.paymentMethod}</Text>
      </View>
      
      {item.cardNumber && (
        <View style={styles.infoRow}>
          <Text style={styles.label}>Card Info:</Text>
          <Text style={styles.value}>{item.cardNumber}</Text>
        </View>
      )}

      <View style={styles.addressBox}>
        <Text style={styles.label}>Billing Address:</Text>
        <Text style={styles.addressText}>{item.address}, {item.city}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total Transaction</Text>
        <Text style={styles.amountValue}>Rs. {item.amount.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment History</Text>
        <TouchableOpacity onPress={fetchPayments} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{payments.length}</Text>
          <Text style={styles.overviewLabel}>Total Transactions</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: COLORS.success }]}>
            Rs. {payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
          </Text>
          <Text style={styles.overviewLabel}>Total Revenue</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.golden} />
          <Text style={styles.loadingText}>Fetching Records...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No payment records found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.silver },
  header: {
    backgroundColor: COLORS.sapphire, paddingTop: 55, paddingBottom: 20, paddingHorizontal: 22,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  backBtn: { padding: 5 },
  backText: { color: COLORS.diamond, fontSize: 16 },
  title: { color: COLORS.diamond, fontSize: 18, fontWeight: '700' },
  refreshBtn: { padding: 5 },
  refreshText: { fontSize: 20 },
  
  overviewContainer: { flexDirection: 'row', paddingHorizontal: 18, paddingTop: 18, gap: 12 },
  overviewCard: { flex: 1, backgroundColor: COLORS.diamond, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08 },
  overviewValue: { fontSize: 20, fontWeight: '800', color: COLORS.sapphire, marginBottom: 4 },
  overviewLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },

  paymentCard: {
    backgroundColor: COLORS.diamond, borderRadius: 20, padding: 20, marginBottom: 18,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  paymentId: { fontSize: 15, fontWeight: '800', color: COLORS.blackTie, marginBottom: 2 },
  dateText: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800' },
  
  divider: { height: 1, backgroundColor: COLORS.icyLake, marginVertical: 12 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  value: { fontSize: 12, color: COLORS.blackTie, fontWeight: '700', flex: 1, textAlign: 'right', marginLeft: 10 },
  
  addressBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: COLORS.icyLake },
  addressText: { fontSize: 12, color: COLORS.blackTie, fontWeight: '600', marginTop: 4 },
  
  amountContainer: {
    marginTop: 20, paddingTop: 15, borderTopWidth: 2, borderTopColor: COLORS.icyLake,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  amountLabel: { fontSize: 14, fontWeight: '700', color: COLORS.gray },
  amountValue: { fontSize: 18, fontWeight: '800', color: COLORS.golden },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 10, color: COLORS.gray, fontWeight: '600' },
  emptyText: { color: COLORS.gray, fontSize: 15, fontWeight: '600' }
});

export default AdminPaymentsScreen;
