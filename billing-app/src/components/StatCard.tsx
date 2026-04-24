import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  isPrimary?: boolean;
}

const { width } = Dimensions.get('window');

export default function StatCard({ title, value, icon: Icon, color, subtitle, isPrimary }: StatCardProps) {
  const CardContent = (
    <View style={[styles.cardInner, isPrimary && { backgroundColor: COLORS.primary }]}>
      <View style={styles.header}>
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isPrimary ? 'rgba(255,255,255,0.2)' : `${color}20`, 
            borderColor: isPrimary ? 'rgba(255,255,255,0.3)' : `${color}30` }
        ]}>
          <Icon size={22} color={isPrimary ? '#ffffff' : color} />
        </View>
        <Text style={[styles.title, isPrimary && { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>{title}</Text>
      </View>
      <Text style={[styles.value, isPrimary && { color: '#ffffff' }]}>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, isPrimary && { color: 'rgba(255,255,255,0.7)' }]}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={20} tint="light" style={styles.blurWrapper}>
          {CardContent}
        </BlurView>
      ) : (
        <View style={styles.androidGlass}>
          {CardContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  blurWrapper: {
    width: '100%',
  },
  androidGlass: {
    backgroundColor: COLORS.white,
    width: '100%',
  },
  cardInner: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate[500],
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.slate[400],
    marginTop: 6,
    fontWeight: '600',
  },
});

