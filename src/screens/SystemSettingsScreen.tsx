import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { 
  Save, 
  Building, 
  Calendar, 
  Mail, 
  Info
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import GradientHeader from '../components/GradientHeader';
import { resolveUrl } from '../utils/url';
import { COLORS } from '../constants/theme';

export default function SystemSettingsScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    companyAddress: '',
    companyContact: '',
    invoiceFooter: '',
    autoDropDate: 10,
    email: {
      host: '',
      port: '',
      user: '',
      password: '',
      secure: false
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/api/billing/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      Alert.alert(t('common.error'), t('systemSettings.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/billing/settings', settings);
      Alert.alert(t('common.success'), t('systemSettings.saveSuccess'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert(t('common.error'), t('systemSettings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, multiline = false }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        placeholderTextColor={COLORS.slate[400]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('systemSettings.title')}
        subtitle={user?.fullName || user?.username}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity 
            style={styles.headerSaveBtn} 
            onPress={handleSave} 
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Save size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Company Info Section - Only for Superadmin */}
          {user?.role === 'superadmin' && (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Building size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.sectionTitle}>{t('systemSettings.companyInfo')}</Text>
              </View>

              <View style={styles.formCard}>
                <InputField 
                  label={t('systemSettings.companyName')}
                  value={settings.companyName}
                  onChangeText={(text: string) => setSettings({ ...settings, companyName: text })}
                  placeholder={t('systemSettings.companyNamePlaceholder') || "Contoh: Buroq Net"}
                />

                <InputField 
                  label={t('systemSettings.companyContact')}
                  value={settings.companyContact}
                  onChangeText={(text: string) => setSettings({ ...settings, companyContact: text })}
                  placeholder="billing@net.id"
                  keyboardType="email-address"
                />

                <InputField 
                  label={t('systemSettings.companyAddress')}
                  value={settings.companyAddress}
                  onChangeText={(text: string) => setSettings({ ...settings, companyAddress: text })}
                  placeholder={t('systemSettings.addressPlaceholder') || "Alamat lengkap perusahan..."}
                  multiline
                />
              </View>
            </>
          )}

          {/* Billing Automation Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Calendar size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>{t('systemSettings.billingAutomation')}</Text>
          </View>

          <View style={styles.formCard}>
            <InputField 
              label={t('systemSettings.autoDropDate')}
              value={settings.autoDropDate ? String(settings.autoDropDate) : ''}
              onChangeText={(text: string) => setSettings({ ...settings, autoDropDate: parseInt(text) || 10 })}
              placeholder="10"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>{t('systemSettings.autoDropDateHelp')}</Text>

            <View style={styles.divider} />

            <InputField 
              label={t('systemSettings.invoiceFooter')}
              value={settings.invoiceFooter}
              onChangeText={(text: string) => setSettings({ ...settings, invoiceFooter: text })}
              placeholder={t('systemSettings.invoiceFooterPlaceholder') || "Terima kasih atas kepercayaannya..."}
              multiline
            />
          </View>

          {/* SMTP Configuration Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Mail size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>{t('systemSettings.smtpConfig')}</Text>
          </View>

          <View style={styles.formCard}>
            <InputField 
              label={t('systemSettings.smtpHost')}
              value={settings.email?.host}
              onChangeText={(text: string) => setSettings({ ...settings, email: { ...settings.email, host: text } })}
              placeholder="smtp.gmail.com"
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputField 
                  label={t('systemSettings.smtpPort')}
                  value={settings.email?.port ? String(settings.email.port) : ''}
                  onChangeText={(text: string) => setSettings({ ...settings, email: { ...settings.email, port: text } })}
                  placeholder="587"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>{t('systemSettings.smtpSecure')}</Text>
                <View style={styles.switchWrapper}>
                  <Switch
                    value={settings.email?.secure}
                    onValueChange={(val) => setSettings({ ...settings, email: { ...settings.email, secure: val } })}
                    trackColor={{ false: COLORS.slate[200], true: COLORS.primary + '80' }}
                    thumbColor={settings.email?.secure ? COLORS.primary : COLORS.slate[50]}
                  />
                </View>
              </View>
            </View>

            <InputField 
              label={t('systemSettings.smtpUser')}
              value={settings.email?.user}
              onChangeText={(text: string) => setSettings({ ...settings, email: { ...settings.email, user: text } })}
              placeholder="email@gmail.com"
            />

            <InputField 
              label={t('systemSettings.smtpPass')}
              value={settings.email?.password}
              onChangeText={(text: string) => setSettings({ ...settings, email: { ...settings.email, password: text } })}
              placeholder={settings.email?.password === '******' ? t('systemSettings.smtpPassSaved') : t('systemSettings.smtpPassPlaceholder')}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveBtnFull, saving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>{t('systemSettings.saveAll') || 'SIMPAN SEMUA PENGATURAN'}</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  headerSaveBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
  },
  scrollContent: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
    borderColor: COLORS.slate[100],
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate[400],
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.slate[50],
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 15,
    color: COLORS.slate[900],
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: COLORS.slate[100],
  },
  textArea: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontStyle: 'italic',
    marginTop: -10,
    marginBottom: 20,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  switchWrapper: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 8,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.slate[100],
    marginVertical: 12,
    marginBottom: 24,
    marginHorizontal: -24,
  },
  saveBtnFull: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
