import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { LogOut, User, Shield, Info, Settings as SettingsIcon, ChevronRight, CreditCard, Database, Server, Cog } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { Alert, ActivityIndicator, Image } from 'react-native';
import { Languages } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigation = useNavigation<any>();
  const [backingUp, setBackingUp] = React.useState(false);

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('sidebar.settings')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}</Text>
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
            <View style={[styles.settingIcon, { backgroundColor: '#e0f2fe' }]}>
              <User size={20} color="#0284c7" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.editProfile')}</Text>
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
              <Shield size={20} color="#d97706" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.changePassword')}</Text>
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('appSettings.application')}</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('ServerSettings')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#f3e8ff' }]}>
              <SettingsIcon size={20} color="#9333ea" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.serverSettings')}</Text>
            <ChevronRight size={20} color="#94a3b8" />
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
              <Text style={{ color: '#94a3b8', fontSize: 13, marginRight: 8 }}>
                {language === 'id' ? 'Bahasa Indonesia' : 'English'}
              </Text>
              <ChevronRight size={20} color="#94a3b8" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => navigation.navigate('About')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
              <Info size={20} color="#16a34a" />
            </View>
            <Text style={styles.settingLabel}>{t('appSettings.aboutApp')}</Text>
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {(user?.role === 'superadmin' || user?.role === 'admin') && (
          <>
            <Text style={styles.sectionTitle}>{t('appSettings.systemInfra')}</Text>
            <View style={styles.settingGroup}>
              {user?.role === 'superadmin' && (
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => navigation.navigate('SystemSettings')}
                >
                  <View style={[styles.settingIcon, { backgroundColor: '#e0f2fe' }]}>
                    <Cog size={20} color="#0284c7" />
                  </View>
                  <Text style={styles.settingLabel}>{t('appSettings.systemSettings')}</Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('NasManagement')}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Server size={20} color="#9333ea" />
                </View>
                <Text style={styles.settingLabel}>{t('appSettings.nasManagement')}</Text>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('PaymentGatewaySettings')}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#fce7f3' }]}>
                  <CreditCard size={20} color="#db2777" />
                </View>
                <Text style={styles.settingLabel}>{t('appSettings.paymentGateway')}</Text>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>

              {user?.role === 'superadmin' && (
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={handleBackup}
                  disabled={backingUp}
                >
                  <View style={[styles.settingIcon, { backgroundColor: '#ecfdf5' }]}>
                    {backingUp ? <ActivityIndicator size="small" color="#059669" /> : <Database size={20} color="#059669" />}
                  </View>
                  <Text style={styles.settingLabel}>{t('appSettings.backupTitle')}</Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>{t('appSettings.version')} 1.0.6 (Build 7)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    padding: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginTop: 10,
    gap: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 24,
    marginBottom: 40,
  }
});
