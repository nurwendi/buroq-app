import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  TextInput,
  SafeAreaView,
  Platform,
  Modal,
  ScrollView,
  Alert,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView
} from 'react-native';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  X,
  HelpCircle,
  Shield
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from '../constants/theme';

export default function TicketScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create Ticket Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    category: 'teknis',
    description: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get('/api/tickets');
      if (Array.isArray(res.data)) {
        setTickets(res.data);
        setFilteredTickets(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID');
    } catch (e) {
      return '-';
    }
  };

  useEffect(() => {
    let result = Array.isArray(tickets) ? [...tickets] : [];
    
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(query)) ||
        (t.ticketId && t.ticketId.toLowerCase().includes(query)) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.customer?.name && t.customer.name.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    setFilteredTickets(result);
  }, [searchTerm, statusFilter, tickets]);

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      Alert.alert('Error', 'Judul dan Deskripsi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/api/tickets', newTicket);
      Alert.alert('Sukses', 'Tiket komplain berhasil dibuat.');
      setCreateModalVisible(false);
      setNewTicket({ title: '', category: 'teknis', description: '', priority: 'medium' });
      fetchTickets();
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      Alert.alert('Error', error.response?.data?.error || 'Gagal membuat tiket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#eff6ff', text: '#2563eb', label: 'Baru' };
      case 'in_progress':
        return { bg: '#fffbeb', text: '#d97706', label: 'Diproses' };
      case 'resolved':
        return { bg: '#ecfdf5', text: '#10b981', label: 'Selesai' };
      case 'closed':
        return { bg: '#f1f5f9', text: '#64748b', label: 'Tutup' };
      default:
        return { bg: '#f1f5f9', text: '#64748b', label: status };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'teknis': return 'Teknis';
      case 'tagihan': return 'Tagihan';
      default: return 'Umum';
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: COLORS.primary }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <GradientHeader 
        title="Tiket Komplain" 
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* Search & Filter Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari tiket..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Status Filters */}
        <View style={styles.filterScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'open', label: 'Baru' },
              { id: 'in_progress', label: 'Diproses' },
              { id: 'resolved', label: 'Selesai' },
              { id: 'closed', label: 'Tutup' }
            ].map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, statusFilter === f.id && styles.filterChipActive]}
                onPress={() => setStatusFilter(f.id)}
              >
                <Text style={[styles.filterChipText, statusFilter === f.id && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Ticket List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.centerContainer}>
            <HelpCircle size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Tidak ada tiket komplain ditemukan.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            keyExtractor={item => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const badge = getStatusBadge(item.status);
              return (
                <TouchableOpacity
                  style={styles.ticketCard}
                  onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketId}>{item.ticketId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.ticketTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.ticketDesc} numberOfLines={2}>{item.description}</Text>

                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketInfo}>
                      {getCategoryLabel(item.category)} • Priority: {item.priority}
                    </Text>
                    <Text style={styles.ticketDate}>
                      {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  {item.customer && user?.role !== 'customer' && (
                    <Text style={styles.customerName}>
                      Pelanggan: {item.customer.name || item.customer.username}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* FAB to create ticket (for Customer only) */}
      {user?.role === 'customer' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setCreateModalVisible(false);
            }}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buat Tiket Baru</Text>
              <TouchableOpacity onPress={() => {
                Keyboard.dismiss();
                setCreateModalVisible(false);
              }}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.categoryRow}>
                {[
                  { id: 'teknis', label: 'Teknis' },
                  { id: 'tagihan', label: 'Tagihan' },
                  { id: 'umum', label: 'Umum' }
                ].map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, newTicket.category === cat.id && styles.catChipActive]}
                    onPress={() => setNewTicket({ ...newTicket, category: cat.id })}
                  >
                    <Text style={[styles.catChipText, newTicket.category === cat.id && styles.catChipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Judul Komplain</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Contoh: WiFi Lambat / Internet Putus"
                value={newTicket.title}
                onChangeText={text => setNewTicket({ ...newTicket, title: text })}
                placeholderTextColor="#94a3b8"
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>Deskripsi Masalah</Text>
              <TextInput
                style={[styles.modalInput, styles.multilineInput]}
                placeholder="Jelaskan kendala Anda secara detail..."
                value={newTicket.description}
                onChangeText={text => setNewTicket({ ...newTicket, description: text })}
                multiline
                numberOfLines={4}
                placeholderTextColor="#94a3b8"
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateTicket}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Kirim Tiket</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    flex: 1
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1e293b'
  },
  filterScrollContainer: {
    height: 50,
    marginBottom: 8
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  filterChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  filterChipTextActive: {
    color: '#ffffff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center'
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8
      },
      android: {
        elevation: 2
      }
    })
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'mono',
    color: '#94a3b8'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4
  },
  ticketDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  ticketInfo: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600'
  },
  ticketDate: {
    fontSize: 11,
    color: '#94a3b8'
  },
  customerName: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 6
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6
      },
      android: {
        elevation: 6
      }
    })
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b'
  },
  modalBody: {
    marginBottom: 20
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginTop: 12
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  catChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  catChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff'
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b'
  },
  catChipTextActive: {
    color: COLORS.primary
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    color: '#1e293b'
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  }
});
