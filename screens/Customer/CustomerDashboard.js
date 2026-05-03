import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  FlatList, StatusBar, Alert, Image, TextInput, Dimensions, Modal, ScrollView, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', lightGray: '#e5e7eb', success: '#10b981', danger: '#ef4444'
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop';

const ProductImage = React.memo(({ uri }) => {
  const [error, setError] = useState(false);
  return (
    <Image 
      source={{ uri: error || !uri ? FALLBACK_IMG : uri }} 
      style={styles.productImage} 
      onError={() => setError(true)}
    />
  );
});

const ProductCard = React.memo(({ product, onAddToCart, onPress }) => (
  <TouchableOpacity
    style={styles.productCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <ProductImage uri={product.image} />
    <View style={styles.productInfo}>
      <Text style={styles.productTitle} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.productPrice}>Rs. {Number(product.price || 0).toLocaleString()}</Text>
      
      <View style={styles.extraInfo}>
        <Text style={[styles.stockText, { color: product.stock > 0 ? COLORS.success : COLORS.danger }]}>
          {product.stock > 0 ? '● In Stock' : '● Out of Stock'}
        </Text>
        <Text style={styles.deliveryText}>🚚 Delivery: Rs. 500</Text>
      </View>

      <TouchableOpacity 
        style={[styles.addToCartBtn, product.stock <= 0 && { backgroundColor: COLORS.gray }]} 
        disabled={product.stock <= 0}
        onPress={() => onAddToCart(product)}
      >
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
));

const CustomerDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showPromo, setShowPromo] = useState(false);
  const [activePromo, setActivePromo] = useState(null);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://hyundai-shop-backend-api.onrender.com/api/products');
      setProducts(response.data);
    } catch (error) {
      console.log('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    const fetchPromo = async () => {
      try {
        const response = await axios.get('https://hyundai-shop-backend-api.onrender.com/api/promotions');
        const active = response.data.find(p => p.isActive);
        if (active) {
          setActivePromo(active);
          setTimeout(() => setShowPromo(true), 3000);
        }
      } catch (error) {
        console.log('Error fetching promo', error);
      }
    };
    fetchPromo();
  }, [fetchProducts]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
        logout();
        navigation.replace('Login');
      }},
    ]);
  };

  const handleAddToCart = useCallback(async (product) => {
    try {
      await axios.post('https://hyundai-shop-backend-api.onrender.com/api/cart', {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image || FALLBACK_IMG,
        quantity: 1
      });
      navigation.navigate('CartScreen');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    }
  }, [navigation]);

  const handleTrackOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://hyundai-shop-backend-api.onrender.com/api/orders/user/${user?.email}`);
      const orders = response.data;
      
      if (orders && orders.length > 0) {
        const trackable = orders.filter(o => o.status !== 'Delivered');
        if (trackable.length === 1) {
          navigation.navigate('CustomerTrackingScreen', { orderId: trackable[0]._id });
        } else if (trackable.length > 1) {
          setActiveOrders(trackable);
          setShowTrackModal(true);
        } else {
          navigation.navigate('CustomerTrackingScreen', { orderId: orders[0]._id });
        }
      } else {
        Alert.alert('No Orders Found', 'You do not have any orders to track.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not retrieve your orders.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const ListHeader = () => (
    <>
      <View style={styles.imageBannerContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80' }} 
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.imageBannerTitle}>Hyundai Premier</Text>
          <Text style={styles.imageBannerSub}>Discover the latest technology</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Explore Products</Text>
    </>
  );

  const bottomNavItems = [
    { icon: '🛒', label: 'Cart', screen: 'Cart' },
    { icon: '📦', label: 'Orders', screen: 'Orders' },
    { icon: '🚚', label: 'Track', screen: 'Tracking' },
    { icon: '💬', label: 'Help', screen: 'Complaints' },
    { icon: '👤', label: 'Profile', screen: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.sapphire} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Customer'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search phones, accessories..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            onAddToCart={handleAddToCart}
            onPress={() => Alert.alert(item.name, `Price: Rs. ${item.price}\n\n${item.description}`)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchProducts}
        refreshing={loading}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No products available yet.</Text>
        }
      />

      {/* Promo Modal */}
      <Modal animationType="fade" transparent={true} visible={showPromo}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPromo(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.promoBadge}><Text style={styles.promoBadgeText}>Special Offer!</Text></View>
            <Text style={styles.modalTitle}>Exclusive Discount</Text>
            <Text style={styles.modalDiscount}>{activePromo?.discountPercentage}% OFF</Text>
            <Text style={styles.modalSub}>Use the code below at checkout to save on your purchase.</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{activePromo?.promoCode}</Text>
              <TouchableOpacity 
                style={styles.miniCopyBtn} 
                onPress={async () => {
                  if (activePromo?.promoCode) {
                    await Clipboard.setStringAsync(activePromo.promoCode);
                    Alert.alert('✅ Copied', 'Promo code copied to clipboard!');
                  }
                }}
              >
                <Text style={styles.miniCopyText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={() => setShowPromo(false)}>
              <Text style={styles.copyBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomBar}>
        {bottomNavItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.bottomNavBtn}
            onPress={() => {
              if (item.label === 'Cart') navigation.navigate('CartScreen');
              else if (item.label === 'Track') handleTrackOrder();
              else if (item.label === 'Help') navigation.navigate('AddComplaintScreen');
              else if (item.label === 'Profile') navigation.navigate('CustomerProfileScreen');
            }}
          >
            <Text style={styles.bottomNavIcon}>{item.icon}</Text>
            <Text style={styles.bottomNavText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Track Selection Modal */}
      <Modal animationType="slide" transparent={true} visible={showTrackModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.trackModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track Your Order</Text>
              <TouchableOpacity onPress={() => setShowTrackModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {activeOrders.map((order) => (
                <TouchableOpacity 
                  key={order._id} 
                  style={styles.trackOrderItem}
                  onPress={() => {
                    setShowTrackModal(false);
                    navigation.navigate('CustomerTrackingScreen', { orderId: order._id });
                  }}
                >
                  <View>
                    <Text style={styles.trackOrderTitle}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.trackOrderSub}>{order.items[0]?.name} | {order.status}</Text>
                  </View>
                  <Text style={styles.trackArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.silver },
  header: {
    backgroundColor: COLORS.sapphire, paddingTop: 55, paddingBottom: 25, paddingHorizontal: 22,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 5, zIndex: 10,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: COLORS.icyLake },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.diamond, marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: COLORS.diamond, fontSize: 13, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.diamond, borderRadius: 16, paddingHorizontal: 16, height: 50 },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.blackTie, height: '100%' },

  scrollContent: { padding: 18, paddingBottom: 100 },
  imageBannerContainer: { width: '100%', height: 180, borderRadius: 20, overflow: 'hidden', marginBottom: 24, elevation: 4 },
  bannerImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.3)' },
  imageBannerTitle: { color: COLORS.diamond, fontSize: 22, fontWeight: 'bold' },
  imageBannerSub: { color: COLORS.silver, fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.sapphire, marginBottom: 16 },

  columnWrapper: { justifyContent: 'space-between', marginBottom: 15 },
  productCard: { backgroundColor: COLORS.diamond, borderRadius: 16, width: '48.5%', overflow: 'hidden', elevation: 3 },
  productImage: { width: '100%', height: 120, backgroundColor: COLORS.icyLake },
  productInfo: { padding: 12 },
  productTitle: { fontSize: 14, fontWeight: '700', color: COLORS.blackTie, marginBottom: 4 },
  productPrice: { fontSize: 13, color: COLORS.golden, fontWeight: '800', marginBottom: 6 },
  extraInfo: { marginBottom: 10, backgroundColor: COLORS.silver, padding: 6, borderRadius: 6 },
  stockText: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  deliveryText: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },
  addToCartBtn: { backgroundColor: COLORS.sapphire, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  addToCartText: { color: COLORS.diamond, fontSize: 12, fontWeight: '600' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 75,
    backgroundColor: COLORS.diamond, flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingBottom: 15, elevation: 20
  },
  bottomNavBtn: { alignItems: 'center', justifyContent: 'center' },
  bottomNavIcon: { fontSize: 22, marginBottom: 4 },
  bottomNavText: { fontSize: 10, fontWeight: '600', color: COLORS.gray },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: COLORS.diamond, borderRadius: 30, padding: 25, alignItems: 'center' },
  closeBtn: { position: 'absolute', right: 20, top: 20 },
  closeText: { fontSize: 20, color: COLORS.gray, fontWeight: 'bold' },
  promoBadge: { backgroundColor: COLORS.golden, paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 15 },
  promoBadgeText: { color: COLORS.diamond, fontWeight: '800', fontSize: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.sapphire, marginBottom: 10 },
  modalDiscount: { fontSize: 48, fontWeight: '900', color: COLORS.golden, marginBottom: 10 },
  modalSub: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 25 },
  codeBox: { 
    backgroundColor: COLORS.silver, borderStyle: 'dashed', borderWidth: 2, 
    borderColor: COLORS.golden, paddingVertical: 15, paddingHorizontal: 20, 
    borderRadius: 12, marginBottom: 25, width: '100%', 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' 
  },
  codeText: { fontSize: 24, fontWeight: '900', color: COLORS.sapphire, letterSpacing: 2 },
  miniCopyBtn: { backgroundColor: COLORS.golden, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  miniCopyText: { color: COLORS.diamond, fontSize: 12, fontWeight: '800' },
  copyBtn: { backgroundColor: COLORS.sapphire, width: '100%', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  copyBtnText: { color: COLORS.diamond, fontSize: 16, fontWeight: '800' },

  trackModalContainer: { width: '90%', backgroundColor: COLORS.diamond, borderRadius: 25, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  trackOrderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.silver },
  trackOrderTitle: { fontSize: 15, fontWeight: '700', color: COLORS.blackTie },
  trackOrderSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  trackArrow: { fontSize: 20, color: COLORS.golden, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.gray, fontSize: 16 },
});

export default CustomerDashboard;
