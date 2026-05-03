import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';

const COLORS = {
  sapphire: '#0f2747', golden: '#3b82f6', silver: '#f4f7fb',
  icyLake: '#e9f1fb', diamond: '#ffffff', blackTie: '#111827',
  gray: '#6b7280', danger: '#ef4444', success: '#10b981'
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'admins' | 'riders'

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/users`);
      setUsers(response.data);
    } catch (error) {
      console.log('Error fetching users', error);
      Alert.alert('Error', 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (id, name) => {
    Alert.alert('Remove User', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', style: 'destructive', 
        onPress: async () => {
          try {
            await axios.delete(`${API_BASE}/users/${id}`);
            fetchUsers();
            Alert.alert('Deleted', 'User has been removed.');
          } catch (error) {
            Alert.alert('Error', 'Could not delete user');
          }
        }
      }
    ]);
  };

  const handleRoleChange = (id, currentRole) => {
    Alert.alert('Change Role', 'Select new role for this user:', [
      { text: 'Admin', onPress: () => updateRole(id, 'admin') },
      { text: 'Rider', onPress: () => updateRole(id, 'rider') },
      { text: 'Customer', onPress: () => updateRole(id, 'customer') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const updateRole = async (id, newRole) => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/users/${id}`, { role: newRole });
      fetchUsers();
      Alert.alert('Success', `User role updated to ${newRole}`);
    } catch (error) {
      Alert.alert('Error', 'Could not update user role');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    if (activeTab === 'customers') return users.filter(u => u.role === 'customer');
    if (activeTab === 'admins') return users.filter(u => u.role === 'admin');
    if (activeTab === 'riders') return users.filter(u => u.role === 'rider');
    return [];
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionBtns}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleRoleChange(item._id, item.role)}>
          <Text style={styles.btnText}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id, item.name)}>
          <Text style={styles.btnText}>🗑️</Text>
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
        <Text style={styles.title}>User Management</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewValue}>{users.length}</Text>
          <Text style={styles.overviewLabel}>Total Users</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={[styles.overviewValue, { color: COLORS.golden }]}>
            {getFilteredUsers().length}
          </Text>
          <Text style={styles.overviewLabel}>{activeTab.toUpperCase()}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]} 
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>Customers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'admins' && styles.activeTab]} 
          onPress={() => setActiveTab('admins')}
        >
          <Text style={[styles.tabText, activeTab === 'admins' && styles.activeTabText]}>Admins</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'riders' && styles.activeTab]} 
          onPress={() => setActiveTab('riders')}
        >
          <Text style={[styles.tabText, activeTab === 'riders' && styles.activeTabText]}>Riders</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.golden} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={getFilteredUsers()}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={{ padding: 18 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No {activeTab} found.</Text>}
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

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.diamond,
    padding: 10,
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.icyLake,
  },
  tabText: {
    color: COLORS.gray, fontWeight: '600', fontSize: 14,
  },
  activeTabText: {
    color: COLORS.sapphire, fontWeight: '800',
  },

  userCard: {
    backgroundColor: COLORS.diamond, borderRadius: 12, padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.golden,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: COLORS.diamond, fontSize: 20, fontWeight: '800' },
  details: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: COLORS.blackTie, marginBottom: 2 },
  userEmail: { fontSize: 13, color: COLORS.gray, marginBottom: 4 },
  roleTag: {
    alignSelf: 'flex-start', backgroundColor: COLORS.icyLake, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6
  },
  roleText: { color: COLORS.sapphire, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  
  actionBtns: { flexDirection: 'row', gap: 10 },
  editBtn: { backgroundColor: COLORS.icyLake, padding: 10, borderRadius: 8 },
  deleteBtn: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8 },
  btnText: { fontSize: 14 },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: COLORS.gray, fontSize: 16 },
});

export default UserManagementScreen;
