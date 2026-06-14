import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import {
  connectIAP,
  disconnectIAP,
  fetchProduct,
  purchaseThemePack,
  restorePurchases,
} from '../services/IAPService';

const PREMIUM_SWATCHES: { label: string; outer: string; inner: string }[] = [
  { label: 'GLACIER', outer: '#A8DFFF', inner: '#F5A030' },
  { label: 'ABYSS',   outer: '#000814', inner: '#00FFD0' },
  { label: 'SOLAR',   outer: '#FFE566', inner: '#7280FF' },
  { label: 'AURORA',  outer: '#00E676', inner: '#E8F5FF' },
  { label: 'DUSK',    outer: '#FF4081', inner: '#FFD740' },
  { label: 'NEBULA',  outer: '#9C27B0', inner: '#40C4FF' },
];

const SWATCH_ROWS = [PREMIUM_SWATCHES.slice(0, 3), PREMIUM_SWATCHES.slice(3)];

type Props = {
  onUnlock: () => void;
  onClose: () => void;
};

export default function ThemePackPaywall({ onUnlock, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [localizedPrice, setLocalizedPrice] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    connectIAP().then(() => {
      if (!mountedRef.current) return;
      fetchProduct().then((p) => {
        if (!mountedRef.current) return;
        setLocalizedPrice(p?.localizedPrice ?? '$4.99');
      });
    });
    return () => {
      mountedRef.current = false;
      disconnectIAP();
    };
  }, []);

  const handleBuy = useCallback(async () => {
    if (buying || restoring) return;
    setBuying(true);
    setError(null);
    const result = await purchaseThemePack();
    if (!mountedRef.current) return;
    setBuying(false);
    if (result === 'success') {
      onUnlock();
    } else if (result === 'error') {
      setError('Purchase could not be completed. Please try again.');
    }
    // 'cancelled' — close modal silently
    if (result === 'cancelled') onClose();
  }, [buying, restoring, onUnlock, onClose]);

  const handleRestore = useCallback(async () => {
    if (buying || restoring) return;
    setRestoring(true);
    setError(null);
    const found = await restorePurchases();
    if (!mountedRef.current) return;
    setRestoring(false);
    if (found) {
      onUnlock();
    } else {
      setError('No previous purchase found for this Apple ID.');
    }
  }, [buying, restoring, onUnlock]);

  const priceLabel = localizedPrice ?? '$4.99';
  const busy = buying || restoring;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={busy ? undefined : onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={busy ? undefined : onClose} accessible={false}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>THEME PACK</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={busy ? undefined : onClose}
            disabled={busy}
            activeOpacity={0.7}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>6 premium visual themes. One unlock.</Text>

        {/* Theme swatches — all shown as unlocked previews */}
        <View style={styles.swatchGrid}>
          {SWATCH_ROWS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.swatchRow}>
              {row.map((t) => (
                <View key={t.label} style={styles.swatchOption}>
                  <View style={[styles.swatch, { backgroundColor: t.outer }]}>
                    <View style={[styles.swatchInner, { backgroundColor: t.inner }]} />
                  </View>
                  <Text style={styles.swatchLabel}>{t.label}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Error message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Buy button */}
        <TouchableOpacity
          style={[styles.buyButton, busy && styles.buyButtonDisabled]}
          onPress={handleBuy}
          activeOpacity={0.85}
          disabled={busy}
          accessibilityLabel={`Unlock theme pack for ${priceLabel}`}
          accessibilityRole="button"
        >
          {buying ? (
            <ActivityIndicator color={COLORS.TEXT_ON_AMBER} />
          ) : (
            <Text style={styles.buyText}>UNLOCK  —  {priceLabel}</Text>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={busy}
          activeOpacity={0.6}
          accessibilityLabel="Restore previous purchase"
          accessibilityRole="button"
          style={styles.restoreButton}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={COLORS.TEXT_SECONDARY} />
          ) : (
            <Text style={styles.restoreText}>Restore purchase</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  swatchGrid: {
    gap: 16,
    marginBottom: 28,
  },
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  swatchOption: {
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  swatchInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  swatchLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  buyButton: {
    backgroundColor: COLORS.AMBER,
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyText: {
    color: COLORS.TEXT_ON_AMBER,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  restoreText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
  },
});
