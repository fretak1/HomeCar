import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, Platform } from 'react-native';
import { CheckCircle, XCircle, Info } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  show: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

let _show: ((type: ToastType, message: string) => void) | null = null;

// ─── Individual Toast Item ────────────────────────────────────────────────────
function ToastItem({
  item,
  onDone,
}: {
  item: ToastMessage;
  onDone: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => onDone(item.id));
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const config = {
    success: { bg: '#ECFDF5', border: '#6EE7B7', text: '#065F46', Icon: CheckCircle, iconColor: '#059669' },
    error:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', Icon: XCircle,     iconColor: '#DC2626' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', Icon: Info,         iconColor: '#3B82F6' },
  }[item.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity, transform: [{ translateY }], backgroundColor: config.bg, borderColor: config.border },
      ]}
    >
      <config.Icon size={18} color={config.iconColor} />
      <Text style={[styles.text, { color: config.text }]} numberOfLines={3}>
        {item.message}
      </Text>
    </Animated.View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);

  const show = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Expose globally
  _show = show;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((item) => (
          <ToastItem key={item.id} item={item} onDone={remove} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ─── Global API (mirrors sonner) ──────────────────────────────────────────────
export const toast = {
  success: (message: string) => _show?.('success', message),
  error:   (message: string) => _show?.('error',   message),
  info:    (message: string) => _show?.('info',    message),
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
    maxWidth: 480,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
