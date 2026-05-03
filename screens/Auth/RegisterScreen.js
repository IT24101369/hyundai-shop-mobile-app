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

// =============================================
// COLORS - ඔයාගේ website ම theme
// =============================================
const COLORS = {
  sapphire: '#0f2747',
  golden: '#3b82f6',
  silver: '#f4f7fb',
  icyLake: '#e9f1fb',
  diamond: '#ffffff',
  blackTie: '#111827',
  gray: '#6b7280',
  success: '#10b981',
};

const API_BASE = 'https://hyundai-shop-backend-api.onrender.com/api';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error States
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validateEmail = (text) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  };

  const roles = [
    { label: '🛒 Customer', value: 'customer' },
    { label: '🚴 Rider', value: 'rider' },
    { label: '🛠️ Admin', value: 'admin' },
  ];

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('⚠️ Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('⚠️ Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('⚠️ Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (response.data) {
        Alert.alert(
          '✅ Account Created!',
          `Welcome to Hyundai Premier Shop, ${response.data.name}! Please login.`,
          [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ Registration Failed',
        error.response?.data?.message || 'Something went wrong. Try again.'
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

        {/* ====== TOP HEADER ====== */}
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
          <Text style={styles.cardTitle}>Join Us Today</Text>
          <Text style={styles.cardSubtitle}>Fill in your details below</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, nameError ? { borderColor: '#ef4444' } : {}]}
              placeholder="John Doe"
              placeholderTextColor={COLORS.gray}
              value={name}
              onChangeText={(text) => {
                setName(text.replace(/[^a-zA-Z\s]/g, ''));
                if (!text.trim()) setNameError('Name is required');
                else setNameError('');
              }}
              autoCapitalize="words"
            />
            {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, emailError ? { borderColor: '#ef4444' } : {}]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.gray}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (text && !validateEmail(text)) setEmailError('Invalid email format');
                else setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput, passwordError ? { borderColor: '#ef4444' } : {}]}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.gray}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (text && text.length < 6) setPasswordError('Min. 6 characters required');
                  else setPasswordError('');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                (confirmError || (confirmPassword && password !== confirmPassword)) && styles.inputError,
              ]}
              placeholder="Re-enter your password"
              placeholderTextColor={COLORS.gray}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (text && text !== password) setConfirmError('Passwords do not match');
                else setConfirmError('');
              }}
              secureTextEntry={!showPassword}
            />
            {!!confirmError && <Text style={styles.errorText}>{confirmError}</Text>}
          </View>

          {/* Role Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.roleContainer}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleBtn,
                    role === r.value && styles.roleBtnActive,
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text
                    style={[
                      styles.roleBtnText,
                      role === r.value && styles.roleBtnTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryBtnText}>Sign In Instead</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 25,
    backgroundColor: COLORS.sapphire,
  },
  logo: {
    width: 200,
    height: 80,
  },
  storeName: {
    fontSize: 34,
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
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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

  // Role Selector
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.silver,
    borderWidth: 1.5,
    borderColor: COLORS.icyLake,
  },
  roleBtnActive: {
    backgroundColor: COLORS.sapphire,
    borderColor: COLORS.sapphire,
  },
  roleBtnText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: COLORS.diamond,
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
    marginBottom: 20,
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
    marginHorizontal: 10,
    color: COLORS.gray,
    fontSize: 12,
  },
});

export default RegisterScreen;
