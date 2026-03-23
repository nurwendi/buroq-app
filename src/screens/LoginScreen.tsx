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
  Animated
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Lock, Eye, EyeOff, Settings } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../api/config';
import { updateApiBaseUrl } from '../api/client';

const { width } = Dimensions.get('window');

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
      if (data.logoUrl) setLogoUrl(data.logoUrl);
      if (data.loginBgUrl) setLoginBgUrl(data.loginBgUrl);
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
      // Save server URL if changed
      await AsyncStorage.setItem(CONFIG.SERVER_URL_KEY, serverUrl);
      updateApiBaseUrl(serverUrl); // Update axios base URL
      
      await login(username, password);
    } catch (e: any) {
      console.error('Login Error:', e);
      let msg = t('login.loginFailed');
      
      if (e.message) {
        if (e.message.includes('Network Error')) {
          msg = t('login.networkError');
        } else if (e.message.includes('timeout')) {
          msg = t('login.timeoutError');
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
    <ImageBackground
      source={loginBgUrl ? { uri: loginBgUrl } : undefined}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={[styles.overlay, !loginBgUrl && styles.defaultBg]} />
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
            <BlurView intensity={60} tint="dark" style={styles.form}>
              <View style={styles.header}>
                <Image 
                  source={{ uri: logoUrl }} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

            <View style={styles.inputContainer}>
            <View style={styles.iconWrapper}>
              <User size={20} color="#ffffff" />
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
              <Lock size={20} color="#ffffff" />
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
                <EyeOff size={20} color="#ffffff" /> : 
                <Eye size={20} color="#ffffff" />
              }
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#f59e0b" />
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
            <View style={styles.serverBox}>
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
            </View>
          )}
            </BlurView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  defaultBg: {
    backgroundColor: '#0f172a',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    height: 60,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  icon: {
    // Legacy mapping
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    height: '100%',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 20,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginButton: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 10,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 10,
  },
  settingsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  serverBox: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serverInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
    color: '#ffffff',
  }
});
