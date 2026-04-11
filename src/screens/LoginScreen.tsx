import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput,
  TouchableOpacity,
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform, 
  ImageBackground,
  Dimensions,
  Image,
  Animated,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Lock, Eye, EyeOff, Settings } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Reanimated, { SlideInDown } from 'react-native-reanimated';
import { CONFIG } from '../api/config';
import { updateApiBaseUrl } from '../api/client';
import { COLORS } from '../constants/theme';
import { resolveUrl } from '../utils/url';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showServerSetting, setShowServerSetting] = useState(false);
  const [serverUrl, setServerUrl] = useState(CONFIG.API_BASE_URL);
  const [logoUrl, setLogoUrl] = useState('https://raw.githubusercontent.com/nurwendi/buroqmanager/master/public/logo.png');
  const [loginBgUrl, setLoginBgUrl] = useState('');

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const { login } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    loadServerUrl();
    
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const loadServerUrl = async () => {
    const savedUrl = await AsyncStorage.getItem(CONFIG.SERVER_URL_KEY);
    const currentUrl = savedUrl || CONFIG.API_BASE_URL;
    
    setServerUrl(currentUrl);
    updateApiBaseUrl(currentUrl);
    
    // Fetch dynamic logo and background
    try {
      const res = await fetch(`${currentUrl}/api/app-settings`);
      const data = await res.json();
      if (data.logoUrl) setLogoUrl(resolveUrl(data.logoUrl));
      if (data.loginBgUrl) setLoginBgUrl(resolveUrl(data.loginBgUrl));
    } catch (e) {
      console.log('Failed to fetch app settings gracefully');
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setError(t('login.loginRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate server URL format before saving
      let finalUrl = serverUrl.trim();
      if (!finalUrl.startsWith('http')) {
        finalUrl = `http://${finalUrl}`;
      }
      
      await AsyncStorage.setItem(CONFIG.SERVER_URL_KEY, finalUrl);
      updateApiBaseUrl(finalUrl); // Update axios base URL
      
      await login(username, password);
    } catch (e: any) {
      console.error('Login Error Detailed:', e);
      let msg = t('login.loginFailed');
      
      if (e.message) {
        if (e.message.toLowerCase().includes('network error')) {
          msg = t('login.networkError') || 'Server tidak dapat dijangkau. Periksa URL server Anda.';
        } else if (e.message.toLowerCase().includes('timeout')) {
          msg = t('login.timeoutError') || 'Koneksi ke server terputus (timeout).';
        } else if (e.message.toLowerCase().includes('401') || e.message.toLowerCase().includes('invalid')) {
          msg = t('login.invalidCredentials') || 'Username atau Password salah.';
        } else {
          msg = e.message;
        }
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Section */}
      <View style={StyleSheet.absoluteFill}>
        {loginBgUrl ? (
          <ImageBackground
            source={{ uri: loginBgUrl }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <View style={styles.darkOverlay} />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={[COLORS.primaryLight, '#eef2ff']}
            style={styles.backgroundImage}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Animated.View 
            style={[
              { 
                width: '100%',
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <BlurView intensity={Platform.OS === 'ios' ? 60 : 100} tint="dark" style={styles.form}>
              <View style={styles.header}>
                <Image 
                  source={{ uri: logoUrl }} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

            <View style={styles.inputContainer}>
            <View style={styles.iconWrapper}>
              <User size={20} color={COLORS.white} />
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('login.usernamePlaceholder')}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardAppearance="dark"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.iconWrapper}>
              <Lock size={20} color={COLORS.white} />
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('login.passwordPlaceholder')}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              keyboardAppearance="dark"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? 
                <EyeOff size={20} color={COLORS.white} /> : 
                <Eye size={20} color={COLORS.white} />
              }
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

            <TouchableOpacity 
              style={[styles.loginButton, { borderColor: COLORS.white + '40' }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.warning} />
              ) : (
                <Text style={styles.loginButtonText}>{t('login.signIn').toUpperCase()}</Text>
              )}
            </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowServerSetting(!showServerSetting)}
            style={styles.settingsToggle}
          >
            <Settings size={16} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.settingsText}>
              {showServerSetting ? t('login.closeServerSettings') : t('login.serverSettings')}
            </Text>
          </TouchableOpacity>

          {showServerSetting && (
            <Reanimated.View 
              entering={SlideInDown.duration(300)}
              style={styles.serverBox}
            >
              <TextInput
                style={styles.serverInput}
                placeholder={t('login.serverUrlPlaceholder')}
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                keyboardType="url"
                keyboardAppearance="dark"
              />
            </Reanimated.View>
          )}
            </BlurView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: width,
    height: height,
    flex: 1,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.slate[900] + '66', // Slate-900 with transparency (approx 0.4)
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 220,
    height: 140,
  },
  form: {
    width: '100%',
    padding: 32,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    backgroundColor: COLORS.slate[900] + 'CC', // Darker background (approx 0.8)
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    height: 64,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '26', // Primary blue tint (approx 0.15)
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '66', // approx 0.4
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
    height: '100%',
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 20,
    marginTop: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 18,
  },
  loginButton: {
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 10,
    borderWidth: 0,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 10,
  },
  settingsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  serverBox: {
    marginTop: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serverInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
    color: COLORS.white,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  }
});

