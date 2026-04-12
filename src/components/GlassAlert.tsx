import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Modal,
  Platform 
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomIn, 
  ZoomOut 
} from 'react-native-reanimated';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  X 
} from 'lucide-react-native';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface GlassAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type: AlertType;
  onClose: () => void;
  confirmText?: string;
  onConfirm?: () => void;
}

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  error: {
    icon: XCircle,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
  warning: {
    icon: AlertTriangle,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  info: {
    icon: Info,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
};

export default function GlassAlert({
  visible,
  title,
  message,
  type,
  onClose,
  confirmText,
  onConfirm,
}: GlassAlertProps) {
  if (!visible) return null;

  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop blur */}
        <Animated.View 
          entering={FadeIn.duration(300)} 
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose}
          />
        </Animated.View>

        {/* Alert Container */}
        <Animated.View 
          entering={ZoomIn.duration(400).springify()} 
          exiting={ZoomOut.duration(200)}
          style={styles.alertWrapper}
        >
          <BlurView intensity={80} tint="light" style={styles.alertContainer}>
            <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
              <Icon size={32} color={config.color} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              {onConfirm ? (
                <>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.confirmButton, { backgroundColor: config.color }]} 
                    onPress={handleConfirm}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText || 'OK'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.confirmButton, { backgroundColor: config.color, width: '100%' }]} 
                  onPress={onClose}
                >
                  <Text style={styles.confirmButtonText}>Mengerti</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
              <X size={20} color={COLORS.slate[400]} />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  alertWrapper: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  alertContainer: {
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.slate[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.slate[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  cancelButtonText: {
    color: COLORS.slate[600],
    fontSize: 16,
    fontWeight: '600',
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
});
