import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// =============================================
// COLORS - ඔයාගේ website ම theme
// =============================================
const COLORS = {
  sapphire: '#0f2747',    // Dark Blue (Primary)
  golden: '#3b82f6',     // Blue Accent
  silver: '#f4f7fb',     // Light Background
  icyLake: '#e9f1fb',    // Light Blue
  diamond: '#ffffff',    // White
  blackTie: '#111827',   // Near Black
  gray: '#6b7280',       // Gray text
  danger: '#ef4444',     // Red for errors
};

// =============================================
// API BASE URL - ඔයාගේ Laptop IP address
// =============================================
const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (text) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('⚠️ Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: email.trim(),
        password,
      });

      if (response.data) {
        const { token, ...userData } = response.data;
        login(userData, token);
        // Navigate based on role
        if (userData.role === 'admin') {
          navigation.replace('AdminDashboard');
        } else if (userData.role === 'rider') {
          navigation.replace('RiderDashboard');
        } else {
          navigation.replace('CustomerDashboard');
        }
      }
    } catch (error) {
      Alert.alert(
        '❌ Login Failed',
        error.response?.data?.message || 'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.sapphire} />

        {/* ====== TOP HEADER SECTION ====== */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo.jpeg')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.tagline}>where premium meets technology</Text>
        </View>

        {/* ====== FORM CARD ====== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, emailError ? { borderColor: COLORS.danger } : {}]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (text && !validateEmail(text)) {
                  setEmailError('Invalid email format');
                } else {
                  setEmailError('');
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Signing in...' : 'SIGN IN'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryBtnText}>Create New Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2025 Hyundai Premier Shop. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.sapphire,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    backgroundColor: COLORS.sapphire,
  },
  logo: {
    width: 250,
    height: 100,
  },
  storeName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.diamond,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.icyLake,
    marginTop: 6,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Card
  card: {
    flex: 1,
    backgroundColor: COLORS.diamond,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.sapphire,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 28,
  },

  // Inputs
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.sapphire,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.silver,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: COLORS.blackTie,
    borderWidth: 1.5,
    borderColor: COLORS.icyLake,
  },
  passwordWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },

  // Buttons
  primaryBtn: {
    backgroundColor: COLORS.golden,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.golden,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: COLORS.diamond,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  secondaryBtn: {
    backgroundColor: COLORS.silver,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.icyLake,
  },
  secondaryBtnText: {
    color: COLORS.sapphire,
    fontSize: 15,
    fontWeight: '700',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.icyLake,
  },
  dividerText: {
    marginHorizontal: 12,
    color: COLORS.gray,
    fontSize: 13,
  },

  // Footer
  footer: {
    textAlign: 'center',
    color: COLORS.icyLake,
    fontSize: 12,
    padding: 20,
    backgroundColor: COLORS.sapphire,
  },
});

export default LoginScreen;
