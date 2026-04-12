import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  FlatList,
  Alert
} from 'react-native';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Lock, 
  Package, 
  Users, 
  Check,
  Server,
  Info,
  Key,
  ChevronDown,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
  ShieldAlert
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAlert } from '../context/AlertContext';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from '../constants/theme';

const InputField = ({ label, icon: Icon, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default', rightIcon: RightIcon, onRightIconPress, editable = true, multiline = false, isChanged = false }: any) => (
  <View style={styles.inputGroup}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {isChanged && <View style={styles.changedBadge}><Text style={styles.changedBadgeText}>CHANGED</Text></View>}
    </View>
    <View style={[
        styles.inputWrapper, 
        !editable && styles.inputWrapperDisabled, 
        multiline && styles.inputWrapperMultiline,
        isChanged && styles.inputWrapperChanged
    ]}>
      <View style={[styles.iconBox, multiline && { height: 56, justifyContent: 'center' }]}>
        <Icon size={20} color={isChanged ? COLORS.warning : (editable ? COLORS.slate[500] : COLORS.slate[400])} />
      </View>
      <TextInput 
        style={[styles.input, !editable && styles.inputDisabled, multiline && { height: 100, paddingTop: 16, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor={COLORS.slate[400]}
        editable={editable}
        multiline={multiline}
      />
      {RightIcon && editable && (
        <TouchableOpacity 
          style={styles.rightIconBox} 
          onPress={onRightIconPress}
        >
          <RightIcon size={20} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const SectionHeader = ({ title, icon: Icon }: any) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIcon}>
      <Icon size={18} color={COLORS.primary} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

export default function RegistrationReviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { registration, readOnly = false } = route.params || {};
  const isAdmin = authUser?.role === 'admin' || authUser?.role === 'superadmin';
  const canEdit = isAdmin && !readOnly;

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [fetchingData, setFetchingData] = useState(true);
  
  const [formData, setFormData] = useState<any>({});
  const [originalValues, setOriginalValues] = useState<any>({});
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  const [profiles, setProfiles] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [routers, setRouters] = useState<any[]>([]);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');

  useEffect(() => {
    if (!registration) {
      navigation.goBack();
      return;
    }
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setFetchingData(true);
      const [profilesRes, usersRes, settingsRes] = await Promise.all([
        apiClient.get('/api/pppoe/profiles'),
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/settings')
      ]);
      
      setProfiles(profilesRes.data);
      setAgents(usersRes.data.filter((u: any) => u.isAgent || u.role === 'staff' || u.role === 'agent' || u.role === 'partner'));
      setTechnicians(usersRes.data.filter((u: any) => u.isTechnician || u.role === 'technician' || u.role === 'staff'));
      setRouters(settingsRes.data.connections || []);

      let initialData: any = {};
      let changedFlags: string[] = [];

      if (registration.type === 'edit') {
        const values = typeof registration.newValues === 'string' ? JSON.parse(registration.newValues) : (registration.newValues || {});
        initialData = {
          username: values.username || registration.username,
          password: values.password || '',
          profile: values.profile || '',
          service: values.service || 'pppoe',
          name: values.name || registration.name || '',
          address: values.address || registration.address || '',
          phone: values.phone || registration.phone || '',
          email: values.email || '',
          agentId: values.agentId || registration.agentId || '',
          technicianId: values.technicianId || registration.technicianId || '',
          coordinates: values.coordinates || registration.coordinates || '',
          comment: values.comment || registration.comment || '',
          routerIds: values.routerIds ? (typeof values.routerIds === 'string' ? JSON.parse(values.routerIds) : values.routerIds) : []
        };
        
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && values[key] !== null) {
                changedFlags.push(key);
            }
        });
      } else {
        initialData = {
          username: registration.username,
          password: registration.password || '',
          profile: registration.profile || '',
          service: registration.service || 'pppoe',
          name: registration.name || '',
          address: registration.address || '',
          phone: registration.phone || '',
          email: registration.email || '',
          agentId: registration.agentId || '',
          technicianId: registration.technicianId || '',
          coordinates: registration.coordinates || '',
          comment: registration.comment || '',
          routerIds: registration.routerIds ? (typeof registration.routerIds === 'string' ? JSON.parse(registration.routerIds) : registration.routerIds) : []
        };
      }

      setFormData(initialData);
      setChangedFields(new Set(changedFlags));
      
    } catch (e) {
      console.error('Failed to fetch initial data', e);
      showAlert({ title: t('common.error'), message: t('users.dataSupportError'), type: 'error' });
    } finally {
      setFetchingData(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    const confirmationMsg = action === 'approve' ? t('approvals.approveConfirm') : t('approvals.rejectConfirm');
    
    Alert.alert(
      action === 'approve' ? t('approvals.approve') : t('approvals.reject'),
      confirmationMsg,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
             setActionLoading(action);
             try {
                const payload = {
                    username: registration.username,
                    action: action,
                    updatedData: action === 'approve' ? formData : undefined
                };

                const res = await apiClient.post('/api/registrations', payload);
                showAlert({ 
                    title: t('common.success'), 
                    message: res.data.message || t('common.success'), 
                    type: 'success',
                    onConfirm: () => navigation.goBack() 
                });
             } catch (e: any) {
                console.error(`Failed to ${action} registration:`, e.response?.data || e.message);
                showAlert({ 
                    title: t('common.error'), 
                    message: e.response?.data?.error || t('common.error'), 
                    type: 'error' 
                });
             } finally {
                setActionLoading(null);
             }
          }
        }
      ]
    );
  };

  if (fetchingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(profileSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <GradientHeader 
        title={t('approvals.title')} 
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoHead}>
              <View style={[
                  styles.typeBadge, 
                  registration.type === 'edit' ? styles.typeBadgeEdit : 
                  registration.type === 'delete' ? styles.typeBadgeDelete :
                  styles.typeBadgeNew
              ]}>
                <Text style={[
                    styles.typeBadgeText, 
                    registration.type === 'edit' ? styles.typeBadgeTextEdit : 
                    registration.type === 'delete' ? { color: '#ef4444' } :
                    styles.typeBadgeTextNew
                ]}>
                  {registration.type === 'edit' ? t('approvals.editRequest').toUpperCase() : 
                   registration.type === 'delete' ? t('approvals.deletionRequest').toUpperCase() :
                   t('approvals.newRegistration').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.dateText}>{new Date(registration.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.requestTitle}>{registration.name || registration.username}</Text>
            <View style={styles.requestedByRow}>
                <User size={14} color={COLORS.slate[400]} />
                <Text style={styles.requestedByText}>{t('approvals.requestedBy')}: <Text style={{fontWeight: '700', color: COLORS.slate[600]}}>{registration.agent?.fullName || registration.agent?.username || 'System'}</Text></Text>
            </View>
          </View>

          {registration.type === 'delete' && (
            <View style={styles.deleteWarningBox}>
              <ShieldAlert size={28} color="#ef4444" />
              <View style={styles.deleteWarningTextWrapper}>
                <Text style={styles.deleteWarningTitle}>{t('approvals.deletionRequest')}</Text>
                <Text style={styles.deleteWarningDesc}>{t('approvals.deleteCustomerConfirm')}</Text>
              </View>
            </View>
          )}

          {registration.type !== 'delete' && (
            <View style={styles.formCard}>
              <View style={styles.reviewHeader}>
                  <Text style={styles.reviewHeaderTitle}>{t('approvals.reviewData')}</Text>
                  <AlertTriangle size={18} color={COLORS.warning} />
              </View>

              <SectionHeader title={t('approvals.pppoeData')} icon={Key} />
              
              <InputField 
                label={t('users.usernameLabel')} 
                icon={User} 
                value={formData.username}
                onChangeText={(text: string) => setFormData({ ...formData, username: text })}
                placeholder="Username"
                isChanged={changedFields.has('username')}
                editable={canEdit}
              />

              <InputField 
                label={t('users.passwordLabel')} 
                icon={Lock} 
                value={formData.password}
                onChangeText={(text: string) => setFormData({ ...formData, password: text })}
                placeholder={t('dashboard.wifiPassPlaceholder')}
                secureTextEntry
                isChanged={changedFields.has('password')}
                editable={canEdit}
              />

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{t('users.profile')}</Text>
                  {changedFields.has('profile') && <View style={styles.changedBadge}><Text style={styles.changedBadgeText}>CHANGED</Text></View>}
                </View>
                <TouchableOpacity 
                  style={[styles.inputWrapper, { paddingRight: 12 }, changedFields.has('profile') && styles.inputWrapperChanged, !canEdit && styles.inputWrapperDisabled]}
                  onPress={() => canEdit && setShowProfilePicker(true)}
                  disabled={!canEdit}
                >
                  <View style={styles.iconBox}>
                    <Package size={20} color={changedFields.has('profile') ? COLORS.warning : COLORS.slate[500]} />
                  </View>
                  <Text style={[
                    styles.input, 
                    !formData.profile && { color: COLORS.slate[400] }
                  ]}>
                    {formData.profile || t('users.profilePlaceholder')}
                  </Text>
                  <ChevronDown size={20} color={COLORS.slate[400]} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />
            </View>
          )}

          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('approvals.customerData')}</Text>
            </View>

            {registration.type === 'delete' ? (
              <View style={styles.deleteInfoBox}>
                 <View style={styles.deleteInfoRow}>
                    <Text style={styles.deleteInfoLabel}>{t('common.name')}:</Text>
                    <Text style={styles.deleteInfoValue}>{formData.name}</Text>
                 </View>
                 <View style={styles.deleteInfoRow}>
                    <Text style={styles.deleteInfoLabel}>{t('users.usernameLabel')}:</Text>
                    <Text style={styles.deleteInfoValue}>{registration.targetUsername}</Text>
                 </View>
                 <View style={styles.deleteInfoRow}>
                    <Text style={styles.deleteInfoLabel}>{t('users.fullAddress')}:</Text>
                    <Text style={styles.deleteInfoValue}>{formData.address || '-'}</Text>
                 </View>
              </View>
            ) : (
              <>
                <InputField 
                  label={t('users.fullName')} 
                  icon={User} 
                  value={formData.name}
                  onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                  placeholder="Nama Lengkap"
                  isChanged={changedFields.has('name')}
                  editable={canEdit}
                />

                <InputField 
                  label={t('users.whatsappNumber')} 
                  icon={Phone} 
                  value={formData.phone}
                  onChangeText={(text: string) => setFormData({ ...formData, phone: text })}
                  placeholder="62812..."
                  keyboardType="phone-pad"
                  isChanged={changedFields.has('phone')}
                  editable={canEdit}
                />

                <InputField 
                  label={t('users.fullAddress')} 
                  icon={MapPin} 
                  value={formData.address}
                  onChangeText={(text: string) => setFormData({ ...formData, address: text })}
                  placeholder="Alamat"
                  isChanged={changedFields.has('address')}
                  editable={canEdit}
                />

                <InputField 
                  label={t('users.notesComment')} 
                  icon={Clock} 
                  value={formData.comment}
                  onChangeText={(text: string) => setFormData({ ...formData, comment: text })}
                  placeholder="Catatan..."
                  multiline
                  isChanged={changedFields.has('comment')}
                  editable={canEdit}
                />
              </>
            )}
          </View>

          {registration.type !== 'delete' && (
            <View style={styles.formCard}>
              <SectionHeader title={t('users.targetRouter')} icon={Server} />
              <View style={styles.inputGroupSpecial}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {routers.map((r) => (
                    <TouchableOpacity 
                        key={r.id} 
                        style={[styles.chip, formData.routerIds?.includes(r.id) && styles.chipActive]}
                        disabled={!canEdit}
                        onPress={() => {
                          if (canEdit) {
                            setFormData({ ...formData, routerIds: [r.id] });
                            setChangedFields(prev => new Set([...prev, 'routerIds']));
                          }
                        }}
                    >
                        <Text style={[styles.chipText, formData.routerIds?.includes(r.id) && styles.chipTextActive]}>{r.name}</Text>
                        {formData.routerIds?.includes(r.id) && <Check size={14} color={COLORS.white} style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.divider} />

              <SectionHeader title={t('users.assignment')} icon={Users} />

              <View style={styles.inputGroupSpecial}>
                <Text style={styles.label}>{t('users.selectSales')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    <TouchableOpacity 
                        style={[styles.chip, !formData.agentId && styles.chipActive]}
                        onPress={() => setFormData({ ...formData, agentId: '' })}
                    >
                        <Text style={[styles.chipText, !formData.agentId && styles.chipTextActive]}>{t('users.noAgent')}</Text>
                    </TouchableOpacity>
                    {agents.map((a) => (
                    <TouchableOpacity 
                        key={a.id} 
                        style={[styles.chip, formData.agentId === a.id && styles.chipActive]}
                        disabled={!canEdit}
                        onPress={() => canEdit && setFormData({ ...formData, agentId: a.id })}
                    >
                        <Text style={[styles.chipText, formData.agentId === a.id && styles.chipTextActive]}>{a.fullName || a.username}</Text>
                    </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            </View>
          )}

          {isAdmin && !readOnly && (
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton, actionLoading === 'reject' && { opacity: 0.7 }]} 
                  onPress={() => handleAction('reject')}
                  disabled={!!actionLoading}
              >
                  {actionLoading === 'reject' ? <ActivityIndicator color={COLORS.white} /> : (
                      <>
                          <XCircle size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                          <Text style={styles.actionButtonText}>{t('approvals.reject')}</Text>
                      </>
                  )}
              </TouchableOpacity>

              <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton, actionLoading === 'approve' && { opacity: 0.7 }]} 
                  onPress={() => handleAction('approve')}
                  disabled={!!actionLoading}
              >
                  {actionLoading === 'approve' ? <ActivityIndicator color={COLORS.white} /> : (
                      <>
                          <CheckCircle size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                          <Text style={styles.actionButtonText}>{t('approvals.approve')}</Text>
                      </>
                  )}
              </TouchableOpacity>
            </View>
          )}
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showProfilePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfilePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('users.selectProfile')}</Text>
              <TouchableOpacity onPress={() => setShowProfilePicker(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={18} color={COLORS.slate[400]} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('common.search')}
                value={profileSearch}
                onChangeText={setProfileSearch}
                placeholderTextColor={COLORS.slate[400]}
              />
            </View>

            <FlatList
              data={filteredProfiles}
              keyExtractor={(item) => item.id || item.name}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.pickerItem,
                    formData.profile === item.name && styles.pickerItemActive
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, profile: item.name });
                    setChangedFields(prev => new Set([...prev, 'profile']));
                    setShowProfilePicker(false);
                  }}
                >
                  <View style={styles.pickerItemLeft}>
                    <View style={[
                      styles.pickerDot,
                      { backgroundColor: item.name.toLowerCase().includes('isolir') ? COLORS.error : COLORS.primary }
                    ]} />
                    <View>
                      <Text style={[
                        styles.pickerItemText,
                        formData.profile === item.name && styles.pickerItemTextActive
                      ]}>
                        {item.name}
                      </Text>
                      {item.price > 0 && (
                        <Text style={styles.pickerItemSubtext}>Rp {item.price.toLocaleString()}</Text>
                      )}
                    </View>
                  </View>
                  {formData.profile === item.name && (
                    <Check size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.slate[500],
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  infoHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeEdit: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  typeBadgeDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  typeBadgeNew: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  typeBadgeText: { fontSize: 12, fontWeight: '800', marginLeft: 6, textTransform: 'uppercase' },
  typeBadgeTextEdit: { color: COLORS.warning },
  typeBadgeTextNew: { color: COLORS.success },
  dateText: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600' },
  requestTitle: { fontSize: 22, fontWeight: '900', color: COLORS.slate[900], marginBottom: 8 },
  requestedByRow: { flexDirection: 'row', alignItems: 'center' },
  requestedByText: { fontSize: 13, color: COLORS.slate[400], marginLeft: 6 },
  
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
    borderColor: COLORS.slate[100],
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.slate[50],
  },
  reviewHeaderTitle: { fontSize: 16, fontWeight: '900', color: COLORS.primaryDark },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 },
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
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.primaryDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  inputGroup: { marginBottom: 20 },
  inputGroupSpecial: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginLeft: 4 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.slate[400], textTransform: 'uppercase', letterSpacing: 1 },
  changedBadge: { backgroundColor: COLORS.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  changedBadgeText: { fontSize: 9, fontWeight: '900', color: COLORS.white },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.slate[50], borderWidth: 1.5, borderColor: COLORS.slate[100], borderRadius: 16, height: 56 },
  inputWrapperMultiline: { height: 140, alignItems: 'flex-start' },
  inputWrapperDisabled: { backgroundColor: COLORS.slate[100], borderColor: COLORS.slate[200] },
  inputWrapperChanged: { borderColor: COLORS.warning, backgroundColor: '#FFFBEB' },
  
  iconBox: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1.5, borderRightColor: COLORS.slate[100] },
  rightIconBox: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1.5, borderLeftColor: COLORS.slate[100] },
  input: { flex: 1, paddingHorizontal: 16, fontSize: 15, color: COLORS.slate[900], fontWeight: '700' },
  inputDisabled: { color: COLORS.slate[400] },
  
  chipScroll: { marginLeft: -4 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.slate[50], borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.slate[100], marginRight: 10, flexDirection: 'row', alignItems: 'center', height: 44 },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.slate[600], fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  chipTextActive: { color: COLORS.white },
  
  divider: { height: 1.5, backgroundColor: COLORS.slate[100], marginVertical: 32, marginHorizontal: -24 },
  
  actionContainer: { flexDirection: 'row', marginTop: 32, justifyContent: 'space-between' },
  actionButton: { flex: 1, height: 64, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  rejectButton: { backgroundColor: COLORS.error, marginRight: 12 },
  approveButton: { backgroundColor: COLORS.success, marginLeft: 12 },
  actionButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.slate[900] },
  closeButton: { padding: 8 },
  closeButtonText: { color: COLORS.primary, fontWeight: '800' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.slate[50], borderRadius: 16, paddingHorizontal: 16, marginBottom: 20, height: 50 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.slate[900] },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate[50] },
  pickerItemActive: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12 },
  pickerItemLeft: { flexDirection: 'row', alignItems: 'center' },
  pickerDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  pickerItemText: { fontSize: 16, fontWeight: '700', color: COLORS.slate[700] },
  pickerItemTextActive: { color: COLORS.primary },
  pickerItemSubtext: { fontSize: 12, color: COLORS.slate[400], fontWeight: '600', marginTop: 2 },
  
  // Deletion Styles
  deleteWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#ffe4e6',
    gap: 16,
  },
  deleteWarningTextWrapper: {
    flex: 1,
  },
  deleteWarningTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#991b1b',
    marginBottom: 4,
  },
  deleteWarningDesc: {
    fontSize: 14,
    color: '#e11d48',
    lineHeight: 20,
    fontWeight: '600',
  },
  deleteInfoBox: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 20,
    gap: 12,
  },
  deleteInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteInfoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  deleteInfoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  }
});
