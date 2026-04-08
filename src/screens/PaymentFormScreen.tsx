import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Platform,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Calendar, 
  FileText, 
  Search,
  ChevronRight,
  Banknote,
  Navigation,
  Printer,
  Settings,
  CheckCircle2,
  ChevronDown
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import PrinterSettingsModal from '../components/PrinterSettingsModal';
import { printReceipt } from '../utils/printer';
import { COLORS } from '../constants/theme';
import GradientHeader from '../components/GradientHeader';
import { resolveUrl } from '../utils/url';

export default function PaymentFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useLanguage();
  const { 
    customer: initialCustomer, 
    amount: initialAmount, 
    month: initialMonth, 
    year: initialYear,
    username: initialUsername
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Selection State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(initialCustomer || null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Form State
  const [amount, setAmount] = useState(
    initialAmount ? String(initialAmount) : 
    (initialCustomer?.billing?.amount ? String(initialCustomer.billing.amount) : '')
  );
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth !== undefined ? initialMonth : 
    (initialCustomer?.billing?.month !== undefined ? initialCustomer.billing.month : new Date().getMonth())
  );
  const [selectedYear, setSelectedYear] = useState(
    initialYear || 
    (initialCustomer?.billing?.year || new Date().getFullYear())
  );

  // Printer State
  const [printerModalVisible, setPrinterModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);

  const years = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1,
    new Date().getFullYear() + 2
  ];

  // Resolve customer if only username is provided
  useEffect(() => {
    if (!selectedCustomer && initialUsername) {
       resolveCustomer(initialUsername);
    }
  }, [initialUsername]);

  const resolveCustomer = async (username: string) => {
    try {
      setSearching(true);
      const response = await apiClient.get(`/api/customers?lite=true`);
      const all = Object.values(response.data);
      const found = all.find((c: any) => c.username === username);
      if (found) {
        setSelectedCustomer(found);
      }
    } catch (e) {
      console.error('Failed to resolve customer', e);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer && !initialAmount) {
      fetchCustomerBilling(selectedCustomer.username);
    }
  }, [selectedCustomer]);

  const fetchCustomerBilling = async (username: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/customer/stats?customerId=${username}`);
      if (response.data?.billing?.amount !== undefined) {
        setAmount(String(response.data.billing.amount));
      } else {
        setAmount('0');
      }
      
      // Also reset period to current unless explicitly passed from initial params
      if (!initialMonth && initialMonth !== 0) {
        setSelectedMonth(new Date().getMonth());
      }
      if (!initialYear) {
        setSelectedYear(new Date().getFullYear());
      }
    } catch (e) {
      console.error('Failed to fetch billing stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchText.length > 2) {
      searchCustomers();
    } else {
      setSearchResults([]);
    }
  }, [searchText]);

  const searchCustomers = async () => {
    setSearching(true);
    try {
      const response = await apiClient.get(`/api/customers?lite=true`);
      const all = Object.values(response.data);
      const filtered = all.filter((c: any) => 
        c.name?.toLowerCase().includes(searchText.toLowerCase()) || 
        c.username?.toLowerCase().includes(searchText.toLowerCase()) ||
        c.phone?.includes(searchText)
      );
      setSearchResults(filtered.slice(0, 10));
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      Alert.alert(t('common.error'), t('billing.customerRequired'));
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      Alert.alert(t('common.error'), t('billing.invalidAmount'));
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/api/billing/payments', {
        username: selectedCustomer.username,
        amount: Number(amount),
        method,
        notes,
        month: selectedMonth,
        year: selectedYear
      });
      
      setLastPayment(response.data.payment);
      setShowSuccess(true);
      
      // If cash, automatically suggest printing?
      // For now, let the user trigger it.
    } catch (e: any) {
      Alert.alert(t('common.error'), e.response?.data?.error || t('billing.savePaymentError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!lastPayment || !selectedCustomer) return;
    
    try {
      await printReceipt({
        invoiceNumber: lastPayment.invoiceNumber,
        customerName: selectedCustomer.name,
        username: selectedCustomer.username,
        customerId: selectedCustomer.customerId || selectedCustomer.username,
        status: 'PAID',
        date: new Date(lastPayment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        amount: lastPayment.amount,
        paymentMethod: lastPayment.method === 'cash' ? t('billing.cash') : t('billing.transfer'),
        agentFullName: user?.fullName || user?.name || user?.username,
        agentPhone: user?.phone,
        period: `${months[selectedMonth]} ${selectedYear}`
      });
      Alert.alert(t('common.success'), t('billing.printingReceipt'));
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      if (errorMsg.includes('belum disetting')) {
        setPrinterModalVisible(true);
      } else {
        Alert.alert(t('billing.printingFailed'), errorMsg || t('billing.printReceiptError'));
      }
    }
  };

  const months = [
    t('billing.january') || 'Januari', t('billing.february') || 'Februari', t('billing.march') || 'Maret', 
    t('billing.april') || 'April', t('billing.may') || 'Mei', t('billing.june') || 'Juni',
    t('billing.july') || 'Juli', t('billing.august') || 'Agustus', t('billing.september') || 'September', 
    t('billing.october') || 'Oktober', t('billing.november') || 'November', t('billing.december') || 'Desember'
  ];

  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <GradientHeader 
        title={t('billing.recordPayment')}
        subtitle={selectedCustomer ? `${t('billing.selected')}: ${selectedCustomer.name}` : t('billing.selectCustomer')}
        role={user?.role?.toUpperCase()}
        userAvatar={resolveUrl(user?.avatar)}
        onBackPress={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={() => setPrinterModalVisible(true)} style={styles.headerBtn}>
            <Settings size={22} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Customer Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('billing.selectCustomer')}</Text>
            {selectedCustomer ? (
              <View style={styles.selectedCustomerCard}>
                 <View style={styles.customerIcon}>
                   <User size={24} color={COLORS.primary} />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                    <Text style={styles.customerUser}>@{selectedCustomer.username}</Text>
                 </View>
                 <TouchableOpacity onPress={() => setSelectedCustomer(null)} style={styles.changeBtn}>
                    <Text style={styles.changeText}>{t('billing.changeCustomer')}</Text>
                 </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                  <Search size={20} color={COLORS.slate[500]} style={{ marginLeft: 15 }} />
                  <TextInput 
                    style={styles.searchInput}
                    placeholder={t('billing.searchCustomerPlaceholder')}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor={COLORS.slate[400]}
                  />
                  {searching && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 15 }} />}
                </View>
                {searchResults.length > 0 && (
                  <View style={styles.resultsList}>
                    {searchResults.map((item: any) => (
                      <TouchableOpacity 
                        key={item.username} 
                        style={styles.resultItem}
                        onPress={() => {
                          setSelectedCustomer(item);
                          setSearchText('');
                          setSearchResults([]);
                        }}
                      >
                        <View>
                           <Text style={styles.resultName}>{item.name}</Text>
                           <Text style={styles.resultUser}>{item.username}</Text>
                        </View>
                        <ChevronRight size={18} color={COLORS.slate[400]} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Payment Details */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>{t('billing.paymentDetails')}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('billing.paymentAmount')}</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.iconBox}>
                  <Banknote size={20} color={COLORS.slate[500]} />
                </View>
                <TextInput 
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Contoh: 150000"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.slate[400]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('billing.paymentMethod')}</Text>
              <View style={styles.methodToggle}>
                <TouchableOpacity 
                  style={[styles.methodBtn, method === 'cash' && styles.methodBtnActive]}
                  onPress={() => setMethod('cash')}
                >
                   <Text style={[styles.methodText, method === 'cash' && styles.methodTextActive]}>{t('billing.cash')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.methodBtn, method === 'transfer' && styles.methodBtnActive]}
                  onPress={() => setMethod('transfer')}
                >
                   <Text style={[styles.methodText, method === 'transfer' && styles.methodTextActive]}>{t('billing.transfer')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('billing.billingPeriod')}</Text>
              <View style={styles.periodRow}>
                 <TouchableOpacity 
                    style={[styles.inputWrapper, { flex: 1.5, marginRight: 10 }]}
                    onPress={() => setMonthModalVisible(true)}
                 >
                    <View style={styles.iconBox}>
                      <Calendar size={20} color={COLORS.slate[500]} />
                    </View>
                    <Text style={styles.dropdownValue}>{months[selectedMonth]}</Text>
                    <ChevronDown size={18} color={COLORS.slate[400]} style={{ marginRight: 16 }} />
                 </TouchableOpacity>
                 <TouchableOpacity 
                    style={[styles.inputWrapper, { flex: 0.8 }]}
                    onPress={() => setYearModalVisible(true)}
                 >
                    <Text style={[styles.dropdownValue, { textAlign: 'center', marginLeft: 16 }]}>{selectedYear}</Text>
                    <ChevronDown size={18} color={COLORS.slate[400]} style={{ marginRight: 16 }} />
                 </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('billing.notesOptional')}</Text>
              <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                <View style={[styles.iconBox, { height: 40 }]}>
                  <FileText size={20} color={COLORS.slate[500]} />
                </View>
                <TextInput 
                  style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Contoh: Titipan tetangga"
                  multiline
                  placeholderTextColor={COLORS.slate[400]}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>{t('billing.confirmPayment')}</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Success Overlay */}
        {showSuccess && (
          <View style={styles.successOverlay}>
             <View style={styles.successCard}>
                <CheckCircle2 size={70} color={COLORS.success} />
                <Text style={styles.successTitle}>{t('billing.paymentSuccess')}</Text>
                <Text style={styles.successSub}>{t('billing.dataSavedServer')}</Text>
                
                <View style={styles.invoicePreview}>
                   <Text style={styles.previewLabel}>{t('billing.invoice')}</Text>
                   <Text style={styles.previewValue}>{lastPayment?.invoiceNumber}</Text>
                   <View style={styles.previewDivider} />
                   <Text style={styles.previewLabel}>{t('billing.totalPay')}</Text>
                   <Text style={styles.previewAmount}>Rp {lastPayment?.amount?.toLocaleString()}</Text>
                </View>

                <View style={styles.successActions}>
                   <TouchableOpacity style={styles.printBtnAction} onPress={handlePrint}>
                      <Printer size={20} color={COLORS.white} />
                      <Text style={styles.printBtnText}>{t('billing.printReceipt')}</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={styles.doneBtn} 
                     onPress={() => {
                        setShowSuccess(false);
                        navigation.goBack();
                     }}
                   >
                      <Text style={styles.doneBtnText}>{t('billing.done')}</Text>
                   </TouchableOpacity>
                </View>
             </View>
          </View>
        )}

        <PrinterSettingsModal 
          visible={printerModalVisible} 
          onClose={() => setPrinterModalVisible(false)} 
        />

        {/* Month Selection Modal */}
        <Modal
          visible={monthModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMonthModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMonthModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.selectionModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('billing.selectMonth') || 'Pilih Bulan'}</Text>
                </View>
                <ScrollView contentContainerStyle={styles.selectionList}>
                  {months.map((m, idx) => (
                    <TouchableOpacity 
                      key={m} 
                      style={[styles.selectionItem, selectedMonth === idx && styles.selectionItemActive]}
                      onPress={() => {
                        setSelectedMonth(idx);
                        setMonthModalVisible(false);
                      }}
                    >
                      <Text style={[styles.selectionText, selectedMonth === idx && styles.selectionTextActive]}>{m}</Text>
                      {selectedMonth === idx && <CheckCircle2 size={18} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Year Selection Modal */}
        <Modal
          visible={yearModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setYearModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setYearModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View style={styles.selectionModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('billing.selectYear') || 'Pilih Tahun'}</Text>
                </View>
                <View style={styles.selectionList}>
                  {years.map((y) => (
                    <TouchableOpacity 
                      key={y} 
                      style={[styles.selectionItem, selectedYear === y && styles.selectionItemActive]}
                      onPress={() => {
                        setSelectedYear(y);
                        setYearModalVisible(false);
                      }}
                    >
                      <Text style={[styles.selectionText, selectedYear === y && styles.selectionTextActive]}>{y}</Text>
                      {selectedYear === y && <CheckCircle2 size={18} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.slate[900],
  },
  headerBtn: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate[900],
    marginBottom: 16,
  },
  selectedCustomerCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  customerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  customerUser: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '500',
  },
  changeBtn: {
    padding: 8,
  },
  changeText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  searchContainer: {
    zIndex: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    height: 56,
    shadowColor: COLORS.slate[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.slate[900],
  },
  resultsList: {
    backgroundColor: COLORS.white,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    overflow: 'hidden',
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: COLORS.slate[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate[900],
  },
  resultUser: {
    fontSize: 13,
    color: COLORS.slate[500],
    marginTop: 2,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    shadowColor: COLORS.slate[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate[600],
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    borderRadius: 16,
    height: 56,
  },
  iconBox: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.slate[200],
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.slate[900],
    fontWeight: '500',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate[100],
    padding: 6,
    borderRadius: 16,
  },
  methodBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  methodBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.slate[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodText: {
    fontSize: 14,
    color: COLORS.slate[500],
    fontWeight: '600',
  },
  methodTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
  },
  chipScroll: {
    flex: 1,
    paddingHorizontal: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.slate[500],
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 30,
  },
  successCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.slate[900],
    marginTop: 24,
  },
  successSub: {
    fontSize: 15,
    color: COLORS.slate[500],
    marginTop: 8,
    marginBottom: 32,
  },
  invoicePreview: {
    backgroundColor: COLORS.surface,
    width: '100%',
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  previewLabel: {
    fontSize: 13,
    color: COLORS.slate[500],
    marginBottom: 4,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate[900],
    marginBottom: 16,
  },
  previewDivider: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.slate[200],
    marginBottom: 16,
  },
  previewAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success,
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  printBtnAction: {
    backgroundColor: COLORS.success,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  printBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    color: COLORS.slate[600],
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownValue: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.slate[900],
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  selectionModal: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    maxHeight: '70%',
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[100],
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.slate[900],
  },
  selectionList: {
    padding: 12,
  },
  selectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  selectionItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.slate[700],
  },
  selectionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
