import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput, ScrollView
} from 'react-native';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981', warning: '#f59e0b'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const PromotionManagementScreen = ({ navigation }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Promo Form
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/promotions`);
      setPromotions(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleAddPromotion = async () => {
    if (!promoCode || !discount) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}/promotions`, {
        promoCode: promoCode.toUpperCase(),
        discountPercentage: parseFloat(discount),
        isActive: true
      });
      setPromoCode('');
      setDiscount('');
      fetchPromotions();
      Alert.alert('Success', 'Promotion added successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add promotion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${API_BASE}/promotions/${id}`, { isActive: !currentStatus });
      fetchPromotions();
    } catch (error) {
      Alert.alert('Error', 'Failed to update promotion status');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Promo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', style: 'destructive', 
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE}/promotions/${id}`);
            fetchPromotions();
          } catch (error) {
            Alert.alert('Error', 'Could not delete promotion');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.promoCard}>
      <View style={styles.promoInfo}>
        <Text style={styles.promoCodeText}>{item.promoCode}</Text>
        <Text style={styles.promoDiscountText}>{item.discountPercentage}% OFF</Text>
      </View>
      <View style={styles.promoActions}>
        <TouchableOpacity onPress={() => handleToggleStatus(item._id, item.isActive)}>
          <View style={[styles.statusTag, { backgroundColor: item.isActive ? COLORS.success + '20' : COLORS.gray + '20' }]}>
            <Text style={[styles.statusTagText, { color: item.isActive ? COLORS.success : COLORS.gray }]}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Promotion Portal</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.overviewContainer}>
          <View style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{promotions.length}</Text>
            <Text style={styles.overviewLabel}>Total Promos</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={[styles.overviewValue, { color: COLORS.success }]}>
              {promotions.filter(p => p.isActive).length}
            </Text>
            <Text style={styles.overviewLabel}>Active Promos</Text>
          </View>
        </View>

        {/* Add New Promo Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Create New Promo Code</Text>
          <View style={styles.formRow}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Code</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. SAVE20" 
                value={promoCode} 
                onChangeText={setPromoCode}
                autoCapitalize="characters"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.label}>Discount %</Text>
              <TextInput 
                style={styles.input} 
                placeholder="20" 
                value={discount} 
                onChangeText={setDiscount}
                keyboardType="numeric"
              />
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.addBtn, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleAddPromotion}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color={COLORS.diamond} /> : <Text style={styles.addBtnText}>Add Promo Code</Text>}
          </TouchableOpacity>
        </View>

        {/* List Section */}
        <Text style={styles.sectionTitleList}>Active Promotions</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.listContainer}>
            {promotions.map((item) => (
              <View key={item._id}>{renderItem({ item })}</View>
            ))}
            {promotions.length === 0 && <Text style={styles.emptyText}>No promotions found.</Text>}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
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

  overviewContainer: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  overviewCard: { flex: 1, backgroundColor: COLORS.diamond, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08 },
  overviewValue: { fontSize: 20, fontWeight: '800', color: COLORS.sapphire, marginBottom: 4 },
  overviewLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },

  content: { padding: 18 },
  card: {
    backgroundColor: COLORS.diamond, borderRadius: 16, padding: 20, marginBottom: 25,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.sapphire, marginBottom: 15 },
  sectionTitleList: { fontSize: 16, fontWeight: '800', color: COLORS.sapphire, marginBottom: 15, marginLeft: 5 },
  
  label: { fontSize: 12, fontWeight: '700', color: COLORS.gray, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.silver, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: COLORS.blackTie, borderWidth: 1, borderColor: COLORS.icyLake },
  formRow: { flexDirection: 'row', marginBottom: 20 },
  
  addBtn: { backgroundColor: COLORS.golden, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: COLORS.diamond, fontSize: 16, fontWeight: '800' },

  listContainer: { gap: 12 },
  promoCard: {
    backgroundColor: COLORS.diamond, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderLeftWidth: 5, borderLeftColor: COLORS.golden, elevation: 2
  },
  promoCodeText: { fontSize: 18, fontWeight: '800', color: COLORS.blackTie },
  promoDiscountText: { fontSize: 14, fontWeight: '700', color: COLORS.golden, marginTop: 2 },
  promoActions: { alignItems: 'flex-end', gap: 8 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  deleteText: { fontSize: 18 },

  emptyText: { textAlign: 'center', marginTop: 20, color: COLORS.gray, fontSize: 14 }
});

export default PromotionManagementScreen;
