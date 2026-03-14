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
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList
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
  CheckCircle2
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiClient from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import PrinterSettingsModal from '../components/PrinterSettingsModal';
import { printReceipt } from '../utils/printer';

export default function PaymentFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useLanguage();
  const { customer: initialCustomer } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Selection State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(initialCustomer || null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Form State
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Printer State
  const [printerModalVisible, setPrinterModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerBilling(selectedCustomer.username);
    }
  }, [selectedCustomer]);

  const fetchCustomerBilling = async (username: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/customer/stats?customerId=${username}`);
      if (response.data?.billing?.amount) {
        setAmount(String(response.data.billing.amount));
      } else {
        setAmount('0');
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
        date: new Date(lastPayment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        amount: lastPayment.amount,
        paymentMethod: lastPayment.method === 'cash' ? t('billing.cash') : t('billing.transfer')
      });
      Alert.alert(t('common.success'), t('billing.printingReceipt'));
    } catch (e: any) {
      if (e.message?.includes('belum disetting')) {
        setPrinterModalVisible(true);
      } else {
        Alert.alert(t('billing.printingFailed'), e.message || t('billing.printReceiptError'));
      }
    }
  };

  const months = [
    t('billing.january') || 'Januari', t('billing.february') || 'Februari', t('billing.march') || 'Maret', 
    t('billing.april') || 'April', t('billing.may') || 'Mei', t('billing.june') || 'Juni',
    t('billing.july') || 'Juli', t('billing.august') || 'Agustus', t('billing.september') || 'September', 
    t('billing.october') || 'Oktober', t('billing.november') || 'November', t('billing.december') || 'Desember'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('billing.recordPayment')}</Text>
          <TouchableOpacity onPress={() => setPrinterModalVisible(true)} style={styles.settingsButton}>
            <Settings size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Customer Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('billing.selectCustomer')}</Text>
            {selectedCustomer ? (
              <View style={styles.selectedCustomerCard}>
                 <View style={styles.customerIcon}>
                   <User size={24} color="#2563eb" />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                    <Text style={styles.customerUser}>@{selectedCustomer.username}</Text>
                 </View>
                 <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                    <Text style={styles.changeText}>{t('billing.changeCustomer')}</Text>
                 </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                  <Search size={20} color="#64748b" style={{ marginLeft: 15 }} />
                  <TextInput 
                    style={styles.searchInput}
                    placeholder={t('billing.searchCustomerPlaceholder')}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor="#94a3b8"
                  />
                  {searching && <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 15 }} />}
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
                        <ChevronRight size={18} color="#94a3b8" />
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
                  <Banknote size={20} color="#64748b" />
                </View>
                <TextInput 
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Contoh: 150000"
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
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
                 <View style={[styles.inputWrapper, { flex: 1.5, marginRight: 10 }]}>
                    <View style={styles.iconBox}>
                      <Calendar size={20} color="#64748b" />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                       {months.map((m, idx) => (
                         <TouchableOpacity 
                            key={m} 
                            style={[styles.chip, selectedMonth === idx && styles.chipActive]}
                            onPress={() => setSelectedMonth(idx)}
                         >
                            <Text style={[styles.chipText, selectedMonth === idx && styles.chipTextActive]}>{m}</Text>
                         </TouchableOpacity>
                       ))}
                    </ScrollView>
                 </View>
                 <View style={[styles.inputWrapper, { flex: 0.8 }]}>
                    <TextInput 
                       style={[styles.input, { textAlign: 'center' }]}
                       value={selectedYear.toString()}
                       onChangeText={(t) => setSelectedYear(parseInt(t) || new Date().getFullYear())}
                       keyboardType="numeric"
                    />
                 </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('billing.notesOptional')}</Text>
              <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                <View style={[styles.iconBox, { height: 40 }]}>
                  <FileText size={20} color="#64748b" />
                </View>
                <TextInput 
                  style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Contoh: Titipan tetangga"
                  multiline
                  placeholderTextColor="#94a3b8"
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
              <ActivityIndicator color="#fff" />
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
                <CheckCircle2 size={70} color="#10b981" />
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
                   {method === 'cash' && (
                     <TouchableOpacity style={styles.printBtnAction} onPress={handlePrint}>
                        <Printer size={20} color="#fff" />
                        <Text style={styles.printBtnText}>{t('billing.printReceipt')}</Text>
                     </TouchableOpacity>
                   )}
                   
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#0f172a',
    marginBottom: 16,
  },
  selectedCustomerCard: {
    backgroundColor: '#eff6ff',
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
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  customerUser: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 2,
    fontWeight: '500',
  },
  changeText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 14,
    padding: 8,
  },
  searchContainer: {
    zIndex: 10,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 56,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
  },
  resultsList: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: '#64748b',
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
    borderBottomColor: '#f1f5f9',
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultUser: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
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
    color: '#475569',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 56,
  },
  iconBox: {
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 16,
  },
  methodBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  methodBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#2563eb',
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
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 38,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonText: {
    color: '#ffffff',
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
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 24,
  },
  successSub: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 32,
  },
  invoicePreview: {
    backgroundColor: '#f8fafc',
    width: '100%',
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  previewDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  previewAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10b981',
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  printBtnAction: {
    backgroundColor: '#10b981',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  printBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  doneBtnText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  }
});
