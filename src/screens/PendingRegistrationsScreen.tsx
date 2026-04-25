import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
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
  Info,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAlert } from '../context/AlertContext';
import { COLORS } from '../constants/theme';
import GradientHeader from '../components/GradientHeader';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Registration {
  id: string;
  type: 'register' | 'edit' | 'delete';
  username: string;        // PRIMARY KEY untuk backend (unique row key)
  targetUsername?: string; // username pelanggan yang dituju (untuk edit/delete)
  name?: string;
  address?: string;
  phone?: string;
  profile?: string;
  password?: string;
  service?: string;
  newValues?: string;      // JSON string
  agentId?: string;
  technicianId?: string;
  routerIds?: string;      // JSON string
  coordinates?: string;
  comment?: string;
  createdAt: string;
}

interface SystemUser {
  id: string;
  username: string;
  fullName?: string;
  isAgent: boolean;
  isTechnician: boolean;
}

interface PppoeProfile {
  name: string;
  '.id'?: string;
}

interface ReviewFormData {
  username?: string;
  password?: string;
  profile?: string;
  service?: string;
  name?: string;
  address?: string;
  phone?: string;
  agentId?: string;
  technicianId?: string;
  coordinates?: string;
  comment?: string;
  routerIds?: string[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PendingRegistrationsScreen() {
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();

  // List state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Supporting data
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [profiles, setProfiles] = useState<PppoeProfile[]>([]);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({});
  const [submitting, setSubmitting] = useState(false);

  // Profile picker state (inside modal)
  const [showProfilePicker, setShowProfilePicker] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchRegistrations = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/registrations');
      setRegistrations(response.data);
    } catch (e) {
      console.error('Failed to fetch registrations', e);
      showAlert({ title: 'Error', message: 'Gagal mengambil daftar pendaftaran', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSystemUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/admin/users');
      setSystemUsers(res.data || []);
    } catch (e) {
      console.error('Failed to fetch system users', e);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/pppoe/profiles');
      const data: PppoeProfile[] = (res.data || []).filter(
        (p: PppoeProfile) => p.name !== 'default' && p.name !== 'billing.default'
      );
      setProfiles(data);
    } catch (e) {
      console.error('Failed to fetch profiles', e);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
    fetchSystemUsers();
    fetchProfiles();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRegistrations(), fetchSystemUsers(), fetchProfiles()]);
    setRefreshing(false);
  };

  // ─── Review Modal Logic ───────────────────────────────────────────────────

  /**
   * Sama persis dengan handleReview() di web.
   * Isi form dari data registrasi, lalu buka modal.
   */
  const handleReview = (reg: Registration) => {
    setSelectedReg(reg);

    if (reg.type === 'edit') {
      // Parse newValues JSON
      let values: ReviewFormData = {};
      try {
        values = typeof reg.newValues === 'string' ? JSON.parse(reg.newValues) : (reg.newValues || {});
      } catch { /* ignore */ }

      setReviewForm({
        username:     values.username     || '',
        password:     values.password     || '',
        profile:      values.profile      || '',
        service:      values.service      || 'pppoe',
        name:         values.name         || '',
        address:      values.address      || '',
        phone:        values.phone        || '',
        agentId:      values.agentId      || '',
        technicianId: values.technicianId || '',
        coordinates:  values.coordinates  || '',
        comment:      values.comment      || '',
      });
    } else if (reg.type === 'delete') {
      // No form — just show warning
      setReviewForm({});
    } else {
      // register
      let routerIds: string[] = [];
      try {
        routerIds = reg.routerIds
          ? (typeof reg.routerIds === 'string' ? JSON.parse(reg.routerIds) : reg.routerIds)
          : [];
      } catch { /* ignore */ }

      setReviewForm({
        username:     reg.username     || '',
        password:     reg.password     || '',
        profile:      reg.profile      || '',
        service:      reg.service      || 'pppoe',
        name:         reg.name         || '',
        address:      reg.address      || '',
        phone:        reg.phone        || '',
        agentId:      reg.agentId      || '',
        technicianId: reg.technicianId || '',
        coordinates:  reg.coordinates  || '',
        comment:      reg.comment      || '',
        routerIds,
      });
    }

    setShowReviewModal(true);
  };

  /**
   * Sama persis dengan handleRegistrationAction() di web.
   * Selalu gunakan reg.username (bukan targetUsername) sebagai key untuk backend.
   */
  const handleRegistrationAction = async (action: 'approve' | 'reject') => {
    if (!selectedReg) return;

    const actionLabel = action === 'approve' ? 'menyetujui' : 'menolak';
    const targetName = selectedReg.type === 'register'
      ? selectedReg.name
      : selectedReg.targetUsername;

    showAlert({
      title: 'Konfirmasi',
      message: `Apakah Anda yakin ingin ${actionLabel} permintaan untuk ${targetName}?`,
      type: action === 'approve' ? 'info' : 'warning',
      confirmText: action === 'approve' ? 'Setujui' : 'Tolak',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const body: any = {
            username: selectedReg.username,
            action,
          };

          if (action === 'approve') {
            body.updatedData = reviewForm;
          }

          const res = await apiClient.post('/api/registrations', body);

          if (res.data.success) {
            showAlert({ 
              title: 'Berhasil', 
              message: res.data.message || 'Tindakan berhasil', 
              type: 'success',
              onConfirm: () => {
                setShowReviewModal(false);
                setSelectedReg(null);
                fetchRegistrations();
              }
            });
          } else {
            showAlert({ title: 'Gagal', message: res.data.error || 'Gagal melakukan tindakan', type: 'error' });
          }
        } catch (err: any) {
          showAlert({ title: 'Error', message: err.response?.data?.error || 'Terjadi kesalahan sistem', type: 'error' });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const getAgentName = (agentId?: string) => {
    if (!agentId) return '-';
    const found = systemUsers.find(u => u.id === agentId);
    return found ? (found.fullName || found.username) : agentId;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  // ─── Review Modal Render ─────────────────────────────────────────────────

  const renderReviewModal = () => {
    if (!selectedReg) return null;
    const isDelete = selectedReg.type === 'delete';
    const isEdit   = selectedReg.type === 'edit';

    return (
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isDelete ? '⚠️ Review Penghapusan' :
                 isEdit   ? '✏️ Review Perubahan Data' :
                            '📋 Review Pendaftaran'}
              </Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <XCircle size={24} color={COLORS.slate[400]} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

              {/* ── DELETE: hanya warning ── */}
              {isDelete ? (
                <View style={styles.deleteWarningBox}>
                  <AlertTriangle size={32} color="#dc2626" />
                  <Text style={styles.deleteWarningTitle}>Konfirmasi Penghapusan</Text>
                  <Text style={styles.deleteWarningBody}>
                    Pelanggan <Text style={{ fontWeight: '800' }}>{selectedReg.targetUsername}</Text> akan dihapus PERMANEN dari Mikrotik dan database. Tindakan ini tidak dapat dibatalkan.
                  </Text>
                </View>
              ) : (
                <>
                  {/* ── PPPoE Account ── */}
                  <View style={styles.formSection}>
                    <View style={styles.formSectionHeader}>
                      <Shield size={16} color={COLORS.primary} />
                      <Text style={styles.formSectionTitle}>Akun PPPoE</Text>
                    </View>

                    <View style={styles.fieldRow}>
                      <View style={styles.fieldHalf}>
                        <Text style={styles.fieldLabel}>Username</Text>
                        <TextInput
                          style={styles.input}
                          value={reviewForm.username}
                          onChangeText={v => setReviewForm(f => ({ ...f, username: v }))}
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.fieldHalf}>
                        <Text style={styles.fieldLabel}>Password</Text>
                        <TextInput
                          style={styles.input}
                          value={reviewForm.password}
                          onChangeText={v => setReviewForm(f => ({ ...f, password: v }))}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <View style={styles.fieldRow}>
                      <View style={styles.fieldHalf}>
                        <Text style={styles.fieldLabel}>Profile / Paket</Text>
                        <TouchableOpacity
                          style={styles.pickerButton}
                          onPress={() => setShowProfilePicker(!showProfilePicker)}
                        >
                          <Text style={[styles.pickerButtonText, !reviewForm.profile && { color: COLORS.slate[400] }]}>
                            {reviewForm.profile || 'Pilih profile...'}
                          </Text>
                          <ChevronDown size={16} color={COLORS.slate[400]} />
                        </TouchableOpacity>
                        {showProfilePicker && (
                          <View style={styles.pickerDropdown}>
                            {profiles.map(p => (
                              <TouchableOpacity
                                key={p.name}
                                style={[styles.pickerItem, reviewForm.profile === p.name && styles.pickerItemActive]}
                                onPress={() => {
                                  setReviewForm(f => ({ ...f, profile: p.name }));
                                  setShowProfilePicker(false);
                                }}
                              >
                                <Text style={[styles.pickerItemText, reviewForm.profile === p.name && { color: COLORS.primary }]}>
                                  {p.name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                      <View style={styles.fieldHalf}>
                        <Text style={styles.fieldLabel}>Service</Text>
                        <View style={styles.serviceRow}>
                          {['pppoe', 'any', 'hotspot', 'l2tp'].map(s => (
                            <TouchableOpacity
                              key={s}
                              style={[styles.serviceChip, reviewForm.service === s && styles.serviceChipActive]}
                              onPress={() => setReviewForm(f => ({ ...f, service: s }))}
                            >
                              <Text style={[styles.serviceChipText, reviewForm.service === s && styles.serviceChipTextActive]}>
                                {s}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* ── Customer Info ── */}
                  <View style={styles.formSection}>
                    <View style={styles.formSectionHeader}>
                      <User size={16} color={COLORS.primary} />
                      <Text style={styles.formSectionTitle}>Informasi Pelanggan</Text>
                    </View>

                    <View style={styles.fieldRow}>
                      <View style={styles.fieldHalf}>
                        <Text style={styles.fieldLabel}>Nama Lengkap</Text>
                        <TextInput
                          style={styles.input}
                          value={reviewForm.name}
                          onChangeText={v => setReviewForm(f => ({ ...f, name: v }))}
                        />
                      </View>
                      <View style={styles.fieldHalf}>
                        <Text style={styles.fieldLabel}>No. HP</Text>
                        <TextInput
                          style={styles.input}
                          value={reviewForm.phone}
                          onChangeText={v => setReviewForm(f => ({ ...f, phone: v }))}
                          keyboardType="phone-pad"
                        />
                      </View>
                    </View>

                    <Text style={styles.fieldLabel}>Alamat</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      value={reviewForm.address}
                      onChangeText={v => setReviewForm(f => ({ ...f, address: v }))}
                      multiline
                      numberOfLines={2}
                    />

                    <Text style={styles.fieldLabel}>Koordinat</Text>
                    <TextInput
                      style={styles.input}
                      value={reviewForm.coordinates}
                      onChangeText={v => setReviewForm(f => ({ ...f, coordinates: v }))}
                      placeholder="-6.1234, 106.1234"
                      placeholderTextColor={COLORS.slate[400]}
                    />

                    <Text style={styles.fieldLabel}>Komentar</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      value={reviewForm.comment}
                      onChangeText={v => setReviewForm(f => ({ ...f, comment: v }))}
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  {/* ── Registration Info ── */}
                  <View style={styles.formSection}>
                    <View style={styles.formSectionHeader}>
                      <Layers size={16} color={COLORS.primary} />
                      <Text style={styles.formSectionTitle}>Info Pendaftaran</Text>
                    </View>

                    <Text style={styles.fieldLabel}>Agen</Text>
                    <View style={styles.dropdownWrapper}>
                      {systemUsers.filter(u => u.isAgent).map(u => (
                        <TouchableOpacity
                          key={u.id}
                          style={[styles.assignRow, reviewForm.agentId === u.id && styles.assignRowActive]}
                          onPress={() => setReviewForm(f => ({ ...f, agentId: f.agentId === u.id ? '' : u.id }))}
                        >
                          <View style={[styles.assignRadio, reviewForm.agentId === u.id && styles.assignRadioActive]} />
                          <Text style={styles.assignLabel}>{u.fullName || u.username}</Text>
                        </TouchableOpacity>
                      ))}
                      {systemUsers.filter(u => u.isAgent).length === 0 && (
                        <Text style={styles.emptyAgents}>Tidak ada agen tersedia</Text>
                      )}
                    </View>

                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Teknisi</Text>
                    <View style={styles.dropdownWrapper}>
                      {systemUsers.filter(u => u.isTechnician).map(u => (
                        <TouchableOpacity
                          key={u.id}
                          style={[styles.assignRow, reviewForm.technicianId === u.id && styles.assignRowActive]}
                          onPress={() => setReviewForm(f => ({ ...f, technicianId: f.technicianId === u.id ? '' : u.id }))}
                        >
                          <View style={[styles.assignRadio, reviewForm.technicianId === u.id && styles.assignRadioActive]} />
                          <Text style={styles.assignLabel}>{u.fullName || u.username}</Text>
                        </TouchableOpacity>
                      ))}
                      {systemUsers.filter(u => u.isTechnician).length === 0 && (
                        <Text style={styles.emptyAgents}>Tidak ada teknisi tersedia</Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowReviewModal(false)}
                disabled={submitting}
              >
                <Text style={styles.btnCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnReject, submitting && { opacity: 0.5 }]}
                onPress={() => handleRegistrationAction('reject')}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator size="small" color="#dc2626" /> : <XCircle size={18} color="#dc2626" />}
                <Text style={styles.btnRejectText}>Tolak</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[isDelete ? styles.btnApproveRed : styles.btnApprove, submitting && { opacity: 0.5 }]}
                onPress={() => handleRegistrationAction('approve')}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <CheckCircle size={18} color="#fff" />}
                <Text style={styles.btnApproveText}>
                  {isDelete ? 'Hapus Sekarang' : 'Setujui'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // ─── List Item Render ─────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Registration }) => {
    const isExpanded = expandedId === item.id;
    const isEdit     = item.type === 'edit';
    const isDelete   = item.type === 'delete';

    const displayName = item.type === 'register' ? item.name : item.targetUsername;
    const displayUser = item.type === 'register' ? item.username : item.targetUsername;

    let parsedNewValues: Record<string, any> = {};
    if (isEdit && item.newValues) {
      try { parsedNewValues = JSON.parse(item.newValues); } catch { /* ignore */ }
    }

    return (
      <View style={[styles.card, isEdit && styles.cardEdit, isDelete && styles.cardDelete]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[
            styles.typeBadge,
            isEdit ? styles.badgeEdit : isDelete ? styles.badgeDelete : styles.badgeRegister,
          ]}>
            {item.type === 'register' ? <UserPlus size={13} color="#059669" /> :
             isEdit ? <Edit size={13} color="#d97706" /> :
             <Trash2 size={13} color="#dc2626" />}
            <Text style={[
              styles.typeText,
              isEdit ? { color: '#d97706' } : isDelete ? { color: '#dc2626' } : { color: '#059669' }
            ]}>
              {item.type === 'register' ? 'PENDAFTARAN' : isEdit ? 'PERUBAHAN DATA' : 'PENGHAPUSAN'}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <Text style={styles.titleText}>{displayName || displayUser}</Text>
          {displayName && displayUser && displayName !== displayUser && (
            <Text style={styles.subtitleText}>@{displayUser}</Text>
          )}
          {item.agentId && (
            <Text style={styles.agentText}>Oleh: {getAgentName(item.agentId)}</Text>
          )}
        </View>

        {/* Expand Toggle */}
        <TouchableOpacity
          style={styles.expandToggle}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
        >
          <Text style={styles.expandText}>{isExpanded ? 'Tutup Detail' : 'Lihat Detail'}</Text>
          {isExpanded ? <ChevronUp size={16} color={COLORS.slate[400]} /> : <ChevronDown size={16} color={COLORS.slate[400]} />}
        </TouchableOpacity>

        {/* Expanded Detail */}
        {isExpanded && (
          <View style={styles.detailsArea}>
            {item.type === 'register' && (
              <>
                {item.profile && <View style={styles.detailRow}><Layers size={13} color={COLORS.slate[400]} /><Text style={styles.detailLabel}>Profile:</Text><Text style={styles.detailValue}>{item.profile}</Text></View>}
                {item.address && <View style={styles.detailRow}><MapPin size={13} color={COLORS.slate[400]} /><Text style={styles.detailLabel}>Alamat:</Text><Text style={styles.detailValue}>{item.address}</Text></View>}
                {item.phone && <View style={styles.detailRow}><Phone size={13} color={COLORS.slate[400]} /><Text style={styles.detailLabel}>No. HP:</Text><Text style={styles.detailValue}>{item.phone}</Text></View>}
              </>
            )}
            {isEdit && Object.keys(parsedNewValues).length > 0 && (
              <View style={styles.changesContainer}>
                <Text style={styles.changesHeader}>Perubahan Data:</Text>
                {Object.entries(parsedNewValues).map(([key, val]) => {
                  if (!val) return null;
                  const labelMap: Record<string, string> = {
                    username: 'Username PPPoE', name: 'Nama Pelanggan', profile: 'Paket/Profile',
                    password: 'Password', address: 'Alamat', phone: 'No. HP', service: 'Service',
                  };
                  return (
                    <View key={key} style={styles.changeItem}>
                      <View style={styles.changeDot} />
                      <Text style={styles.changeKey}>{labelMap[key] || key}:</Text>
                      <Text style={styles.changeVal}>{String(val)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            {isDelete && (
              <View style={styles.deleteWarnInline}>
                <Info size={14} color="#dc2626" />
                <Text style={styles.deleteWarnText}>User ini akan dihapus permanen dari Mikrotik dan Database.</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.btn, styles.btnCardReject]}
            onPress={() => {
              // Quick reject langsung tanpa modal (sama dengan web: Tolak dari list)
              showAlert({
                title: 'Tolak Permintaan',
                message: `Tolak permintaan untuk ${displayName || displayUser}?`,
                type: 'warning',
                confirmText: 'Tolak',
                onConfirm: async () => {
                  try {
                    const res = await apiClient.post('/api/registrations', {
                      username: item.username,
                      action: 'reject',
                    });
                    if (res.data.success) {
                      showAlert({ title: 'Berhasil', message: res.data.message || 'Permintaan ditolak', type: 'success' });
                      fetchRegistrations();
                    } else {
                      showAlert({ title: 'Gagal', message: res.data.error || 'Gagal menolak', type: 'error' });
                    }
                  } catch (err: any) {
                    showAlert({ title: 'Error', message: err.response?.data?.error || 'Terjadi kesalahan', type: 'error' });
                  }
                }
              });
            }}
          >
            <XCircle size={16} color="#dc2626" />
            <Text style={styles.btnTextReject}>Tolak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnCardReview]}
            onPress={() => handleReview(item)}
          >
            <Edit size={16} color="#ffffff" />
            <Text style={styles.btnTextReview}>Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader
        title="Persetujuan User"
        subtitle="Kelola Pendaftaran, Edit & Penghapusan"
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat permintaan...</Text>
        </View>
      ) : (
        <FlatList
          data={registrations}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={64} color={COLORS.slate[200]} />
              <Text style={styles.emptyTitle}>Semua Beres!</Text>
              <Text style={styles.emptySubtitle}>Tidak ada permintaan yang perlu disetujui saat ini.</Text>
            </View>
          }
        />
      )}

      {renderReviewModal()}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.slate[500], fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardEdit:   { borderLeftWidth: 5, borderLeftColor: '#f59e0b' },
  cardDelete: { borderLeftWidth: 5, borderLeftColor: '#ef4444' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  typeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeRegister: { backgroundColor: '#ecfdf5' },
  badgeEdit:     { backgroundColor: '#fef3c7' },
  badgeDelete:   { backgroundColor: '#fef2f2' },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  dateText: { fontSize: 11, color: COLORS.slate[400], fontWeight: '600' },

  mainInfo:    { marginBottom: 10 },
  titleText:   { fontSize: 17, fontWeight: '800', color: COLORS.slate[900], letterSpacing: -0.3 },
  subtitleText:{ fontSize: 13, color: COLORS.slate[500], fontWeight: '600', marginTop: 1 },
  agentText:   { fontSize: 11, color: COLORS.slate[400], marginTop: 3, fontWeight: '500' },

  expandToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  expandText:   { fontSize: 12, color: COLORS.slate[400], fontWeight: '700' },

  detailsArea:  { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 14 },
  detailRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 7, gap: 7 },
  detailLabel:  { fontSize: 11, color: COLORS.slate[400], fontWeight: '600', width: 62 },
  detailValue:  { fontSize: 11, color: COLORS.slate[700], fontWeight: '700', flex: 1 },

  changesContainer: { gap: 7 },
  changesHeader:    { fontSize: 10, fontWeight: '800', color: COLORS.slate[400], textTransform: 'uppercase', marginBottom: 3 },
  changeItem:       { flexDirection: 'row', alignItems: 'center', gap: 7 },
  changeDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f59e0b' },
  changeKey:        { fontSize: 11, color: COLORS.slate[500], fontWeight: '600', width: 110 },
  changeVal:        { fontSize: 11, color: COLORS.slate[800], fontWeight: '800', flex: 1 },

  deleteWarnInline: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff1f2', padding: 10, borderRadius: 10 },
  deleteWarnText:   { fontSize: 11, color: '#991b1b', fontWeight: '600', flex: 1 },

  cardFooter: { flexDirection: 'row', gap: 10, marginTop: 2 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: 14, borderWidth: 1,
  },
  btnCardReject: { backgroundColor: '#ffffff', borderColor: '#fee2e2' },
  btnCardReview: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  btnTextReject: { fontSize: 13, fontWeight: '800', color: '#dc2626' },
  btnTextReview: { fontSize: 13, fontWeight: '800', color: '#ffffff' },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle:     { fontSize: 22, fontWeight: '900', color: COLORS.slate[800], marginTop: 20, letterSpacing: -0.8 },
  emptySubtitle:  { fontSize: 13, color: COLORS.slate[400], textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 20, fontWeight: '500' },

  // ── Review Modal ──────────────────────────────────────────────────────────

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900] },

  formSection: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#f8fafc', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  formSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  formSectionTitle:  { fontSize: 13, fontWeight: '800', color: COLORS.slate[600], textTransform: 'uppercase', letterSpacing: 0.5 },

  fieldRow:  { flexDirection: 'row', gap: 10, marginBottom: 10 },
  fieldHalf: { flex: 1 },
  fieldLabel:{ fontSize: 11, fontWeight: '600', color: COLORS.slate[500], marginBottom: 4, textTransform: 'uppercase' },

  input: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 14, color: COLORS.slate[900], fontWeight: '600',
  },
  inputMultiline: { height: 60, textAlignVertical: 'top', paddingTop: 8 },

  pickerButton: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.slate[900], flex: 1 },
  pickerDropdown: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, marginTop: 2, maxHeight: 180,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  pickerItem:       { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerItemActive: { backgroundColor: '#eff6ff' },
  pickerItemText:   { fontSize: 13, fontWeight: '600', color: COLORS.slate[800] },

  serviceRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  serviceChip:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  serviceChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  serviceChipText:       { fontSize: 11, fontWeight: '700', color: COLORS.slate[600] },
  serviceChipTextActive: { color: '#ffffff' },

  dropdownWrapper: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  assignRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  assignRowActive: { backgroundColor: '#eff6ff' },
  assignRadio:       { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1' },
  assignRadioActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  assignLabel:     { fontSize: 13, fontWeight: '600', color: COLORS.slate[800] },
  emptyAgents:     { fontSize: 12, color: COLORS.slate[400], padding: 12, textAlign: 'center' },

  deleteWarningBox: {
    margin: 16, backgroundColor: '#fff1f2', borderRadius: 18,
    padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#fecaca',
  },
  deleteWarningTitle: { fontSize: 18, fontWeight: '900', color: '#dc2626', marginTop: 12, marginBottom: 10 },
  deleteWarningBody:  { fontSize: 14, color: '#7f1d1d', textAlign: 'center', lineHeight: 22, fontWeight: '500' },

  modalFooter: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  btnCancel:      { paddingHorizontal: 16, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 14 },
  btnCancelText:  { fontSize: 14, fontWeight: '700', color: COLORS.slate[500] },
  btnReject:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#fee2e2', backgroundColor: '#fff' },
  btnRejectText:  { fontSize: 14, fontWeight: '800', color: '#dc2626' },
  btnApprove:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 14, backgroundColor: '#2563eb' },
  btnApproveRed:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 14, backgroundColor: '#dc2626' },
  btnApproveText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
});
