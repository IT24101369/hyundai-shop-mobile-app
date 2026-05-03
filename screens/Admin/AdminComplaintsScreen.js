import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput, Platform
} from 'react-native';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981', warning: '#f59e0b'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const AdminComplaintsScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Active'); // Active or Resolved

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/complaints`);
      setComplaints(response.data);
      applyFilters(response.data, searchQuery, activeTab);
    } catch (error) {
      Alert.alert('Error', 'Could not load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const applyFilters = (data, query, tab) => {
    let filtered = data.filter(c => {
      const status = c.status || 'PENDING';
      if (tab === 'Resolved') return status === 'RESOLVED';
      return status !== 'RESOLVED'; // Shows PENDING and IN_PROGRESS
    });

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(c => 
        (c.ticketId && c.ticketId.toLowerCase().includes(q)) ||
        (c.hTrackingNumber && c.hTrackingNumber.toLowerCase().includes(q)) ||
        (c.customerName && c.customerName.toLowerCase().includes(q)) ||
        (c.productName && c.productName.toLowerCase().includes(q))
      );
    }
    setFilteredComplaints(filtered);
  };

  useEffect(() => {
    applyFilters(complaints, searchQuery, activeTab);
  }, [searchQuery, activeTab, complaints]);

  const handleUpdateStatus = (id, currentStatus) => {
    if (Platform.OS === 'web') {
      const newStatus = window.prompt(`Current Status: ${currentStatus}\nEnter new status (PENDING, IN_PROGRESS, RESOLVED):`, currentStatus);
      if (newStatus && ['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(newStatus.toUpperCase().trim())) {
        updateStatus(id, newStatus.toUpperCase().trim());
      } else if (newStatus) {
        window.alert('Invalid status. Please enter PENDING, IN_PROGRESS, or RESOLVED.');
      }
    } else {
      Alert.alert('Update Status', `Current: ${currentStatus}`, [
        { text: 'Pending', onPress: () => updateStatus(id, 'PENDING') },
        { text: 'In Progress', onPress: () => updateStatus(id, 'IN_PROGRESS') },
        { text: 'Resolved', onPress: () => updateStatus(id, 'RESOLVED') },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE}/complaints/${id}`, { status: newStatus });
      fetchComplaints();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = (id) => {
    const doDelete = async () => {
      try {
        await axios.delete(`${API_BASE}/complaints/${id}`);
        fetchComplaints();
      } catch (error) {
        if (Platform.OS === 'web') window.alert('Could not delete complaint');
        else Alert.alert('Error', 'Could not delete complaint');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this complaint?')) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Complaint', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete }
      ]);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.ticketId}>{item.ticketId}</Text>
          <Text style={styles.hCode}>H-Code: {item.hTrackingNumber || 'N/A'}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.statusBadge, { backgroundColor: item.status === 'RESOLVED' ? COLORS.success : item.status === 'IN_PROGRESS' ? COLORS.warning : COLORS.gray }]}
          onPress={() => handleUpdateStatus(item._id, item.status)}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />

      <Text style={styles.productName}>{item.productName}</Text>
      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.infoGrid}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Customer</Text>
          <Text style={styles.infoValue}>{item.customerName}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>{item.category}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Priority</Text>
          <Text style={[styles.infoValue, { color: item.priority === 'High' ? COLORS.danger : COLORS.blackTie }]}>{item.priority}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Staff</Text>
          <Text style={[styles.infoValue, { color: item.assignedStaff === 'Unassigned' ? COLORS.warning : COLORS.success }]}>{item.assignedStaff || 'Unassigned'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <TouchableOpacity style={styles.deleteLink} onPress={() => handleDelete(item._id)}>
          <Text style={styles.deleteLinkText}>Delete</Text>
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
        <Text style={styles.title}>Complaint Manager</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{complaints.length}</Text>
          <Text style={styles.overviewLabel}>Total Complaints</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: COLORS.danger }]}>
            {complaints.filter(c => c.status !== 'RESOLVED').length}
          </Text>
          <Text style={styles.overviewLabel}>Active / Unresolved</Text>
        </View>
      </View>

      {/* Search and Tabs */}
      <View style={styles.controls}>
        <TextInput 
          style={styles.searchBar}
          placeholder="Search by ID, H-Code, or Name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.gray}
        />
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Active' && styles.activeTab]} 
            onPress={() => setActiveTab('Active')}
          >
            <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Resolved' && styles.activeTab]} 
            onPress={() => setActiveTab('Resolved')}
          >
            <Text style={[styles.tabText, activeTab === 'Resolved' && styles.activeTabText]}>Resolved</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 18 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No complaints found.</Text>}
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
  
  overviewContainer: { flexDirection: 'row', paddingHorizontal: 18, paddingTop: 18, gap: 12 },
  overviewCard: { flex: 1, backgroundColor: COLORS.diamond, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08 },
  overviewValue: { fontSize: 20, fontWeight: '800', color: COLORS.sapphire, marginBottom: 4 },
  overviewLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },

  controls: { padding: 18, backgroundColor: COLORS.diamond, borderBottomWidth: 1, borderBottomColor: COLORS.icyLake },
  searchBar: { backgroundColor: COLORS.silver, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14, color: COLORS.blackTie, marginBottom: 12 },
  tabBar: { flexDirection: 'row', gap: 10 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: COLORS.silver },
  activeTab: { backgroundColor: COLORS.golden },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.gray },
  activeTabText: { color: COLORS.diamond },

  card: {
    backgroundColor: COLORS.diamond, borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  ticketId: { fontSize: 14, fontWeight: '800', color: COLORS.golden, letterSpacing: 0.5 },
  hCode: { fontSize: 11, fontWeight: '700', color: COLORS.sapphire, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: COLORS.diamond, fontSize: 10, fontWeight: '800' },
  
  divider: { height: 1, backgroundColor: COLORS.icyLake, marginVertical: 10 },
  
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.blackTie, marginBottom: 4 },
  description: { fontSize: 13, color: COLORS.gray, marginBottom: 12, lineHeight: 18 },
  
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, backgroundColor: COLORS.silver, padding: 10, borderRadius: 8 },
  infoBox: { width: '47%' },
  infoLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 12, color: COLORS.blackTie, fontWeight: '700' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  dateText: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  deleteLink: { padding: 5 },
  deleteLinkText: { color: COLORS.danger, fontWeight: '700', fontSize: 12 },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.gray, fontSize: 16 }
});

export default AdminComplaintsScreen;
