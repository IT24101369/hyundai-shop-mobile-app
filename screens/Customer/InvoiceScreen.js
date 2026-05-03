import React from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Alert, Platform
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', success: '#10b981'
};

const InvoiceScreen = ({ route, navigation }) => {
  const { invoiceData } = route.params || {};

  const openMap = () => {
    if (invoiceData?.address) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(invoiceData.address)}`;
      Linking.openURL(url);
    }
  };

  const downloadInvoice = async () => {
    try {
      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #0f2747;">Phone Shop Invoice</h1>
            <p><strong>Date:</strong> ${invoiceData.date}</p>
            <p><strong>Customer:</strong> ${invoiceData.customerName}</p>
            <p><strong>Address:</strong> ${invoiceData.address}</p>
            <p><strong>Payment Method:</strong> ${invoiceData.paymentMethod}</p>
            <hr />
            <h3>Items:</h3>
            <ul>
              ${invoiceData.items.map(item => `<li>${item.name} x${item.quantity} - Rs. ${(item.price * item.quantity).toLocaleString()}</li>`).join('')}
            </ul>
            <hr />
            <p><strong>Subtotal:</strong> Rs. ${invoiceData.subtotal.toLocaleString()}</p>
            <p><strong>Delivery:</strong> Rs. ${invoiceData.deliveryFee.toLocaleString()}</p>
            <h2><strong>Grand Total:</strong> Rs. ${invoiceData.grandTotal.toLocaleString()}</h2>
            <br/>
            <p style="color: ${invoiceData.paymentMethod === 'Cash on Delivery' ? '#f59e0b' : '#10b981'};">
              <strong>${invoiceData.paymentMethod === 'Cash on Delivery' ? 'Order Placed (To Be Paid)' : 'Payment Successful'}</strong>
            </p>
          </body>
        </html>
      `;
      
      if (Platform.OS === 'web') {
        await Print.printAsync({ html: htmlContent });
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download invoice.');
    }
  };

  if (!invoiceData) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Invoice data not found.</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('CustomerDashboard')}>
          <Text style={styles.homeBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoice Receipt</Text>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        <View style={styles.invoiceCard}>
          {/* Top Banner */}
          <View style={[styles.successBanner, invoiceData.paymentMethod === 'Cash on Delivery' && { backgroundColor: '#fffbeb', borderBottomColor: '#fde68a' }]}>
            <Text style={styles.successIcon}>{invoiceData.paymentMethod === 'Cash on Delivery' ? '📦' : '✅'}</Text>
            <Text style={[styles.successText, invoiceData.paymentMethod === 'Cash on Delivery' && { color: '#d97706' }]}>
              {invoiceData.paymentMethod === 'Cash on Delivery' ? 'Order Placed Successfully' : 'Payment Successful'}
            </Text>
            <Text style={styles.dateText}>{invoiceData.date}</Text>
          </View>

          {/* Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Order Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Customer:</Text>
              <Text style={styles.value}>{invoiceData.customerName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                <Text style={styles.value}>{invoiceData.address}</Text>
                <TouchableOpacity onPress={openMap}>
                  <Text style={styles.mapLink}>📍 View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Payment Method:</Text>
              <Text style={styles.value}>{invoiceData.paymentMethod}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Items */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Purchased Items</Text>
            {invoiceData.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name} x{item.quantity}</Text>
                <Text style={styles.itemPrice}>Rs. {(item.price * item.quantity).toLocaleString()}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Totals */}
          <View style={styles.detailsSection}>
            <View style={styles.itemRow}>
              <Text style={styles.label}>Subtotal:</Text>
              <Text style={styles.value}>Rs. {invoiceData.subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.label}>Delivery Fee:</Text>
              <Text style={styles.value}>Rs. {invoiceData.deliveryFee.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.grandTotalBox}>
            <Text style={styles.grandTotalLabel}>{invoiceData.paymentMethod === 'Cash on Delivery' ? 'Total to Pay' : 'Total Paid'}</Text>
            <Text style={styles.grandTotalValue}>Rs. {invoiceData.grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.downloadBtn} onPress={downloadInvoice}>
          <Text style={styles.downloadBtnText}>📄 Download Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('CustomerDashboard')}>
          <Text style={styles.homeBtnText}>Continue Shopping</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.sapphire },
  header: {
    paddingTop: 60, paddingBottom: 20, alignItems: 'center'
  },
  title: { color: COLORS.diamond, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  
  scroll: { padding: 18 },
  invoiceCard: {
    backgroundColor: COLORS.diamond, borderRadius: 16, overflow: 'hidden',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, marginBottom: 20
  },
  successBanner: { backgroundColor: '#f0fdf4', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#bbf7d0' },
  successIcon: { fontSize: 40, marginBottom: 10 },
  successText: { fontSize: 18, fontWeight: '800', color: '#15803d', marginBottom: 4 },
  dateText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  
  detailsSection: { padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.sapphire, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  value: { fontSize: 14, color: COLORS.blackTie, fontWeight: '700', textAlign: 'right' },
  mapLink: { color: COLORS.golden, fontSize: 12, fontWeight: '700', marginTop: 4 },
  
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 14, color: COLORS.blackTie, flex: 1, marginRight: 10, fontWeight: '600' },
  itemPrice: { fontSize: 14, color: COLORS.blackTie, fontWeight: '700' },
  
  divider: { height: 1, backgroundColor: COLORS.icyLake, borderStyle: 'dashed' },
  
  grandTotalBox: { backgroundColor: COLORS.sapphire, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { color: COLORS.diamond, fontSize: 16, fontWeight: '700' },
  grandTotalValue: { color: COLORS.golden, fontSize: 20, fontWeight: '800' },
  
  downloadBtn: { backgroundColor: COLORS.icyLake, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.golden },
  downloadBtnText: { color: COLORS.sapphire, fontSize: 16, fontWeight: '800' },

  homeBtn: { backgroundColor: COLORS.golden, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 20 },
  homeBtnText: { color: COLORS.diamond, fontSize: 16, fontWeight: '800' },
  emptyText: { color: COLORS.diamond, textAlign: 'center', marginTop: 100, fontSize: 16, marginBottom: 20 }
});

export default InvoiceScreen;
