import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { TrendingUp, Wallet, DollarSign, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

interface FinancialWidgetProps {
  grossRevenue: number;
  commission: number;
  netRevenue: number;
  totalUnpaid: number;
  commissionLabel: string;
  title: string;
  grossLabel: string;
  netLabel: string;
  unpaidLabel: string;
}

const fmt = (v: number) =>
  'Rp ' + Math.round(v).toLocaleString('id-ID');

export default function FinancialWidget({
  grossRevenue,
  commission,
  netRevenue,
  totalUnpaid,
  commissionLabel,
  title,
  grossLabel,
  netLabel,
  unpaidLabel,
}: FinancialWidgetProps) {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('FinancialReport')}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={['#4f46e5', '#6366f1', '#818cf8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background decorative icon */}
        <View style={styles.bgIconContainer}>
          <TrendingUp size={120} color="rgba(255,255,255,0.08)" strokeWidth={1.5} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <TrendingUp size={18} color="#fff" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.tapHint}>{'Tap → Detail'}</Text>
        </View>

        {/* Main value — gross revenue */}
        <Text style={styles.mainValue}>{fmt(grossRevenue)}</Text>
        <Text style={styles.mainLabel}>{grossLabel}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* 3-column breakdown */}
        <View style={styles.row}>
          {/* Commission */}
          <View style={styles.col}>
            <View style={[styles.colIcon, { backgroundColor: 'rgba(16,185,129,0.25)' }]}>
              <Wallet size={14} color="#6ee7b7" />
            </View>
            <Text style={styles.colValue}>{fmt(commission)}</Text>
            <Text style={styles.colLabel} numberOfLines={1}>{commissionLabel}</Text>
          </View>

          {/* Net */}
          <View style={[styles.col, styles.colMiddle]}>
            <View style={[styles.colIcon, { backgroundColor: 'rgba(14,165,233,0.25)' }]}>
              <DollarSign size={14} color="#7dd3fc" />
            </View>
            <Text style={styles.colValue}>{fmt(netRevenue)}</Text>
            <Text style={styles.colLabel} numberOfLines={1}>{netLabel}</Text>
          </View>

          {/* Unpaid */}
          <View style={styles.col}>
            <View style={[styles.colIcon, { backgroundColor: 'rgba(245,158,11,0.25)' }]}>
              <AlertCircle size={14} color="#fcd34d" />
            </View>
            <Text style={[styles.colValue, { color: '#fcd34d' }]}>{fmt(totalUnpaid)}</Text>
            <Text style={styles.colLabel} numberOfLines={1}>{unpaidLabel}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  gradient: {
    padding: 24,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  bgIconContainer: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tapHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  mainValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 4,
  },
  mainLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    alignItems: 'flex-start',
  },
  colMiddle: {
    paddingHorizontal: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  colIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  colValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  colLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
