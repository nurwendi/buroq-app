import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS } from '../constants/theme';

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
}

export default function DonutChart({
  segments,
  size = 140,
  strokeWidth = 22,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);

  let offset = 0;
  // Start from top (-90 deg = -circumference/4 offset)
  let strokeDashoffset = circumference * 0.25;

  const arcs = segments.map((seg, i) => {
    const fraction = total > 0 ? (seg.value || 0) / total : 0;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const currentOffset = strokeDashoffset;
    strokeDashoffset = strokeDashoffset - dash;
    if (strokeDashoffset < 0) strokeDashoffset += circumference;

    return (
      <Circle
        key={i}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={currentOffset}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <View style={styles.container}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background track */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          <G>{arcs}</G>
        </Svg>
        {/* Center text */}
        {(centerValue !== undefined || centerLabel) && (
          <View style={[styles.centerTextContainer, { width: size, height: size }]}>
            {centerValue !== undefined && (
              <Text style={styles.centerValue}>{centerValue}</Text>
            )}
            {centerLabel && (
              <Text style={styles.centerLabel} numberOfLines={1}>{centerLabel}</Text>
            )}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.map((seg, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <View>
              <Text style={styles.legendValue}>{seg.value}</Text>
              <Text style={styles.legendLabel}>{seg.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.slate[900],
    letterSpacing: -1,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate[800],
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
