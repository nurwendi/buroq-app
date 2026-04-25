import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { useAlert } from '../context/AlertContext';
import PrinterSettingsModal from '../components/PrinterSettingsModal';
import apiClient from '../api/client';
import { Alert, ActivityIndicator, Image } from 'react-native';
import { Languages } from 'lucide-react-native';
import { resolveUrl } from '../utils/url';
import GradientHeader from '../components/GradientHeader';
import { StatusBar } from 'react-native';
import { COLORS } from '../constants/theme';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();
  const [backingUp, setBackingUp] = React.useState(false);
  const [printerModalVisible, setPrinterModalVisible] = React.useState(false);

  const handleBackup = async () => {
    showAlert({
      title: t('appSettings.backupTitle'),
      message: t('appSettings.backupConfirm'),
      type: 'info',
      confirmText: t('appSettings.backupConfirmBtn'),
      onConfirm: async () => {
        setBackingUp(true);
        try {
          const response = await apiClient.post('/api/backup', {});
          showAlert({ title: t('common.success'), message: t('appSettings.backupSuccess'), type: 'success' });
        } catch (error) {
          console.error('Backup failed:', error);
          showAlert({ title: t('common.error'), message: t('appSettings.backupError'), type: 'error' });
        } finally {
          setBackingUp(false);
        }
      }
    });
  };

  const changeLanguage = () => {
    showAlert({
      title: t('appSettings.selectLanguage'),
      message: '',
      type: 'info',
      buttons: [
        { text: 'Bahasa Indonesia', onPress: () => setLanguage('id') },
        { text: 'English', onPress: () => setLanguage('en') },
        { text: t('common.cancel'), style: 'cancel', onPress: () => {} }
      ]
    });
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '10' }]}>
              <User size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.editProfile')}</Text>
            <ChevronRight size={20} color={COLORS.slate[300]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={[styles.settingIcon, { backgroundColor: COLORS.warning + '10' }]}>
              <Shield size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.changePassword')}</Text>
            <ChevronRight size={20} color={COLORS.slate[300]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('appSettings.application')}</Text>
        <View style={styles.settingGroup}>
          {user?.role !== 'customer' && (
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('ServerSettings')}
            >
              <View style={[styles.settingIcon, { backgroundColor: '#f5f3ff' }]}>
                <SettingsIcon size={20} color="#7c3aed" />
              </View>
              <Text style={styles.settingLabel}>{t('appSettings.serverSettings')}</Text>
              <ChevronRight size={20} color={COLORS.slate[300]} />
            </TouchableOpacity>
          )}
          
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
              <ChevronRight size={20} color={COLORS.slate[300]} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('About')}
          >
            <View style={[styles.settingIcon, { backgroundColor: COLORS.success + '10' }]}>
              <Info size={20} color={COLORS.success} />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.aboutApp')}</Text>
            <ChevronRight size={20} color={COLORS.slate[300]} />
          </TouchableOpacity>
          
          {user?.role !== 'customer' && (
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setPrinterModalVisible(true)}
            >
              <View style={[styles.settingIcon, { backgroundColor: COLORS.success + '10' }]}>
                <Printer size={20} color={COLORS.success} />
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
              <ChevronRight size={20} color={COLORS.slate[300]} />
            </TouchableOpacity>
          )}
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
                  <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '10' }]}>
                    <Cog size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.settingLabel}>{t('appSettings.systemSettings')}</Text>
                  <ChevronRight size={20} color={COLORS.slate[300]} />
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('SystemUsers')}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#f0fdf4' }]}>
                  <User size={20} color="#10b981" />
                </View>
                <Text style={styles.settingLabel}>{t('appSettings.systemUsers')}</Text>
                <ChevronRight size={20} color={COLORS.slate[300]} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('NasManagement')}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#f5f3ff' }]}>
                  <Server size={20} color="#7c3aed" />
                </View>
                <Text style={styles.settingLabel}>{t('appSettings.nasManagement')}</Text>
                <ChevronRight size={20} color={COLORS.slate[300]} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('PaymentGatewaySettings')}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#fdf2f8' }]}>
                  <CreditCard size={20} color="#db2777" />
                </View>
                <Text style={styles.settingLabel}>{t('appSettings.paymentGateway')}</Text>
                <ChevronRight size={20} color={COLORS.slate[300]} />
              </TouchableOpacity>

              {user?.role === 'superadmin' && (
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={handleBackup}
                  disabled={backingUp}
                >
                  <View style={[styles.settingIcon, { backgroundColor: COLORS.success + '10' }]}>
                    {backingUp ? <ActivityIndicator size="small" color={COLORS.success} /> : <Database size={20} color={COLORS.success} />}
                  </View>
                  <Text style={styles.settingLabel}>{t('appSettings.backupTitle')}</Text>
                  <ChevronRight size={20} color={COLORS.slate[300]} />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color={COLORS.error} />
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
    backgroundColor: COLORS.slate[50],
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[100],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 32,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.slate[50],
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.slate[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate[400],
    marginBottom: 16,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  settingGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 10,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
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
    color: COLORS.slate[800],
  },
  languageValue: {
    color: COLORS.slate[400],
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: 64,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginTop: 8,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.error,
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
  versionText: {
    textAlign: 'center',
    color: COLORS.slate[300],
    fontSize: 12,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});


