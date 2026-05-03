import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  StatusBar, ActivityIndicator, Alert, Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', lightGray: '#e5e7eb', success: '#10b981', danger: '#ef4444', warning: '#f59e0b'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const CustomerPaymentsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Fetch all payments and filter by user email on frontend for simplicity, 
      // or implement a backend route for user payments.
      // Since we don't have a specific route yet, we use the general one and filter.
      const response = await axios.get(`${API_BASE}/payments`);
      const userPayments = response.data.filter(p => p.email === user?.email);
      setPayments(userPayments);
    } catch (error) {
      console.log('Error fetching payments', error);
      Alert.alert('Error', 'Could not load payment history.');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentItem = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.methodBadge}>
          <Text style={styles.methodText}>{item.paymentMethod}</Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.mainInfo}>
          <Text style={styles.idLabel}>Payment Reference</Text>
          <Text style={styles.idValue}>{item.paymentId}</Text>
          {item.orderId && (
            <Text style={styles.orderRef}>Order: #{item.orderId.slice(-6).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.amountInfo}>
          <Text style={styles.amountText}>Rs. {item.amount.toLocaleString()}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'PAID' ? COLORS.success + '22' : COLORS.warning + '22',
              borderColor: item.status === 'PAID' ? COLORS.success : COLORS.warning }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: item.status === 'PAID' ? COLORS.success : COLORS.warning }
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
      
      {item.paymentMethod === 'CARD' && item.cardNumber && (
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>💳 {item.cardNumber}</Text>
        </View>
      )}
      {item.paymentMethod === 'COD' && item.status === 'NON PAID' && (
        <View style={styles.codHint}>
          <Text style={styles.codHintText}>💡 Please pay upon delivery to the rider.</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.sapphire} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <TouchableOpacity onPress={fetchPayments} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.golden} />
          <Text style={styles.loadingText}>Fetching transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No Payments Yet</Text>
              <Text style={styles.emptySub}>Your transaction history will appear here after you place an order.</Text>
            </View>
          }
          onRefresh={fetchPayments}
          refreshing={loading}
        />
      )}
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
  refreshBtn: { padding: 5 },
  refreshText: { fontSize: 18 },

  listContent: { padding: 16, paddingBottom: 40 },
  paymentCard: {
    backgroundColor: COLORS.diamond, borderRadius: 16, padding: 18, marginBottom: 15,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  methodBadge: { backgroundColor: COLORS.icyLake, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  methodText: { fontSize: 11, fontWeight: '800', color: COLORS.golden, letterSpacing: 0.5 },
  dateText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },

  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainInfo: { flex: 1 },
  idLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginBottom: 2 },
  idValue: { fontSize: 14, fontWeight: '700', color: COLORS.blackTie },
  orderRef: { fontSize: 12, color: COLORS.golden, fontWeight: '600', marginTop: 4 },
  
  amountInfo: { alignItems: 'flex-end' },
  amountText: { fontSize: 17, fontWeight: '900', color: COLORS.sapphire, marginBottom: 6 },
  statusBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  cardFooter: { borderTopWidth: 1, borderTopColor: COLORS.silver, marginTop: 15, paddingTop: 12 },
  footerText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },

  codHint: { backgroundColor: '#fffbeb', borderLeftWidth: 4, borderLeftColor: COLORS.warning, padding: 10, marginTop: 15, borderRadius: 4 },
  codHintText: { fontSize: 11, color: '#92400e', fontWeight: '600' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, color: COLORS.gray, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 20, opacity: 0.3 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.sapphire, marginBottom: 10 },
  emptySub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 20 }
});

export default CustomerPaymentsScreen;
