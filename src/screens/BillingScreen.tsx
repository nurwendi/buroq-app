import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { FileText, CreditCard, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';

export default function BillingScreen() {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('billing.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {/* Laporan Keuangan */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('FinancialReport')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#f3e8ff' }]}>
              <FileText size={32} color="#a855f7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t('financial.title') || 'Laporan Keuangan'}</Text>
              <Text style={styles.cardDesc}>{t('financial.desc') || 'Ringkasan performa dan pendapatan'}</Text>
            </View>
          </TouchableOpacity>

          {/* Tagihan Lunas */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('PaymentHistory', { name: 'Tagihan Lunas' })}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
              <CreditCard size={32} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t('financial.paid') || 'Tagihan Lunas'}</Text>
              <Text style={styles.cardDesc}>{t('billing.historyDesc')}</Text>
            </View>
          </TouchableOpacity>

          {/* Tagihan Pending */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('UnpaidBills')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
              <Clock size={32} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{t('billing.unpaidBills')}</Text>
              <Text style={styles.cardDesc}>{t('billing.unpaidBillsDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>
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
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  }
});
