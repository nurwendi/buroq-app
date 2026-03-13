import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { FileText, CreditCard, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function BillingScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tagihan & Pembayaran</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('PaymentForm')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
              <CreditCard size={32} color="#16a34a" />
            </View>
            <Text style={styles.cardTitle}>Bayar Tagihan</Text>
            <Text style={styles.cardDesc}>Form penerimaan pembayaran tunai</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => {
              // Usually expects username, we can leave this disabled or point to a list
              // navigation.navigate('PaymentHistory', { username: '', name: 'Semua Transaksi' });
            }}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}>
              <FileText size={32} color="#0284c7" />
            </View>
            <Text style={styles.cardTitle}>Riwayat Transaksi</Text>
            <Text style={styles.cardDesc}>Lihat riwayat pembayaran pelanggan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('UnpaidBills')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
              <Clock size={32} color="#d97706" />
            </View>
            <Text style={styles.cardTitle}>Tagihan Tertunda</Text>
            <Text style={styles.cardDesc}>Daftar pelanggan yang belum lunas</Text>
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
