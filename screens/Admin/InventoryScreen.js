import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  TextInput, Alert, ActivityIndicator, Image, Modal, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981', warning: '#f59e0b',
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop';

// Pre-built Unsplash image suggestions for phones
const QUICK_IMAGES = [
  { label: 'iPhone', url: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?q=80&w=800&auto=format&fit=crop' },
  { label: 'Samsung', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800&auto=format&fit=crop' },
  { label: 'Pixel', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop' },
  { label: 'Generic', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop' },
];

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

const InputField = ({ label, required, error, children }) => (
  <View style={styles.fieldWrapper}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}> *</Text>}
    </View>
    {children}
    {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}
  </View>
);

const InventoryScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/products`);
      setProducts(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setName(''); setPrice(''); setStock('');
    setDescription(''); setCategory(''); setImage('');
    setErrors({});
    setImagePreviewError(false);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentProductId(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setIsEditing(true);
    setCurrentProductId(product._id);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setDescription(product.description || '');
    setCategory(product.category || 'Smartphone');
    setImage(product.image || '');
    setErrors({});
    setImagePreviewError(false);
    setModalVisible(true);
  };

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(price) || Number(price) <= 0) {
      newErrors.price = 'Enter a valid price (e.g. 350000)';
    }

    if (!stock) {
      newErrors.stock = 'Stock quantity is required';
    } else if (isNaN(stock) || Number(stock) < 0 || !Number.isInteger(Number(stock))) {
      newErrors.stock = 'Stock must be a whole number (e.g. 50)';
    }

    if (!category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (image && !isValidUrl(image)) {
      newErrors.image = 'Enter a valid image URL (must start with http/https)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url) => {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSaveProduct = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const productData = {
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        description: description.trim(),
        category: category.trim() || 'Smartphone',
        image: image.trim() || undefined,
      };

      if (isEditing) {
        await axios.put(`${API_BASE}/products/${currentProductId}`, productData);
        Alert.alert('✅ Updated', 'Product updated successfully');
      } else {
        await axios.post(`${API_BASE}/products`, productData);
        Alert.alert('✅ Added', 'Product added to inventory');
      }

      setModalVisible(false);
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE}/products/${id}`);
            fetchProducts();
            Alert.alert('Deleted', 'Product has been removed.');
          } catch (error) {
            Alert.alert('Error', 'Could not delete product');
          }
        }
      }
    ]);
  };

  const ProductItem = React.memo(({ item, onEdit, onDelete }) => (
    <View style={styles.productCard}>
      <ProductImage uri={item.image} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>Rs. {item.price.toLocaleString()}</Text>
        <Text style={[styles.productStock, { color: item.stock > 0 ? COLORS.success : COLORS.danger }]}>
          {item.stock > 0 ? `In Stock: ${item.stock}` : 'Out of Stock'}
        </Text>
      </View>
      <View style={styles.actionBtns}>
        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
          <Text style={styles.btnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item._id)}>
          <Text style={styles.btnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  ));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{products.length}</Text>
          <Text style={styles.overviewLabel}>Total Products</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>
            {products.reduce((acc, p) => acc + (p.stock || 0), 0)}
          </Text>
          <Text style={styles.overviewLabel}>Total Stock Units</Text>
        </View>
      </View>

      {loading && !modalVisible ? (
        <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductItem item={item} onEdit={openEditModal} onDelete={handleDelete} />
          )}
          contentContainerStyle={{ padding: 18 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No products in inventory.</Text>}
          onRefresh={fetchProducts}
          refreshing={loading}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? '✏️ Edit Product' : '📦 Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >

              <InputField label="Product Name" required error={errors.name}>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: null })); }}
                  placeholder="e.g. iPhone 15 Pro Max"
                  placeholderTextColor={COLORS.gray}
                />
              </InputField>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <InputField label="Price (Rs.)" required error={errors.price}>
                    <TextInput
                      style={[styles.input, errors.price && styles.inputError]}
                      value={price}
                      onChangeText={(t) => { setPrice(t); setErrors(e => ({ ...e, price: null })); }}
                      placeholder="e.g. 350000"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="numeric"
                    />
                  </InputField>
                </View>
                <View style={{ flex: 1 }}>
                  <InputField label="Stock Qty" required error={errors.stock}>
                    <TextInput
                      style={[styles.input, errors.stock && styles.inputError]}
                      value={stock}
                      onChangeText={(t) => { setStock(t); setErrors(e => ({ ...e, stock: null })); }}
                      placeholder="e.g. 50"
                      placeholderTextColor={COLORS.gray}
                      keyboardType="numeric"
                    />
                  </InputField>
                </View>
              </View>

              <InputField label="Category" required error={errors.category}>
                <TextInput
                  style={[styles.input, errors.category && styles.inputError]}
                  value={category}
                  onChangeText={(t) => { setCategory(t); setErrors(e => ({ ...e, category: null })); }}
                  placeholder="e.g. Smartphone, Tablet, Accessory"
                  placeholderTextColor={COLORS.gray}
                />
              </InputField>

              <InputField label="Description" required error={errors.description}>
                <TextInput
                  style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                  value={description}
                  onChangeText={(t) => { setDescription(t); setErrors(e => ({ ...e, description: null })); }}
                  placeholder="Describe the product features, specs, etc."
                  placeholderTextColor={COLORS.gray}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </InputField>

              {/* Image URL Field with Preview */}
              <InputField label="Image URL" error={errors.image}>
                <Text style={styles.urlHint}>
                  💡 Paste a full image URL starting with https://
                </Text>
                <TextInput
                  style={[styles.input, errors.image && styles.inputError]}
                  value={image}
                  onChangeText={(t) => {
                    setImage(t);
                    setErrors(e => ({ ...e, image: null }));
                    setImagePreviewError(false);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={COLORS.gray}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />

                {/* Quick Pick Buttons */}
                <Text style={styles.quickLabel}>⚡ Quick Pick (tap to use):</Text>
                <View style={styles.quickRow}>
                  {QUICK_IMAGES.map((q) => (
                    <TouchableOpacity
                      key={q.label}
                      style={[styles.quickBtn, image === q.url && styles.quickBtnActive]}
                      onPress={() => { setImage(q.url); setImagePreviewError(false); }}
                    >
                      <Text style={[styles.quickBtnText, image === q.url && { color: COLORS.diamond }]}>
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Image Preview */}
                {image !== '' && (
                  <View style={styles.previewBox}>
                    <Text style={styles.previewLabel}>Preview:</Text>
                    {imagePreviewError ? (
                      <View style={styles.previewError}>
                        <Text style={styles.previewErrorText}>❌ Image could not load. Check the URL.</Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: image }}
                        style={styles.previewImg}
                        onError={() => setImagePreviewError(true)}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                )}
              </InputField>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, loading && { opacity: 0.6 }]}
                  onPress={handleSaveProduct}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.diamond} />
                  ) : (
                    <Text style={styles.saveBtnText}>{isEditing ? 'Update' : 'Add Product'}</Text>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtn: { backgroundColor: COLORS.golden, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: COLORS.diamond, fontWeight: '800', fontSize: 14 },
  
  overviewContainer: { flexDirection: 'row', paddingHorizontal: 18, paddingTop: 18, gap: 12 },
  overviewCard: { flex: 1, backgroundColor: COLORS.diamond, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08 },
  overviewValue: { fontSize: 20, fontWeight: '800', color: COLORS.sapphire, marginBottom: 4 },
  overviewLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },

  productCard: {
    backgroundColor: COLORS.diamond, borderRadius: 14, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
  },
  productImg: { width: 64, height: 64, borderRadius: 10, backgroundColor: COLORS.icyLake, marginRight: 14 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.blackTie, marginBottom: 2 },
  productCategory: { fontSize: 11, color: COLORS.golden, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase' },
  productPrice: { fontSize: 14, color: COLORS.sapphire, fontWeight: '700', marginBottom: 2 },
  productStock: { fontSize: 12, fontWeight: '600' },
  actionBtns: { flexDirection: 'row', gap: 10 },
  editBtn: { backgroundColor: COLORS.icyLake, padding: 10, borderRadius: 8 },
  deleteBtn: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8 },
  btnText: { fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.gray, fontSize: 16 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: COLORS.diamond, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '92%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.sapphire },
  closeBtn: { backgroundColor: COLORS.silver, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: COLORS.gray, fontWeight: '700', fontSize: 14 },

  row: { flexDirection: 'row' },

  fieldWrapper: { marginBottom: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, marginTop: 10 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.sapphire },
  required: { fontSize: 13, fontWeight: '900', color: COLORS.danger },
  errorText: { fontSize: 11, color: COLORS.danger, marginTop: 4, fontWeight: '600' },

  input: {
    backgroundColor: COLORS.silver, borderWidth: 1.5, borderColor: COLORS.icyLake,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: COLORS.blackTie,
  },
  inputError: { borderColor: COLORS.danger, backgroundColor: '#fff5f5' },
  textArea: { height: 90, textAlignVertical: 'top' },

  urlHint: { fontSize: 11, color: COLORS.gray, marginBottom: 6, fontStyle: 'italic' },

  quickLabel: { fontSize: 11, color: COLORS.sapphire, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  quickBtn: {
    backgroundColor: COLORS.icyLake, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.icyLake,
  },
  quickBtnActive: { backgroundColor: COLORS.sapphire, borderColor: COLORS.sapphire },
  quickBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.sapphire },

  previewBox: { marginTop: 8, marginBottom: 4 },
  previewLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginBottom: 6 },
  previewImg: { width: '100%', height: 160, borderRadius: 12, backgroundColor: COLORS.icyLake },
  previewError: {
    backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  previewErrorText: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },

  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.silver, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: COLORS.sapphire, fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: COLORS.golden, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: COLORS.diamond, fontWeight: '800', fontSize: 15 },
});

export default InventoryScreen;
