import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image
} from 'react-native';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop';

const ProductImage = ({ uri }) => {
  const [error, setError] = useState(false);
  return (
    <Image 
      source={{ uri: error || !uri ? FALLBACK_IMG : uri }} 
      style={styles.productImg} 
      onError={() => setError(true)}
    />
  );
};

const AdminCartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/cart`);
      setCartItems(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load cart items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleDelete = (id) => {
    Alert.alert('Remove Item', 'Delete this item from the global cart?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', style: 'destructive', 
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE}/cart/${id}`);
            fetchCart();
          } catch (error) {
            Alert.alert('Error', 'Could not delete item');
          }
        }
      }
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to delete ALL items in the cart?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Clear All', style: 'destructive', 
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE}/cart/clear`);
            fetchCart();
          } catch (error) {
            Alert.alert('Error', 'Could not clear cart');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.cartCard}>
      <ProductImage uri={item.image} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>Rs. {item.price.toLocaleString()} x {item.quantity}</Text>
        <Text style={styles.itemTotal}>Total: Rs. {(item.price * item.quantity).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
        <Text style={styles.deleteBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cart Management</Text>
        {cartItems.length > 0 ? (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 45 }} />}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 18 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No items in cart.</Text>}
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
  clearText: { color: COLORS.danger, fontSize: 16, fontWeight: '700' },
  
  cartCard: {
    backgroundColor: COLORS.diamond, borderRadius: 12, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  productImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: COLORS.icyLake, marginRight: 14 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.blackTie, marginBottom: 4 },
  itemPrice: { fontSize: 13, color: COLORS.gray, marginBottom: 2 },
  itemTotal: { fontSize: 14, color: COLORS.golden, fontWeight: '700' },
  
  deleteBtn: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8 },
  deleteBtnText: { fontSize: 16 },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.gray, fontSize: 16 }
});

export default AdminCartScreen;
