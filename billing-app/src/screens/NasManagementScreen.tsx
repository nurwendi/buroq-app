import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  FlatList,
  Modal,
  TextInput,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { 
  Plus, 
  Server, 
  Edit2, 
  Shield,
  X as CloseIcon,
  Save
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { resolveUrl } from '../utils/url';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from '../constants/theme';

export default function NasManagementScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nasList, setNasList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: null,
    nasname: '',
    shortname: '',
    secret: '',
    description: ''
  });

  useEffect(() => {
    fetchNas();
  }, []);

  const fetchNas = async () => {
    try {
      const response = await apiClient.get('/api/radius/nas');
      setNasList(response.data);
    } catch (error) {
      console.error('Failed to fetch NAS:', error);
      Alert.alert(t('common.error'), t('nas.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.nasname || !form.secret) {
      Alert.alert(t('common.error'), t('nas.validationError'));
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/api/radius/nas', form);
      fetchNas();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save NAS:', error);
      Alert.alert(t('common.error'), t('nas.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      nasname: '',
      shortname: '',
      secret: '',
      description: ''
    });
  };

  const renderNasItem = ({ item }: any) => (
    <View style={styles.nasCard}>
      <View style={styles.nasHeader}>
        <View style={styles.nasIconContainer}>
          <Server size={20} color={COLORS.primary} />
        </View>
        <View style={styles.nasInfo}>
          <Text style={styles.nasName}>{item.nasname}</Text>
          <Text style={styles.nasShortname}>{item.shortname || '-'}</Text>
        </View>
        <View style={styles.nasActions}>
          <TouchableOpacity 
            onPress={() => { setForm(item); setModalVisible(true); }} 
            style={styles.actionButton}
          >
            <Edit2 size={18} color={COLORS.slate[500]} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.nasFooter}>
        <View style={styles.secretBadge}>
          <Shield size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.secretText}>{item.secret}</Text>
        </View>
        <Text style={styles.nasDescription} numberOfLines={1}>{item.description || t('nas.noDesc')}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('nas.title')}
        subtitle={nasList.length > 0 ? `${nasList.length} ${t('nas.countSuffix') || 'Routers'}` : t('nas.subtitle')}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity 
            onPress={() => { resetForm(); setModalVisible(true); }} 
            style={styles.headerAddBtn}
          >
            <Plus size={24} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={nasList}
          keyExtractor={(item: any) => item.id?.toString()}
          renderItem={renderNasItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Server size={48} color={COLORS.slate[300]} />
              <Text style={styles.emptyText}>{t('nas.emptyList')}</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.modalContent}
          >
            <View style={styles.modalTopHeader}>
              <Text style={styles.modalTitle}>
                {form.id ? t('nas.editTitle') : t('nas.addTitle')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <CloseIcon size={24} color={COLORS.slate[400]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nas.ipAddress')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.nasname}
                  onChangeText={(text) => setForm({ ...form, nasname: text })}
                  placeholder="192.168.88.1"
                  placeholderTextColor={COLORS.slate[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nas.secret')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.secret}
                  onChangeText={(text) => setForm({ ...form, secret: text })}
                  placeholder="radius-secret"
                  placeholderTextColor={COLORS.slate[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nas.shortname')}</Text>
                <TextInput
                  style={styles.input}
                  value={form.shortname}
                  onChangeText={(text) => setForm({ ...form, shortname: text })}
                  placeholder="mikrotik-pusat"
                  placeholderTextColor={COLORS.slate[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('nas.description')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  placeholder="Keterangan router..."
                  placeholderTextColor={COLORS.slate[400]}
                  multiline
                />
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                onPress={handleSave} 
                disabled={saving}
                style={[styles.saveBtnFull, saving && { opacity: 0.7 }]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <Save size={20} color={COLORS.white} />
                    <Text style={styles.saveBtnText}>{t('nas.saveBtn')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  headerAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dbeafe',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 24,
    paddingBottom: 40,
  },
  nasCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
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
  nasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  nasIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  nasInfo: {
    flex: 1,
  },
  nasName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -0.3,
  },
  nasShortname: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nasActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.slate[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate[100],
  },
  nasFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.slate[50],
  },
  secretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
  },
  secretText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.slate[600],
    letterSpacing: 0.5,
  },
  nasDescription: {
    flex: 1,
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '600',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 15,
    color: COLORS.slate[400],
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 28,
    paddingTop: 32,
    maxHeight: '92%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  modalTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -0.5,
  },
  formContent: {
    marginBottom: 24,
  },
  inputGroup: {
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
  modalFooter: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  saveBtnFull: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
