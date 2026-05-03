import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TERFXC3SfK0CMH3WV9EFdxYYXJ5A7uJZm6Um1vHUWva7pzbKrqMoS2kBROLFAZotRpjf0Pps7OEzDtco4DVLhBW008C5Pczbr';

const CheckoutScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { cartItems, totalAmount } = route.params || { cartItems: [], totalAmount: 0 };
  const deliveryFee = 500;
  
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const grandTotal = totalAmount + deliveryFee - discountAmount;
  
  const [selectedMethod, setSelectedMethod] = useState('CARD'); // 'CARD' or 'COD'

  // Location State
  const [customerLat, setCustomerLat] = useState(null);
  const [customerLng, setCustomerLng] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setCustomerLat(loc.coords.latitude);
      setCustomerLng(loc.coords.longitude);
      Alert.alert('Success', 'Your current location has been pinned for the rider!');
    } catch (error) {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setLocationLoading(false);
    }
  };

  // ... (existing form states)
  const [cardName, setCardName] = useState('');
  const [cardEmail, setCardEmail] = useState('');
  const [cardAddress, setCardAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [codName, setCodName] = useState('');
  const [codPhone, setCodPhone] = useState('');
  const [codAddress, setCodAddress] = useState('');
  const [codCity, setCodCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(''); // For the "Processing..." state
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [cardBrand, setCardBrand] = useState('generic'); // 'visa', 'mastercard', 'generic'
  
  // Virtual Gateway States
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayStep, setGatewayStep] = useState('connecting'); // 'connecting', 'otp', 'processing', 'success'
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Card Formatting Logic
  const handleCardNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    
    // Detect Brand
    if (cleaned.startsWith('4')) {
      setCardBrand('visa');
    } else if (/^5[1-5]/.test(cleaned)) {
      setCardBrand('mastercard');
    } else {
      setCardBrand('generic');
    }

    const matched = cleaned.match(/.{1,4}/g);
    const formatted = matched ? matched.join(' ') : cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    setExpiry(formatted);
    
    // Real-time validation
    if (cleaned.length >= 2) {
      const month = parseInt(cleaned.slice(0, 2));
      if (month > 12 || month === 0) {
        setExpiryError('Invalid Month');
        return;
      }
    }

    if (formatted.length === 5) {
      if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(formatted)) {
        setExpiryError('Invalid Format');
      } else {
        setExpiryError('');
      }
    } else {
      setExpiryError(''); // Clear error while typing valid characters
    }
  };

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const validateFullName = (name) => {
    return /^[a-zA-Z\s]+$/.test(name);
  };

  const validateSLPhone = (phone) => {
    return /^(?:0|94|\+94)?7[0-9]{8}$/.test(phone);
  };

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setPromoLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/promotions/validate/${promoCode}`);
      const promo = response.data;
      const discount = (totalAmount * promo.discountPercentage) / 100;
      setDiscountAmount(discount);
      setAppliedPromo(promo);
      Alert.alert('Success', `${promo.discountPercentage}% discount applied!`);
    } catch (error) {
      Alert.alert('Invalid Code', 'The promo code you entered is invalid or expired.');
      setDiscountAmount(0);
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const handlePayment = async () => {
    // 1. Client-Side Advanced Validations
    if (selectedMethod === 'CARD') {
      if (!cardName || !cardEmail || !cardAddress || !cardNumber || !expiry || !cvv) {
        Alert.alert('Missing Details', 'Please fill in all cardholder and payment details.');
        return;
      }
      if (!validateFullName(cardName)) {
        Alert.alert('Invalid Name', 'Full Name should only contain letters.');
        return;
      }
      if (!validateEmail(cardEmail)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert('Invalid Card', 'Card number must be exactly 16 digits.');
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
        Alert.alert('Invalid Expiry', 'Please use the MM/YY format for expiry date.');
        return;
      }
      if (cvv.length < 3) {
        Alert.alert('Invalid CVV', 'CVV must be 3 or 4 digits.');
        return;
      }
    } else {
      if (!codName || !codPhone || !codAddress || !codCity) {
        Alert.alert('Missing Details', 'Please fill in all delivery details to proceed.');
        return;
      }
      if (!validateFullName(codName)) {
        Alert.alert('Invalid Name', 'Full Name should only contain letters.');
        return;
      }
      if (!validateSLPhone(codPhone)) {
        Alert.alert('Invalid Phone', 'Please enter a valid Sri Lankan phone number (e.g. 0712345678).');
        return;
      }
    }

    setLoading(true);
    setProcessingStatus('Verifying Details...');

    if (selectedMethod === 'CARD') {
      setShowGateway(true);
      setGatewayStep('connecting');
      setOtp('');
      setOtpError('');
      
      // Step 1: Connecting to Bank
      setTimeout(() => {
        setGatewayStep('otp');
        // Simulated SMS notification
        Alert.alert('New Message', 'SECURE BANK: Your OTP for Hyundai Premier is 123456. Do not share this with anyone.');
      }, 2000);
      return;
    }

    // For COD, proceed normally
    processFinalOrder();
  };

  const handleVerifyOtp = () => {
    if (otp === '123456') { // Mock OTP for demo
      setGatewayStep('processing');
      setTimeout(async () => {
        setGatewayStep('success');
        setTimeout(() => {
          setShowGateway(false);
          processFinalOrder();
        }, 1500);
      }, 2000);
    } else {
      setOtpError('Invalid OTP. Please enter 123456 for demo.');
    }
  };

  const processFinalOrder = async () => {
    setLoading(true);
    setProcessingStatus('Securing Order...');

    try {
      let stripeClientSecret = '';
      if (selectedMethod === 'CARD') {
        setProcessingStatus('Securing Payment with Stripe...');
        const intentResponse = await axios.post(`${API_BASE}/payments/create-intent`, {
          amount: grandTotal,
          currency: 'lkr'
        });
        stripeClientSecret = intentResponse.data.clientSecret;
      }

      const orderData = {
        customerName: selectedMethod === 'CARD' ? cardName : codName,
        phone: selectedMethod === 'CARD' ? 'N/A' : codPhone,
        email: selectedMethod === 'CARD' ? cardEmail : (user?.email || 'N/A'),
        address: selectedMethod === 'CARD' ? cardAddress : codAddress,
        city: selectedMethod === 'CARD' ? 'N/A' : codCity,
        paymentMethod: selectedMethod === 'CARD' ? 'Card Payment' : 'Cash on Delivery',
        items: cartItems.map(item => ({
          productId: item.productId || item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: totalAmount,
        deliveryFee: deliveryFee,
        discount: discountAmount,
        promoCode: appliedPromo ? appliedPromo.promoCode : null,
        grandTotal: grandTotal,
        customerLat: customerLat,
        customerLng: customerLng,
      };

      // 1. Create the Order
      const orderResponse = await axios.post(`${API_BASE}/orders`, orderData);
      const createdOrder = orderResponse.data;

      // 2. Create the Payment History Entry
      const paymentData = {
        fullName: selectedMethod === 'CARD' ? cardName : codName,
        email: selectedMethod === 'CARD' ? cardEmail : (user?.email || 'N/A'),
        address: selectedMethod === 'CARD' ? cardAddress : codAddress,
        city: selectedMethod === 'CARD' ? 'N/A' : codCity,
        amount: grandTotal,
        paymentMethod: selectedMethod === 'CARD' ? 'CARD' : 'COD',
        orderId: createdOrder._id.toString(),
        paymentId: selectedMethod === 'CARD' 
          ? 'STRIPE-' + stripeClientSecret.slice(-10) 
          : 'COD-' + createdOrder._id.toString().slice(-8).toUpperCase(),
        status: selectedMethod === 'CARD' ? 'PAID' : 'NON PAID',
        // Optional card details for history
        cardNumber: selectedMethod === 'CARD' ? cardNumber : null,
        expiry: selectedMethod === 'CARD' ? expiry : null,
        cvv: selectedMethod === 'CARD' ? cvv : null,
      };

      await axios.post(`${API_BASE}/payments`, paymentData);
      
      // 3. Finalize
      await axios.delete(`${API_BASE}/cart/clear`);

      const invoiceData = {
        ...createdOrder,
        date: new Date().toLocaleString()
      };

      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'View Invoice', onPress: () => navigation.replace('InvoiceScreen', { invoiceData }) }
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      console.log('Final Order Error:', errorMessage);
      Alert.alert('Error', `Could not finalize order: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}`);
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

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
        <Text style={styles.title}>Secure Checkout</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item, index) => (
            <View key={index} style={styles.summaryRow}>
              <Text style={styles.summaryItem} numberOfLines={1}>{item.name} x{item.quantity}</Text>
              <Text style={styles.summaryPrice}>Rs. {(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>Subtotal</Text>
            <Text style={styles.summaryPrice}>Rs. {totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItem}>Delivery Fee</Text>
            <Text style={styles.summaryPrice}>Rs. {deliveryFee.toLocaleString()}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryItem, { color: COLORS.success }]}>Discount ({appliedPromo?.promoCode})</Text>
              <Text style={[styles.summaryPrice, { color: COLORS.success }]}>- Rs. {discountAmount.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalText}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs. {grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Promo Code Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoRow}>
            <TextInput 
              style={[styles.input, { flex: 1, marginTop: 0 }]} 
              placeholder="Enter Code (e.g. SAVE10)" 
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              editable={!appliedPromo}
            />
            <TouchableOpacity 
              style={[styles.applyBtn, !!(promoLoading || appliedPromo) && { opacity: 0.7 }]} 
              onPress={handleApplyPromo}
              disabled={!!(promoLoading || appliedPromo)}
            >
              {promoLoading ? (
                <ActivityIndicator color={COLORS.diamond} size="small" />
              ) : (
                <Text style={styles.applyBtnText}>{appliedPromo ? 'Applied' : 'Apply'}</Text>
              )}
            </TouchableOpacity>
          </View>
          {appliedPromo && (
            <TouchableOpacity onPress={() => { setAppliedPromo(null); setDiscountAmount(0); setPromoCode(''); }}>
              <Text style={styles.removePromoText}>Remove code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity 
              style={[styles.methodBtn, selectedMethod === 'CARD' && styles.methodBtnActive]}
              onPress={() => setSelectedMethod('CARD')}
            >
              <Text style={[styles.methodText, selectedMethod === 'CARD' && styles.methodTextActive]}>💳 Card Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.methodBtn, selectedMethod === 'COD' && styles.methodBtnActive]}
              onPress={() => setSelectedMethod('COD')}
            >
              <Text style={[styles.methodText, selectedMethod === 'COD' && styles.methodTextActive]}>🚚 Cash on Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedMethod === 'CARD' ? (
          <>
            {/* Shipping Details */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Cardholder Details</Text>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="e.g. John Doe" value={cardName} onChangeText={(text) => setCardName(text.replace(/[^a-zA-Z\s]/g, ''))} />
              
              <Text style={styles.label}>Email Address</Text>
              <TextInput 
                style={[styles.input, emailError ? { borderColor: COLORS.danger } : {}]} 
                placeholder="e.g. john@example.com" 
                value={cardEmail} 
                onChangeText={(text) => {
                  setCardEmail(text);
                  if (text && !validateEmail(text)) {
                    setEmailError('Please enter a valid email address');
                  } else {
                    setEmailError('');
                  }
                }} 
                keyboardType="email-address" 
                autoCapitalize="none"
              />
              {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
              
              <Text style={styles.label}>Billing Address</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="123 Main St, City..." value={cardAddress} onChangeText={setCardAddress} multiline />
            </View>

            {/* Payment Details - Premium Stripe Look */}
            <View style={styles.card}>
              <View style={styles.stripeHeader}>
                <Text style={styles.sectionTitle}>Card Details</Text>
                <View style={styles.linkBadge}>
                  <Text style={styles.linkText}>Link</Text>
                </View>
              </View>
              
              <View style={styles.unifiedCardInput}>
                <View style={styles.cardNumberRow}>
                  <Text style={styles.cardIcon}>
                    {cardBrand === 'visa' ? '💳' : cardBrand === 'mastercard' ? '🃏' : '💳'}
                  </Text>
                  <TextInput 
                    style={styles.unifiedInput} 
                    placeholder="Card number" 
                    value={cardNumber} 
                    onChangeText={handleCardNumberChange} 
                    keyboardType="numeric" 
                    maxLength={19} 
                  />
                  <Text style={styles.brandTag}>
                    {cardBrand === 'visa' ? 'VISA' : cardBrand === 'mastercard' ? 'MC' : ''}
                  </Text>
                </View>
                
                <View style={styles.cardInfoRow}>
                  <View style={[styles.subInputWrapper, { borderRightWidth: 1, borderRightColor: '#e2e8f0' }]}>
                    <Text style={styles.subInputLabel}>Expiry Date</Text>
                    <TextInput 
                      style={styles.unifiedSubInput} 
                      placeholder="MM / YY" 
                      value={expiry} 
                      onChangeText={handleExpiryChange} 
                      maxLength={5} 
                      keyboardType="numeric" 
                    />
                  </View>
                  <View style={styles.subInputWrapper}>
                    <Text style={styles.subInputLabel}>CVC Number</Text>
                    <TextInput 
                      style={styles.unifiedSubInput} 
                      placeholder="123" 
                      value={cvv} 
                      onChangeText={setCvv} 
                      keyboardType="numeric" 
                      maxLength={3} 
                      secureTextEntry 
                    />
                  </View>
                </View>
              </View>
              {!!expiryError && <Text style={styles.errorText}>{expiryError}</Text>}
              
              <Text style={styles.stripeSecureText}>🔒 Securely powered by Stripe</Text>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="e.g. John Doe" value={codName} onChangeText={(text) => setCodName(text.replace(/[^a-zA-Z\s]/g, ''))} />
            
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={[styles.input, phoneError ? { borderColor: COLORS.danger } : {}]} 
              placeholder="e.g. 0712345678" 
              value={codPhone} 
              onChangeText={(text) => {
                setCodPhone(text);
                if (text && !validateSLPhone(text)) {
                  setPhoneError('Invalid Sri Lankan phone number');
                } else {
                  setPhoneError('');
                }
              }} 
              keyboardType="numeric" 
              maxLength={12} 
            />
            {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
            
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="123 Main St..." value={codAddress} onChangeText={setCodAddress} multiline />

            <Text style={styles.label}>City</Text>
            <TextInput style={styles.input} placeholder="e.g. Colombo" value={codCity} onChangeText={setCodCity} />

            <View style={styles.divider} />
            <Text style={styles.label}>Precise Location (Optional)</Text>
            <TouchableOpacity 
              style={[styles.locationBtn, customerLat && { backgroundColor: COLORS.success + '20', borderColor: COLORS.success }]} 
              onPress={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color={COLORS.golden} size="small" />
              ) : (
                <Text style={[styles.locationBtnText, customerLat && { color: COLORS.success }]}>
                  {customerLat ? '📍 Location Pinned' : '📍 Use My Current Location'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.codNote}>
              <Text style={styles.codNoteText}>Our delivery team will collect your payment when the order arrives.</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {processingStatus ? (
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <ActivityIndicator color={COLORS.golden} size="large" />
            <Text style={{ marginTop: 10, color: COLORS.sapphire, fontWeight: '700' }}>{processingStatus}</Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.payBtn, loading && { opacity: 0.7 }]} onPress={handlePayment} disabled={loading}>
            <Text style={styles.payBtnText}>
              {selectedMethod === 'COD' ? `Place Order (Rs. ${grandTotal.toLocaleString()})` : `Pay Rs. ${grandTotal.toLocaleString()}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Virtual Bank Gateway Modal */}
      <Modal visible={showGateway} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.gatewayCard}>
            <View style={styles.gatewayHeader}>
              <Text style={styles.bankName}>🏛️ SECURE BANK GATEWAY</Text>
              <Text style={styles.secureText}>🔒 256-bit Encryption Active</Text>
            </View>

            {gatewayStep === 'connecting' && (
              <View style={styles.gatewayBody}>
                <ActivityIndicator size="large" color={COLORS.sapphire} />
                <Text style={styles.gatewayStatus}>Connecting to card issuer...</Text>
                <Text style={styles.gatewaySubtext}>Please do not close this window</Text>
              </View>
            )}

            {gatewayStep === 'otp' && (
              <View style={styles.gatewayBody}>
                <Text style={styles.otpTitle}>Two-Factor Authentication</Text>
                <Text style={styles.otpInfo}>A one-time password (OTP) has been sent to your registered mobile number ending in **44.</Text>
                
                <TextInput
                  style={[styles.otpInput, otpError ? { borderColor: COLORS.danger } : {}]}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={(text) => { setOtp(text); setOtpError(''); }}
                  keyboardType="numeric"
                  maxLength={6}
                />
                {!!otpError && <Text style={styles.otpErrorText}>{otpError}</Text>}

                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOtp}>
                  <Text style={styles.verifyBtnText}>VERIFY & PAY</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowGateway(false)}>
                  <Text style={styles.cancelLink}>Cancel Transaction</Text>
                </TouchableOpacity>
              </View>
            )}

            {gatewayStep === 'processing' && (
              <View style={styles.gatewayBody}>
                <ActivityIndicator size="large" color={COLORS.golden} />
                <Text style={styles.gatewayStatus}>Authorizing Transaction...</Text>
              </View>
            )}

            {gatewayStep === 'success' && (
              <View style={styles.gatewayBody}>
                <View style={styles.successCircle}>
                  <Text style={styles.successCheck}>✅</Text>
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.gatewaySubtext}>Your transaction has been approved by the bank.</Text>
              </View>
            )}

            <View style={styles.gatewayFooter}>
              <Text style={styles.footerNote}>Verified by VISA / Mastercard SecureCode</Text>
            </View>
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
  
  scroll: { padding: 18 },
  card: {
    backgroundColor: COLORS.diamond, borderRadius: 12, padding: 18, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.sapphire, marginBottom: 14 },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItem: { fontSize: 14, color: COLORS.gray, flex: 1, marginRight: 10 },
  summaryPrice: { fontSize: 14, fontWeight: '600', color: COLORS.blackTie },
  divider: { height: 1, backgroundColor: COLORS.icyLake, marginVertical: 10 },
  totalText: { fontSize: 16, fontWeight: '800', color: COLORS.blackTie },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.golden },
  
  label: { fontSize: 13, fontWeight: '600', color: COLORS.sapphire, marginBottom: 6, marginTop: 6 },
  input: { backgroundColor: COLORS.silver, borderWidth: 1, borderColor: COLORS.icyLake, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.blackTie },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  methodBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: COLORS.icyLake, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.silver },
  methodBtnActive: { borderColor: COLORS.golden, backgroundColor: COLORS.icyLake, borderWidth: 2 },
  methodText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  methodTextActive: { color: COLORS.golden, fontWeight: '800' },
  
  codNote: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, marginTop: 14, borderWidth: 1, borderColor: '#bbf7d0' },
  codNoteText: { color: '#15803d', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  footer: {
    backgroundColor: COLORS.diamond, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1
  },
  payBtn: { backgroundColor: COLORS.golden, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  payBtnText: { color: COLORS.diamond, fontSize: 18, fontWeight: '800', letterSpacing: 1 },

  promoRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  applyBtn: { backgroundColor: COLORS.sapphire, paddingHorizontal: 20, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  applyBtnText: { color: COLORS.diamond, fontWeight: '800', fontSize: 14 },
  removePromoText: { color: COLORS.danger, fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'right' },

  locationBtn: { backgroundColor: COLORS.silver, paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.icyLake, marginTop: 5 },
  locationBtnText: { color: COLORS.sapphire, fontSize: 14, fontWeight: '700' },
  errorText: { color: COLORS.danger, fontSize: 12, fontWeight: '600', marginTop: 4, marginLeft: 5 },

  // Gateway Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  gatewayCard: { backgroundColor: COLORS.diamond, borderRadius: 20, width: '100%', overflow: 'hidden', elevation: 10 },
  gatewayHeader: { backgroundColor: '#f8fafc', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  bankName: { fontSize: 15, fontWeight: '800', color: COLORS.sapphire, letterSpacing: 1 },
  secureText: { fontSize: 10, color: COLORS.success, fontWeight: '700', marginTop: 4 },
  
  gatewayBody: { padding: 30, alignItems: 'center' },
  gatewayStatus: { fontSize: 16, fontWeight: '700', color: COLORS.blackTie, marginTop: 15 },
  gatewaySubtext: { fontSize: 12, color: COLORS.gray, marginTop: 5, textAlign: 'center' },
  
  otpTitle: { fontSize: 18, fontWeight: '800', color: COLORS.blackTie, marginBottom: 10 },
  otpInfo: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  otpInput: { width: '100%', backgroundColor: COLORS.silver, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 15, fontSize: 20, textAlign: 'center', fontWeight: '700', letterSpacing: 5 },
  otpErrorText: { color: COLORS.danger, fontSize: 12, fontWeight: '600', marginTop: 8 },
  
  verifyBtn: { backgroundColor: COLORS.sapphire, width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  verifyBtnText: { color: COLORS.diamond, fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  cancelLink: { color: COLORS.danger, fontSize: 13, fontWeight: '600', marginTop: 20 },
  
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  successCheck: { fontSize: 40 },
  successTitle: { fontSize: 20, fontWeight: '800', color: COLORS.success },
  
  gatewayFooter: { padding: 15, alignItems: 'center', backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  footerNote: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },

  // Stripe Premium Styles
  stripeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  linkBadge: { backgroundColor: '#00d66f', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  linkText: { color: COLORS.diamond, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  unifiedCardInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.silver },
  cardNumberRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', height: 50 },
  cardIcon: { fontSize: 18, marginRight: 10 },
  unifiedInput: { flex: 1, fontSize: 16, color: COLORS.blackTie },
  brandTag: { fontSize: 12, fontWeight: '800', color: COLORS.gray },
  cardInfoRow: { flexDirection: 'row', height: 75 },
  subInputWrapper: { flex: 1, paddingHorizontal: 15, paddingVertical: 8, justifyContent: 'center' },
  subInputLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase', marginBottom: 2 },
  unifiedSubInput: { fontSize: 15, color: COLORS.blackTie, padding: 0 },
  stripeSecureText: { fontSize: 11, color: COLORS.gray, marginTop: 12, textAlign: 'center', fontWeight: '500' },
});

export default CheckoutScreen;
