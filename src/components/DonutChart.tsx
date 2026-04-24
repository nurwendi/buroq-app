import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Segment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
  darkBackground?: boolean;
  onPress?: () => void;
}

// ─── Animated Pulse Dot ───────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (color !== '#10b981') return; // only pulse for online/green
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.6, duration: 600, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,   duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.dotWrapper}>
      {color === '#10b981' && (
        <Animated.View
          style={[
            styles.dotRing,
            { borderColor: color, transform: [{ scale }], opacity },
          ]}
        />
      )}
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DonutChart({
  segments,
  size = 140,
  strokeWidth = 22,
  centerLabel,
  centerValue,
  darkBackground = false,
  onPress,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
  const isEmpty = total === 0;

  // Build arc segments — same algo as web's Recharts Pie
  let strokeDashoffset = circumference * 0.25; // start from top

  const arcs = isEmpty
    ? (
        // Empty state — single grey ring
        <Circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={darkBackground ? 'rgba(255,255,255,0.15)' : '#e5e7eb'}
          strokeWidth={strokeWidth}
        />
      )
    : segments.map((seg, i) => {
        const fraction = (seg.value || 0) / total;
        // paddingAngle equivalent: subtract a tiny gap (5°) between segments
        const gapAngle = segments.length > 1 ? (5 / 360) * circumference : 0;
        const dash = Math.max(0, fraction * circumference - gapAngle);
        const gap  = circumference - dash;
        const currentOffset = strokeDashoffset;
        strokeDashoffset = strokeDashoffset - (fraction * circumference);
        if (strokeDashoffset < 0) strokeDashoffset += circumference;

        return (
          <Circle
            key={i}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={currentOffset}
            strokeLinecap="round"
          />
        );
      });

  const activeNum  = segments[0]?.value || 0;
  const offlineNum = segments[1]?.value || 0;
  const displayTotal = isEmpty
    ? (typeof centerValue === 'number' ? centerValue : 0)
    : total;

  const textColor     = darkBackground ? '#ffffff' : COLORS.slate[900];
  const subTextColor  = darkBackground ? 'rgba(255,255,255,0.65)' : COLORS.slate[500];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={styles.container}
    >
      {/* Donut SVG */}
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={darkBackground ? 'rgba(255,255,255,0.12)' : '#f1f5f9'}
            strokeWidth={strokeWidth}
          />
          <G>{arcs}</G>
        </Svg>

        {/* Center text */}
        <View style={[styles.centerContainer, { width: size, height: size }]}>
          <Text style={[styles.centerValue, { color: textColor }]}>
            {typeof centerValue !== 'undefined' ? centerValue : displayTotal}
          </Text>
          {centerLabel ? (
            <Text style={[styles.centerLabel, { color: subTextColor }]} numberOfLines={1}>
              {centerLabel}
            </Text>
          ) : (
            <Text style={[styles.centerSubLabel, { color: subTextColor }]}>
              Total
            </Text>
          )}
        </View>
      </View>

      {/* Bottom Legend — 2 columns, persis seperti web */}
      <View style={styles.legendGrid}>
        {/* Online */}
        <View style={[styles.legendCell, { backgroundColor: darkBackground ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)' }]}>
          <View style={styles.legendLabelRow}>
            <PulseDot color="#10b981" />
            <Text style={[styles.legendLabelText, { color: '#10b981' }]}>
              {segments[0]?.label || 'Online'}
            </Text>
          </View>
          <Text style={[styles.legendValue, { color: textColor }]}>
            {activeNum}
          </Text>
        </View>

        {/* Offline */}
        <View style={[styles.legendCell, { backgroundColor: darkBackground ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.06)' }]}>
          <View style={styles.legendLabelRow}>
            <PulseDot color="#ef4444" />
            <Text style={[styles.legendLabelText, { color: '#ef4444' }]}>
              {segments[1]?.label || 'Offline'}
            </Text>
          </View>
          <Text style={[styles.legendValue, { color: textColor }]}>
            {offlineNum}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 18,
  },
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
  },
  centerLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },
  centerSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 3,
  },

  // Bottom legend grid — 2 columns, same as web
  legendGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingHorizontal: 4,
  },
  legendCell: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  legendLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendLabelText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  // Pulse dot
  dotWrapper: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    position: 'absolute',
  },
  dotRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    position: 'absolute',
  },
});
