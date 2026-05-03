import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal, FlatList,
  KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981', warning: '#f59e0b'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const CATEGORIES = ['Defective Product', 'Delivery Issue', 'Wrong Item', 'Warranty Claim', 'Refund Request', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const AddComplaintScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  // Customer Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');

  // Product Info
  const [productName, setProductName] = useState('');
  const [hCode, setHCode] = useState('');

  // Complaint Details
  const [category, setCategory] = useState('Defective Product');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);

  // Selection States
  const [userOrders, setUserOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerType, setPickerType] = useState(''); // 'category' or 'priority'
  const [selectedOrderProducts, setSelectedOrderProducts] = useState([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    if (!user?.email) return;
    setFetchingOrders(true);
    try {
      const response = await axios.get(`${API_BASE}/orders/user/${user.email}`);
      setUserOrders(response.data);
    } catch (error) {
      console.log('Error fetching user orders', error);
    } finally {
      setFetchingOrders(false);
    }
  };

  const handleSelectOrder = (order) => {
    console.log('Order Selected:', order._id);
    setOrderId(order._id);
    setFullName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(''); // Ensure phone number is manually entered
    
    // Auto-fill H Code using Tracking ID if available, else a fallback
    const trackingCode = order.trackingId || `H-${order._id.slice(-6).toUpperCase()}`;
    setHCode(trackingCode);
    
    setShowOrderModal(false);
    
    if (order.items && order.items.length > 1) {
      // Show modal to pick which item from the order
      setSelectedOrderProducts(order.items);
      setTimeout(() => setShowProductModal(true), 500); // Small delay for smooth transition
    } else if (order.items && order.items.length === 1) {
      // Only one item, auto-fill product name
      setProductName(order.items[0].name);
    }
  };

  const handleSelectProduct = (name) => {
    setProductName(name);
    setShowProductModal(false);
  };

  const openPicker = (type) => {
    setPickerType(type);
    setShowPickerModal(true);
  };

  const handlePickerSelect = (val) => {
    if (pickerType === 'category') setCategory(val);
    else setPriority(val);
    setShowPickerModal(false);
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !phone || !productName || !hCode || !description) {
      Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
      return;
    }

    setLoading(true);
    try {
      const complaintData = {
        customerName: fullName,
        email,
        phone,
        orderId: orderId || 'Manual Entry',
        productName,
        hTrackingNumber: hCode,
        category,
        priority,
        description,
      };

      await axios.post(`${API_BASE}/complaints`, complaintData);
      Alert.alert('✅ Submitted', 'Your complaint has been registered. Our team will contact you soon.', [
        { text: 'Done', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Submission Failed', 'Could not register complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ title }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionStripe} />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Submit New Complaint</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.introText}>Fill out the form below to register a new customer complaint</Text>

        <TouchableOpacity style={styles.quickAction} onPress={() => setShowOrderModal(true)}>
          <Text style={styles.quickActionText}>📄 Select from My Recent Orders</Text>
        </TouchableOpacity>

        <View style={styles.formCard}>
          <SectionHeader title="Customer Information" />
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="John Smith" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="john@email.com" keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+94-555-0123" keyboardType="phone-pad" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Order ID *</Text>
              <TextInput 
                style={[styles.input, orderId ? { color: COLORS.golden, fontWeight: '700', backgroundColor: COLORS.icyLake } : {}]} 
                value={orderId ? orderId.slice(-8).toUpperCase() : ''} 
                editable={false} 
                placeholder="ORD-2024-..." 
              />
            </View>
          </View>

          <SectionHeader title="Product Information" />
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Product Name (Phone Model) *</Text>
              <TextInput 
                style={[styles.input, orderId ? { backgroundColor: COLORS.icyLake, fontWeight: '600' } : {}]} 
                value={productName} 
                onChangeText={setProductName} 
                placeholder="Select a phone model.." 
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>H Code *</Text>
              <TextInput 
                style={[styles.input, orderId ? { backgroundColor: COLORS.icyLake, fontWeight: '600' } : {}]} 
                value={hCode} 
                onChangeText={setHCode} 
                placeholder="Enter the H code" 
              />
            </View>
          </View>

          <SectionHeader title="Complaint Details" />
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity style={styles.pickerTrigger} onPress={() => openPicker('category')}>
                <Text style={styles.pickerValue}>{category}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Priority *</Text>
              <TouchableOpacity style={styles.pickerTrigger} onPress={() => openPicker('priority')}>
                <Text style={styles.pickerValue}>{priority}</Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Detailed Description *</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={description} 
            onChangeText={setDescription} 
            placeholder="Provide as much detail as possible about the issue..." 
            multiline 
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={COLORS.diamond} /> : <Text style={styles.submitBtnText}>Register New Complaint</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Picker Modal */}
      <Modal visible={showPickerModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.pickerModal}>
            <Text style={styles.modalTitle}>Select {pickerType === 'category' ? 'Category' : 'Priority'}</Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: 15 }}>
              {(pickerType === 'category' ? CATEGORIES : PRIORITIES).map((item) => (
                <TouchableOpacity key={item} style={styles.pickerOption} onPress={() => handlePickerSelect(item)}>
                  <Text style={styles.pickerOptionText}>{item}</Text>
                  {(pickerType === 'category' ? category : priority) === item && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowPickerModal(false)}>
              <Text style={styles.cancelLinkText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Order Selection Modal */}
      <Modal visible={showOrderModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Recent Orders</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={userOrders}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.orderItem} onPress={() => handleSelectOrder(item)}>
                  <View style={styles.orderIconBox}>
                    <Text>📦</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderIdText}>Order #{item._id.slice(-8).toUpperCase()}</Text>
                    <Text style={styles.orderDateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.orderItemsText}>{item.items.map(i => i.name).join(', ')}</Text>
                  </View>
                  <Text style={styles.selectArrow}>→</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal visible={showProductModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.productModal}>
            <Text style={styles.modalTitle}>Select the Product</Text>
            <Text style={styles.modalSub}>This order has multiple items. Please pick one:</Text>
            <View style={{ height: 10 }} />
            {selectedOrderProducts.map((p, idx) => (
              <TouchableOpacity key={idx} style={styles.productOption} onPress={() => handleSelectProduct(p.name)}>
                <Text style={styles.productOptionText}>📱 {p.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowProductModal(false)}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  
  scroll: { padding: 20 },
  introText: { color: COLORS.gray, fontSize: 13, marginBottom: 20 },
  
  quickAction: {
    backgroundColor: COLORS.icyLake, padding: 15, borderRadius: 12, marginBottom: 20,
    borderWidth: 1.5, borderColor: COLORS.golden, alignItems: 'center'
  },
  quickActionText: { color: COLORS.golden, fontWeight: '800', fontSize: 14 },

  formCard: { backgroundColor: COLORS.diamond, borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  sectionStripe: { width: 4, height: 20, backgroundColor: '#059669', marginRight: 10, borderRadius: 2 },
  sectionHeaderText: { fontSize: 15, fontWeight: '800', color: COLORS.sapphire },

  row: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  field: { flex: 1 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.sapphire, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.silver, borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: COLORS.blackTie
  },
  textArea: { height: 100 },
  
  pickerTrigger: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.silver, borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10
  },
  pickerValue: { fontSize: 13, color: COLORS.blackTie },
  pickerArrow: { fontSize: 10, color: COLORS.gray },

  submitBtn: { backgroundColor: '#059669', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: COLORS.diamond, fontSize: 15, fontWeight: '800' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: COLORS.diamond, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.sapphire },
  modalSub: { fontSize: 13, color: COLORS.gray, marginBottom: 10 },
  closeBtn: { fontSize: 20, color: COLORS.gray, fontWeight: '800' },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.icyLake },
  orderIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.icyLake, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  orderIdText: { fontSize: 14, fontWeight: '700', color: COLORS.blackTie },
  orderDateText: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  orderItemsText: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  selectArrow: { color: COLORS.golden, fontWeight: '900' },

  pickerModal: { backgroundColor: COLORS.diamond, borderRadius: 20, padding: 25 },
  pickerOption: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.icyLake 
  },
  pickerOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.blackTie },
  checkIcon: { color: '#059669', fontWeight: '800' },

  productModal: { backgroundColor: COLORS.diamond, borderRadius: 20, padding: 25 },
  productOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.icyLake },
  productOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.blackTie },
  cancelLink: { marginTop: 15, alignItems: 'center' },
  cancelLinkText: { color: COLORS.danger, fontWeight: '700' }
});

export default AddComplaintScreen;
