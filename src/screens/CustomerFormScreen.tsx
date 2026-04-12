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
  Linking,
  StatusBar,
  Modal,
  FlatList
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
  BookUser,
  Compass,
  MessageSquare,
  Server,
  Info,
  Key,
  Activity,
  ChevronDown,
  Search
} from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAlert } from '../context/AlertContext';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from '../constants/theme';

const InputField = ({ label, icon: Icon, value, onChangeText, placeholder, secureTextEntry = false, keyboardType = 'default', rightIcon: RightIcon, onRightIconPress, editable = true, multiline = false }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, !editable && styles.inputWrapperDisabled, multiline && styles.inputWrapperMultiline]}>
      <View style={[styles.iconBox, multiline && { height: 56, justifyContent: 'center' }]}>
        <Icon size={20} color={editable ? COLORS.slate[500] : COLORS.slate[400]} />
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

export default function CustomerFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const { customer, mode = 'add' } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  
  const [formData, setFormData] = useState({
    id: customer?.id || '',
    username: customer?.username || '',
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    password: '',
    profile: customer?.profile?.name || customer?.profileId || '',
    agentId: customer?.agentId || '',
    technicianId: customer?.technicianId || '',
    coordinates: customer?.coordinates || '',
    comment: customer?.comment || '',
    customerId: customer?.customerId || '',
    routerIds: customer?.routerIds || [],
    service: 'pppoe',
  });

  const [profiles, setProfiles] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [routers, setRouters] = useState<any[]>([]);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [profilesRes, usersRes, settingsRes] = await Promise.all([
        apiClient.get('/api/pppoe/profiles'),
        apiClient.get('/api/admin/users'),
        apiClient.get('/api/settings')
      ]);
      
      setProfiles(profilesRes.data);
      setAgents(usersRes.data.filter((u: any) => u.isAgent || u.role === 'staff' || u.role === 'agent' || u.role === 'partner'));
      setTechnicians(usersRes.data.filter((u: any) => u.isTechnician || u.role === 'technician' || u.role === 'staff'));
      setRouters(settingsRes.data.connections || []);
      
      if (mode === 'add') {
        const updates: any = {};
        if (settingsRes.data.connections?.length > 0) {
            updates.routerIds = [settingsRes.data.connections[0].id];
        }
        
        if (user?.isAgent || ['staff', 'agent', 'partner'].includes(user?.role)) {
            updates.agentId = user.id;
        }

        if (user?.isTechnician || user?.role === 'technician') {
            updates.technicianId = user.id;
        }

        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
      } else if (mode === 'edit') {
        if ((!formData.routerIds || formData.routerIds.length === 0) && customer?.session?.routerId) {
            setFormData(prev => ({ ...prev, routerIds: [customer.session.routerId] }));
        }
      }
    } catch (e) {
      console.error('Failed to fetch initial data', e);
      showAlert({ title: t('common.error'), message: t('users.dataSupportError'), type: 'error' });
    } finally {
      setFetchingData(false);
    }
  };

  const handleSave = async () => {
    const missingFields = [];
    if (!formData.username) missingFields.push(t('users.username'));
    if (mode === 'add' && !formData.password) missingFields.push(t('users.password'));
    if (!formData.profile || formData.profile === '') missingFields.push(t('users.profile'));
    if (!formData.name) missingFields.push(t('users.fullName'));
    if (!formData.address) missingFields.push(t('users.address'));
    
    if (['staff', 'agent', 'technician'].includes(user?.role)) {
       if (!formData.agentId && user?.role !== 'technician') missingFields.push(t('users.agent'));
       if (!formData.technicianId && user?.role === 'technician') missingFields.push(t('users.technician'));
    }

    if (missingFields.length > 0) {
      showAlert({ title: t('common.error'), message: t('messages.validationError', { fields: '\n- ' + missingFields.join('\n- ') }), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'add') {
        const pppoePayload = {
          name: formData.username,
          password: formData.password,
          profile: formData.profile,
          service: 'pppoe',
          routerIds: formData.routerIds,
          comment: formData.comment,
          coordinates: formData.coordinates,
          customerName: formData.name,
          customerAddress: formData.address,
          customerPhone: formData.phone,
          customerEmail: formData.email,
          agentId: formData.agentId,
          technicianId: formData.technicianId
        };
        const res = await apiClient.post('/api/pppoe/users', pppoePayload);
        
        if (res.data.message && res.data.message.includes('approval')) {
            showAlert({ title: t('common.info'), message: res.data.message, type: 'info', onConfirm: () => navigation.goBack() });
            return;
        }

        if (['staff', 'agent', 'technician'].includes(user?.role)) {
            await apiClient.post('/api/registrations', {
                type: 'register',
                username: formData.username,
                name: formData.name,
                password: formData.password,
                profile: formData.profile,
                service: 'pppoe',
                address: formData.address,
                phone: formData.phone,
                email: formData.email,
                coordinates: formData.coordinates,
                comment: formData.comment,
                agentId: formData.agentId || user.id,
                technicianId: formData.technicianId
            });
            showAlert({ title: t('common.info'), message: t('messages.editRequestSubmitted') || 'Pendaftaran masuk ke antrean persetujuan', type: 'info', onConfirm: () => navigation.goBack() });
            return;
        }

        await apiClient.post('/api/customers', formData);
        
      } else {
        if (['staff', 'agent', 'technician'].includes(user?.role)) {
            await apiClient.post('/api/registrations', {
                type: 'edit',
                targetUsername: formData.username,
                newValues: {
                    username: formData.username,
                    password: formData.password,
                    profile: formData.profile,
                    service: 'pppoe',
                    name: formData.name,
                    address: formData.address,
                    phone: formData.phone,
                    email: formData.email,
                    coordinates: formData.coordinates,
                    comment: formData.comment,
                    agentId: formData.agentId,
                    technicianId: formData.technicianId
                },
                agentId: user.id
            });
            showAlert({ title: t('common.info'), message: t('messages.editRequestSubmitted'), type: 'info', onConfirm: () => navigation.goBack() });
            return;
        }

        await apiClient.post('/api/customers', formData);
      }
      
      showAlert({ title: t('common.success'), message: mode === 'add' ? t('users.addSuccess') : t('users.updateSuccess'), type: 'success', onConfirm: () => navigation.goBack() });
    } catch (e: any) {
      console.error('Save failed:', e.response?.data || e.message);
      showAlert({ title: t('common.error'), message: e.response?.data?.error || t('users.saveError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const pickContact = async () => {
    const { status: existingStatus, canAskAgain } = await Contacts.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus === 'undetermined' && canAskAgain) {
      const { status } = await Contacts.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      try {
        const contact = await Contacts.presentContactPickerAsync();
        if (contact) {
          if (contact.name) {
            setFormData(prev => ({ ...prev, name: contact.name }));
          }
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            let phone = contact.phoneNumbers[0].number || '';
            phone = phone.replace(/[^0-9]/g, '');
            if (phone.startsWith('0')) {
              phone = '62' + phone.slice(1);
            }
            setFormData(prev => ({ ...prev, phone: phone }));
          }
        }
      } catch (e) {
        console.log('Contact picker cancelled or failed');
      }
    } else {
      const message = canAskAgain 
        ? t('users.contactPermissionMsg') 
        : t('users.contactPermissionPermanentMsg');
      
      showAlert({
        title: t('users.permissionDenied'),
        message: message,
        type: 'error',
        onConfirm: !canAskAgain ? () => Linking.openSettings() : undefined
      });
    }
  };

  const handleGetLocation = async () => {
    let { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      const message = canAskAgain 
        ? t('users.locationPermissionMsg') 
        : t('users.locationPermissionPermanentMsg');
      
      showAlert({
        title: t('users.permissionDenied'),
        message: message,
        type: 'error',
        onConfirm: !canAskAgain ? () => Linking.openSettings() : undefined
      });
      return;
    }

    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const coords = `${location.coords.latitude}, ${location.coords.longitude}`;
      setFormData(prev => ({ ...prev, coordinates: coords }));
    } catch (e) {
      showAlert({ title: t('common.error'), message: t('users.gpsError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('users.loadingForm')}</Text>
      </View>
    );
  }

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(profileSearch.toLowerCase())
  );

  const selectedProfile = profiles.find(p => p.name === formData.profile);



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <GradientHeader 
        title={mode === 'add' ? t('users.addTitle') : t('users.editTitle')} 
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
          <View style={styles.formCard}>
            
            <SectionHeader title={t('users.pppoeCredentials')} icon={Key} />
            
            <InputField 
              label={t('users.usernameLabel')} 
              icon={User} 
              value={formData.username}
              onChangeText={(text: string) => setFormData({ ...formData, username: text })}
              placeholder={t('users.usernamePlaceholder') || "Username login"}
            />

            <InputField 
              label={t('users.passwordLabel')} 
              icon={Lock} 
              value={formData.password}
              onChangeText={(text: string) => setFormData({ ...formData, password: text })}
              placeholder={mode === 'edit' ? t('dashboard.wifiPassPlaceholder') : t('users.passwordPlaceholder')}
              secureTextEntry
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('users.profile')}</Text>
              <TouchableOpacity 
                style={[styles.inputWrapper, { paddingRight: 12 }]}
                onPress={() => setShowProfilePicker(true)}
              >
                <View style={styles.iconBox}>
                  <Package size={20} color={COLORS.slate[500]} />
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

            <SectionHeader title={t('users.customerInfo')} icon={Info} />

            <InputField 
              label={t('users.systemId')} 
              icon={Info} 
              value={formData.customerId}
              placeholder={mode === 'add' ? "Auto-generated" : "-"}
              editable={false}
            />

            <InputField 
              label={t('users.fullName')} 
              icon={User} 
              value={formData.name}
              onChangeText={(text: string) => setFormData({ ...formData, name: text })}
              placeholder={t('users.fullNamePlaceholder') || "Contoh: Adi Hudi"}
              rightIcon={BookUser}
              onRightIconPress={pickContact}
            />

            <View style={styles.divider} />

            <InputField 
              label={t('users.whatsappNumber')} 
              icon={Phone} 
              value={formData.phone}
              onChangeText={(text: string) => setFormData({ ...formData, phone: text })}
              placeholder={t('users.whatsappPlaceholder') || "62812..."}
              keyboardType="phone-pad"
            />

            <InputField 
              label={t('users.emailOptional')} 
              icon={Mail} 
              value={formData.email}
              onChangeText={(text: string) => setFormData({ ...formData, email: text })}
              placeholder="customer@example.com"
              keyboardType="email-address"
            />

            <InputField 
              label={t('users.fullAddress')} 
              icon={MapPin} 
              value={formData.address}
              onChangeText={(text: string) => setFormData({ ...formData, address: text })}
              placeholder={t('users.addressPlaceholder') || "Nama jalan, RT/RW, Dusun"}
            />

            <InputField 
              label={t('users.gpsCoordinates')} 
              icon={Compass} 
              value={formData.coordinates}
              onChangeText={(text: string) => setFormData({ ...formData, coordinates: text })}
              placeholder="-6.123, 106.123"
              rightIcon={MapPin}
              onRightIconPress={handleGetLocation}
            />

            <InputField 
              label={t('users.notesComment')} 
              icon={MessageSquare} 
              value={formData.comment}
              onChangeText={(text: string) => setFormData({ ...formData, comment: text })}
              placeholder={t('users.notesPlaceholder') || "Catatan khusus..."}
              multiline
            />

            <View style={styles.divider} />

            <SectionHeader title={t('users.targetRouter')} icon={Server} />
            <View style={styles.inputGroupSpecial}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                 {routers.map((r) => (
                   <TouchableOpacity 
                      key={r.id} 
                      style={[styles.chip, formData.routerIds?.includes(r.id) && styles.chipActive]}
                      onPress={() => {
                        setFormData({ ...formData, routerIds: [r.id] });
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
                      onPress={() => setFormData({ ...formData, agentId: a.id })}
                   >
                      <Text style={[styles.chipText, formData.agentId === a.id && styles.chipTextActive]}>{a.fullName || a.username}</Text>
                   </TouchableOpacity>
                 ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroupSpecial}>
              <Text style={styles.label}>{t('users.selectTechnician')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <TouchableOpacity 
                      style={[styles.chip, !formData.technicianId && styles.chipActive]}
                      onPress={() => setFormData({ ...formData, technicianId: '' })}
                   >
                      <Text style={[styles.chipText, !formData.technicianId && styles.chipTextActive]}>{t('users.noTechnician')}</Text>
                  </TouchableOpacity>
                  {technicians.map((t) => (
                   <TouchableOpacity 
                      key={t.id} 
                      style={[styles.chip, formData.technicianId === t.id && styles.chipActive]}
                      onPress={() => setFormData({ ...formData, technicianId: t.id })}
                   >
                      <Text style={[styles.chipText, formData.technicianId === t.id && styles.chipTextActive]}>{t.fullName || t.username}</Text>
                   </TouchableOpacity>
                 ))}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, loading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>{t('users.saveCustomerData')}</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Profile Picker Modal */}
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
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Package size={48} color={COLORS.slate[200]} />
                  <Text style={styles.emptyText}>{t('common.noData')}</Text>
                </View>
              }
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
    backgroundColor: COLORS.white,
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
  },
  scrollContent: {
    padding: 24,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1.5,
    borderColor: COLORS.slate[100],
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupSpecial: {
    marginBottom: 24,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate[50],
    borderWidth: 1.5,
    borderColor: COLORS.slate[100],
    borderRadius: 16,
    height: 56,
  },
  inputWrapperMultiline: {
    height: 140,
    alignItems: 'flex-start',
  },
  inputWrapperDisabled: {
    backgroundColor: COLORS.slate[100],
    borderColor: COLORS.slate[200],
  },
  iconBox: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1.5,
    borderRightColor: COLORS.slate[100],
  },
  rightIconBox: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1.5,
    borderLeftColor: COLORS.slate[100],
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.slate[900],
    fontWeight: '700',
  },
  inputDisabled: {
    color: COLORS.slate[400],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipScroll: {
    marginLeft: -4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.slate[50],
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.slate[100],
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipActiveIsolir: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.slate[600],
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.slate[100],
    marginVertical: 32,
    marginHorizontal: -24,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '70%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -0.5,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate[50],
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.slate[900],
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: COLORS.slate[50],
  },
  pickerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate[700],
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  pickerItemSubtext: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.slate[300],
    fontSize: 14,
    fontWeight: '700',
  },
});

