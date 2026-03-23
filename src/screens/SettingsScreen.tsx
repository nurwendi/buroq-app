import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { LogOut, User, Shield, Info, Settings as SettingsIcon, ChevronRight, CreditCard, Database, Server, Cog, Printer } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import PrinterSettingsModal from '../components/PrinterSettingsModal';
import apiClient from '../api/client';
import { Alert, ActivityIndicator, Image } from 'react-native';
import { Languages } from 'lucide-react-native';
import { resolveUrl } from '../utils/url';
import GradientHeader from '../components/GradientHeader';
import { StatusBar } from 'react-native';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigation = useNavigation<any>();
  const [backingUp, setBackingUp] = React.useState(false);
  const [printerModalVisible, setPrinterModalVisible] = React.useState(false);

  const handleBackup = async () => {
    Alert.alert(
      t('appSettings.backupTitle'),
      t('appSettings.backupConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('appSettings.backupConfirmBtn'), 
          onPress: async () => {
            setBackingUp(true);
            try {
              const response = await apiClient.post('/api/backup', {});
              Alert.alert(t('common.success'), t('appSettings.backupSuccess'));
            } catch (error) {
              console.error('Backup failed:', error);
              Alert.alert(t('common.error'), t('appSettings.backupError'));
            } finally {
              setBackingUp(false);
            }
          }
        }
      ]
    );
  };

  const changeLanguage = () => {
    Alert.alert(
      t('appSettings.selectLanguage'),
      '',
      [
        { text: 'Bahasa Indonesia', onPress: () => setLanguage('id') },
        { text: 'English', onPress: () => setLanguage('en') },
        { text: t('common.cancel'), style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('sidebar.settings')}
        subtitle={user?.fullName || user?.username}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image 
                source={{ uri: resolveUrl(user.avatar) }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Text style={styles.avatarText}>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>{user?.fullName || user?.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || t('sidebar.users').toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Setting Groups */}
        <Text style={styles.sectionTitle}>{t('appSettings.accountSecurity')}</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#eff6ff' }]}>
              <User size={20} color="#2563eb" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.editProfile')}</Text>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#fff7ed' }]}>
              <Shield size={20} color="#f97316" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.changePassword')}</Text>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('appSettings.application')}</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('ServerSettings')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#f5f3ff' }]}>
              <SettingsIcon size={20} color="#7c3aed" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.serverSettings')}</Text>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={changeLanguage}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#fdf2f8' }]}>
              <Languages size={20} color="#db2777" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.language')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.languageValue}>
                {language === 'id' ? 'Bahasa Indonesia' : 'English'}
              </Text>
              <ChevronRight size={20} color="#cbd5e1" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('About')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#f0fdf4' }]}>
              <Info size={20} color="#10b981" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.aboutApp')}</Text>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setPrinterModalVisible(true)}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#ecfdf5' }]}>
              <Printer size={20} color="#10b981" />
            </View>
            <Text style={styles.settingLabel}>
              {(() => {
                const label = t('appSettings.printerSettings');
                if (label !== 'appSettings.printerSettings') return label;
                const label2 = t('billing.printerSettings');
                if (label2 !== 'billing.printerSettings') return label2;
                return 'Printer Settings';
              })()}
            </Text>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {(user?.role === 'superadmin' || user?.role === 'admin') && (
          <>
            <Text style={styles.sectionTitle}>{t('appSettings.systemInfra')}</Text>
            <View style={styles.settingGroup}>
              {(user?.role === 'superadmin' || user?.role === 'admin') && (
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => navigation.navigate('SystemSettings')}
                >
                  <View style={[styles.settingIcon, { backgroundColor: '#eff6ff' }]}>
                    <Cog size={20} color="#2563eb" />
                  </View>
                  <Text style={styles.settingLabel}>{t('appSettings.systemSettings')}</Text>
                  <ChevronRight size={20} color="#cbd5e1" />
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('NasManagement')}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#f5f3ff' }]}>
                  <Server size={20} color="#7c3aed" />
                </View>
                <Text style={styles.settingLabel}>{t('appSettings.nasManagement')}</Text>
                <ChevronRight size={20} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('PaymentGatewaySettings')}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#fdf2f8' }]}>
                  <CreditCard size={20} color="#db2777" />
                </View>
                <Text style={styles.settingLabel}>{t('appSettings.paymentGateway')}</Text>
                <ChevronRight size={20} color="#cbd5e1" />
              </TouchableOpacity>

              {user?.role === 'superadmin' && (
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={handleBackup}
                  disabled={backingUp}
                >
                  <View style={[styles.settingIcon, { backgroundColor: '#ecfdf5' }]}>
                    {backingUp ? <ActivityIndicator size="small" color="#10b981" /> : <Database size={20} color="#10b981" />}
                  </View>
                  <Text style={styles.settingLabel}>{t('appSettings.backupTitle')}</Text>
                  <ChevronRight size={20} color="#cbd5e1" />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>{t('appSettings.version')} 1.0.8 (Build 12)</Text>

      </ScrollView>

      <PrinterSettingsModal 
        visible={printerModalVisible} 
        onClose={() => setPrinterModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 32,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 16,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  settingGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 10,
    marginBottom: 32,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  languageValue: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    height: 64,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginTop: 8,
    gap: 12,
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
    color: '#ef4444',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  versionText: {
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
