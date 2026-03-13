import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Users } from 'lucide-react-native';

interface PppoePieChartProps {
  active: number;
  offline: number;
  total: number;
  loading?: boolean;
  onPress?: () => void;
}

export default function PppoePieChart({ active, offline, total, loading = false, onPress }: PppoePieChartProps) {
  // Ensure we have numbers
  const activeNum = Math.max(0, Number(active) || 0);
  const offlineNum = Math.max(0, Number(offline) || 0);
  const totalNum = Math.max(activeNum + offlineNum, Number(total) || 0);
  
  const isEmpty = activeNum === 0 && offlineNum === 0;

  const data = isEmpty
    ? [{ value: 1, color: '#f1f5f9', text: 'N/A' }]
    : [
        {
          value: activeNum,
          color: '#10b981',
          text: 'Online',
          focused: true,
        },
        {
          value: offlineNum,
          color: '#ef4444',
          text: 'Offline',
        },
      ];

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>PELANGGAN PPPOE</Text>
          <Text style={styles.subtitle}>Status Koneksi Real-time</Text>
        </View>
        <View style={styles.iconContainer}>
          <Users size={18} color="#2563eb" />
        </View>
      </View>

      <View style={styles.chartContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          <View style={styles.chartWrapper}>
            <PieChart
              donut
              radius={80}
              innerRadius={60}
              data={data}
              innerCircleColor={'#ffffff'}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.centerValue}>{totalNum}</Text>
                  <Text style={styles.centerText}>TOTAL</Text>
                </View>
              )}
              backgroundColor="transparent"
            />
          </View>
        )}
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
          <View style={styles.legendInfo}>
            <Text style={styles.legendLabel}>ONLINE</Text>
            <View style={styles.legendValueRow}>
              <Text style={styles.legendValue}>{activeNum}</Text>
              <Text style={styles.legendUnit}>User</Text>
            </View>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.statusDot, { backgroundColor: '#ef4444' }]} />
          <View style={styles.legendInfo}>
            <Text style={styles.legendLabel}>OFFLINE</Text>
            <View style={styles.legendValueRow}>
              <Text style={styles.legendValue}>{offlineNum}</Text>
              <Text style={styles.legendUnit}>User</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  iconContainer: {
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    marginVertical: 10,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
  },
  centerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 16,
  },
  legendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  legendInfo: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  legendValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  legendValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  legendUnit: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
});
