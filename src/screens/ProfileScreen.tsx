import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { User, Shield, LogOut, ChevronRight, Phone, Mail, MapPin } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/client';
import GradientHeader from '../components/GradientHeader';
import { resolveUrl } from '../utils/url';
import { COLORS } from '../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  // Removed local resolveUrl function as it's now imported from '../utils/url'

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.logoutBtn'), 
          style: 'destructive',
          onPress: async () => {
            await logout();
            // AuthContext should handle redirection to Login
          }
        }
      ]
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('sidebar.profile')}
        subtitle={user?.fullName || user?.username}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            {user?.photo || user?.avatar || user?.profilePicture ? (
              <Image 
                source={{ uri: resolveUrl(user?.photo || user?.avatar || user?.profilePicture) }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} color={COLORS.white} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{user?.fullName || user?.username}</Text>
          <View style={styles.roleBadge}>
            <Shield size={14} color={COLORS.primary} />
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || t('sidebar.users').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountInfo')}</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <User size={18} color="#64748b" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{t('profile.username')}</Text>
                <Text style={styles.infoValue}>{user?.username || '-'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Phone size={18} color="#64748b" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{t('profile.phoneNumber')}</Text>
                <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Mail size={18} color="#64748b" />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{t('profile.email')}</Text>
                <Text style={styles.infoValue}>{user?.email || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('SettingsTab')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <User size={20} color="#2563eb" />
            </View>
            <Text style={styles.menuLabel}>{t('profile.editProfile')}</Text>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t('appSettings.version')} 1.0.6</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    marginBottom: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  logoutBtn: {
    marginHorizontal: 24,
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  version: {
    textAlign: 'center',
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
