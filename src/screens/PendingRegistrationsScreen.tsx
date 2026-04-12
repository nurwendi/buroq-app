import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Platform,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Phone,
  Shield,
  Layers,
  Info
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../constants/theme';
import GradientHeader from '../components/GradientHeader';

interface Registration {
  id: string;
  type: 'register' | 'edit' | 'delete';
  username?: string;
  targetUsername?: string;
  name?: string;
  address?: string;
  phone?: string;
  profile?: string;
  password?: string;
  newValues?: string;
  agentId?: string;
  technicianId?: string;
  createdAt: string;
  agentName?: string;
}

export default function PendingRegistrationsScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    try {
      const response = await apiClient.get('/api/registrations');
      setRegistrations(response.data);
    } catch (e) {
      console.error('Failed to fetch registrations', e);
      Alert.alert(t('common.error'), 'Gagal mengambil daftar pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRegistrations();
    setRefreshing(false);
  };

  const handleAction = async (reg: Registration, action: 'approve' | 'reject') => {
    const actionLabel = action === 'approve' ? 'menyetujui' : 'menolak';
    const targetName = reg.type === 'register' ? reg.name : reg.targetUsername;

    Alert.alert(
      'Konfirmasi',
      `Apakah Anda yakin ingin ${actionLabel} pendaftaran untuk ${targetName}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: action === 'approve' ? 'Setujui' : 'Tolak', 
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
             try {
                const body: any = { 
                  username: reg.type === 'register' ? reg.username : reg.targetUsername,
                  action 
                };
                if (action === 'approve' && reg.type === 'edit') {
                    // For edits, we might need to send back the values if modified
                    // But usually we just approve what's there.
                }

                const res = await apiClient.post('/api/registrations', body);
                if (res.data.success) {
                   Alert.alert(t('common.success'), res.data.message);
                   fetchRegistrations(); // Refresh list
                } else {
                   Alert.alert(t('common.error'), res.data.error || 'Gagal melakukan tindakan');
                }
             } catch (err: any) {
                Alert.alert(t('common.error'), err.response?.data?.error || 'Terjadi kesalahan sistem');
             }
          }
        }
      ]
    );
  };

  const renderDetailItem = (label: string, value: string | undefined, icon: any) => {
    if (!value) return null;
    const IconComponent = icon;
    return (
      <View style={styles.detailRow}>
        <IconComponent size={14} color={COLORS.slate[400]} />
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  const renderEditChanges = (newValuesStr: string | undefined) => {
    if (!newValuesStr) return null;
    let newValues: any = {};
    try {
      newValues = JSON.parse(newValuesStr);
    } catch (e) {
      return null;
    }

    return (
      <View style={styles.changesContainer}>
        <Text style={styles.changesHeader}>Perubahan Data:</Text>
        {Object.entries(newValues).map(([key, val]: [string, any]) => {
          if (!val) return null;
          return (
            <View key={key} style={styles.changeItem}>
              <View style={styles.changeDot} />
              <Text style={styles.changeKey}>{key === 'username' ? 'Username PPPoE' : 
                                               key === 'name' ? 'Nama Pelanggan' : 
                                               key === 'profile' ? 'Paket/Profile' : key}:</Text>
              <Text style={styles.changeVal}>{String(val)}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item }: { item: Registration }) => {
    const isExpanded = expandedId === item.id;
    const isEdit = item.type === 'edit';
    const isDelete = item.type === 'delete';

    return (
      <View style={[
        styles.card, 
        isEdit && styles.cardEdit, 
        isDelete && styles.cardDelete
      ]}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.typeBadge, 
            isEdit ? styles.badgeEdit : isDelete ? styles.badgeDelete : styles.badgeRegister
          ]}>
            {item.type === 'register' ? <UserPlus size={14} color="#059669" /> : 
             isEdit ? <Edit size={14} color="#d97706" /> : 
             <Trash2 size={14} color="#dc2626" />}
            <Text style={[
              styles.typeText, 
              isEdit ? {color: '#d97706'} : isDelete ? {color: '#dc2626'} : {color: '#059669'}
            ]}>
              {item.type === 'register' ? 'PENDAFTARAN' : isEdit ? 'PERUBAHAN DATA' : 'PENGHAPUSAN'}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
          </Text>
        </View>

        <View style={styles.mainInfo}>
          <Text style={styles.titleText}>{item.name || item.targetUsername}</Text>
          <Text style={styles.subtitleText}>@{item.username || item.targetUsername}</Text>
        </View>

        <TouchableOpacity 
          style={styles.expandToggle} 
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
        >
          <Text style={styles.expandText}>{isExpanded ? 'Tutup Detail' : 'Lihat Detail'}</Text>
          {isExpanded ? <ChevronUp size={16} color={COLORS.slate[400]} /> : <ChevronDown size={16} color={COLORS.slate[400]} />}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.detailsArea}>
            {item.type === 'register' ? (
              <>
                {renderDetailItem('Profile', item.profile, Layers)}
                {renderDetailItem('Alamat', item.address, MapPin)}
                {renderDetailItem('No. HP', item.phone, Phone)}
                {renderDetailItem('Input Oleh', item.agentName || 'Agen', User)}
              </>
            ) : isEdit ? (
              renderEditChanges(item.newValues)
            ) : (
              <View style={styles.deleteWarning}>
                <Info size={16} color="#dc2626" />
                <Text style={styles.deleteWarningText}>User ini akan dihapus permanen dari Mikrotik dan Database.</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnReject]} 
            onPress={() => handleAction(item, 'reject')}
          >
            <XCircle size={18} color="#dc2626" />
            <Text style={styles.btnTextReject}>Tolak</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnApprove]} 
            onPress={() => handleAction(item, 'approve')}
          >
            <CheckCircle size={18} color="#ffffff" />
            <Text style={styles.btnTextApprove}>Setujui</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader 
        title="Pending Approval" 
        subtitle="Kelola Pendaftaran & Edit Data"
        onBackPress={() => navigation.goBack()}
      />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat pendaftaran...</Text>
        </View>
      ) : (
        <FlatList
          data={registrations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={64} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>Semua Beres!</Text>
              <Text style={styles.emptySubtitle}>Tidak ada pendaftaran yang perlu disetujui saat ini.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.slate[500],
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  cardEdit: {
    borderLeftWidth: 6,
    borderLeftColor: '#f59e0b',
  },
  cardDelete: {
    borderLeftWidth: 6,
    borderLeftColor: '#ef4444',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeRegister: { backgroundColor: '#ecfdf5' },
  badgeEdit: { backgroundColor: '#fef3c7' },
  badgeDelete: { backgroundColor: '#fef2f2' },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.slate[400],
    fontWeight: '600',
  },
  mainInfo: {
    marginBottom: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate[900],
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.slate[500],
    fontWeight: '600',
    marginTop: 2,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  expandText: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '700',
  },
  detailsArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.slate[400],
    fontWeight: '600',
    width: 60,
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.slate[700],
    fontWeight: '700',
    flex: 1,
  },
  changesContainer: {
    gap: 8,
  },
  changesHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate[400],
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  changeKey: {
    fontSize: 12,
    color: COLORS.slate[500],
    fontWeight: '600',
    width: 100,
  },
  changeVal: {
    fontSize: 12,
    color: COLORS.slate[800],
    fontWeight: '800',
    flex: 1,
  },
  deleteWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff1f2',
    padding: 12,
    borderRadius: 12,
  },
  deleteWarningText: {
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  btnReject: {
    backgroundColor: '#ffffff',
    borderColor: '#fee2e2',
  },
  btnApprove: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  btnTextReject: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626',
  },
  btnTextApprove: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.slate[800],
    marginTop: 20,
    letterSpacing: -1,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.slate[400],
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
    fontWeight: '500',
  }
});
