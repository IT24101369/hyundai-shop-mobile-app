import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Image, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981'
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

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/cart`);
      setCartItems(response.data);
    } catch (error) {
      console.log('Error fetching cart', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const toggleSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const updateQuantity = async (id, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty <= 0) {
      removeItem(id);
      return;
    }
    try {
      await axios.put(`${API_BASE}/cart/${id}`, { quantity: newQty });
      fetchCart();
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = async (id) => {
    try {
      await axios.delete(`${API_BASE}/cart/${id}`);
      fetchCart();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  const calculateTotal = () => {
    return cartItems
      .filter(item => selectedItems.includes(item._id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item._id);
    const isFav = favorites.includes(item._id);

    return (
      <View style={[styles.cartCard, isSelected && styles.cartCardSelected]}>
        {/* Selection Checkbox */}
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => toggleSelection(item._id)}>
          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        <ProductImage uri={item.image} />
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemPrice}>Rs. {item.price.toLocaleString()}</Text>
          
          <View style={styles.qtyContainer}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, item.quantity, -1)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, item.quantity, 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionCol}>
          <TouchableOpacity style={styles.favBtn} onPress={() => toggleFavorite(item._id)}>
            <Text style={styles.favIcon}>{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item._id)}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Cart</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 18 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>Your cart is empty.</Text>
              <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.continueBtnText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Selected Total:</Text>
            <Text style={styles.totalValue}>Rs. {calculateTotal().toLocaleString()}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutBtn, selectedItems.length === 0 && { backgroundColor: COLORS.gray }]} 
            disabled={selectedItems.length === 0}
            onPress={() => {
              const selectedObjects = cartItems.filter(item => selectedItems.includes(item._id));
              navigation.navigate('CheckoutScreen', { cartItems: selectedObjects, totalAmount: calculateTotal() });
            }}
          >
            <Text style={styles.checkoutBtnText}>Checkout ({selectedItems.length} items)</Text>
          </TouchableOpacity>
        </View>
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
  
  cartCard: {
    backgroundColor: COLORS.diamond, borderRadius: 12, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    borderWidth: 1, borderColor: 'transparent'
  },
  cartCardSelected: { borderColor: COLORS.golden, backgroundColor: COLORS.icyLake },
  checkboxContainer: { padding: 5, marginRight: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.gray, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.golden, borderColor: COLORS.golden },
  checkmark: { color: COLORS.diamond, fontSize: 14, fontWeight: '800' },
  productImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: COLORS.icyLake, marginRight: 14 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.blackTie, marginBottom: 4 },
  itemPrice: { fontSize: 13, color: COLORS.golden, fontWeight: '800', marginBottom: 8 },
  
  qtyContainer: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { backgroundColor: COLORS.diamond, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 1, shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  qtyBtnText: { color: COLORS.sapphire, fontSize: 16, fontWeight: '600' },
  qtyText: { marginHorizontal: 12, fontSize: 14, fontWeight: '700', color: COLORS.blackTie },
  
  actionCol: { justifyContent: 'space-between', alignItems: 'flex-end', height: 60 },
  favBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  favIcon: { fontSize: 16 },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  removeBtnText: { color: COLORS.danger, fontSize: 16, fontWeight: '800' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 10 },
  emptyText: { fontSize: 18, color: COLORS.gray, marginBottom: 20 },
  continueBtn: { backgroundColor: COLORS.golden, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  continueBtnText: { color: COLORS.diamond, fontWeight: '700' },
  
  footer: {
    backgroundColor: COLORS.diamond, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: COLORS.gray, fontWeight: '600' },
  totalValue: { fontSize: 20, color: COLORS.sapphire, fontWeight: '800' },
  checkoutBtn: { backgroundColor: COLORS.golden, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  checkoutBtnText: { color: COLORS.diamond, fontSize: 16, fontWeight: '800', letterSpacing: 1 }
});

export default CartScreen;
