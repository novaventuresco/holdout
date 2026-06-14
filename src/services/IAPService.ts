/**
 * IAP Service — Theme Pack unlock ($4.99 non-consumable).
 *
 * Uses lazy loading via try/catch so import is safe in any environment.
 * react-native-iap (NitroModules) only loads in dev-client / production builds.
 * This project never runs in Expo Go (react-native-skia requires native code), so
 * no expo-constants environment check is needed — lazy import + catch is sufficient.
 *
 * Patterns carried from DailyGoals iapService.ts:
 *   - Pending-promise map: correlates requestPurchase() with the async listener response
 *   - Stale transaction filter (20s): ignores replayed unfinished transactions on launch
 *   - 60-second purchase timeout: prevents UI hanging on native bridge stall
 *   - Double-settle guard: error listener + requestPurchase catch both check pending map first
 *   - Orphan recovery: getAvailablePurchases() in connectIAP() finishes any unfinished transactions
 *
 * v14 API differences from DailyGoals (consumable tip pattern):
 *   - requestPurchase requires type: 'in-app' (not 'iap')
 *   - Products use .id (not .productId) and .displayPrice (not .localizedPrice)
 *   - PurchaseError.code is ErrorCode enum; no responseCode field
 *   - Non-consumable: isConsumable: false in finishTransaction
 */

import type { ErrorCode, Purchase, PurchaseError } from 'react-native-iap';

export const THEME_PACK_PRODUCT_ID = 'com.novaventuresco.holdout.themes';

const REQUEST_TIME_TOLERANCE_MS = 20000;
const PURCHASE_TIMEOUT_MS = 60000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EmitterSub = { remove: () => void } | any;

// Module-level state — intentional exception to the stateless-service pattern.
// StoreKit connection and purchase listeners must survive component re-renders;
// the pending-promise map must outlive any single paywall mount/unmount cycle.
let iapModule: typeof import('react-native-iap') | null = null;
let isConnected = false;
let purchaseUpdateSubscription: EmitterSub | null = null;
let purchaseErrorSubscription: EmitterSub | null = null;
let currentPurchasingProductId: string | null = null;

const pendingPurchases = new Map<string, {
  resolve: (result: 'success' | 'cancelled') => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  requestStartedAt: number;
}>();

async function getIAPModule(): Promise<typeof import('react-native-iap') | null> {
  if (iapModule) return iapModule;
  try {
    iapModule = await import('react-native-iap');
    return iapModule;
  } catch (e) {
    if (__DEV__) console.warn('[IAP] react-native-iap not available:', (e as Error)?.message);
    return null;
  }
}

// PurchaseError.code is an ErrorCode enum value in v14. User-cancel value: 'user-cancelled'.
function isUserCancel(error: PurchaseError | { code?: string | ErrorCode; message?: string }): boolean {
  try {
    const code = String(error?.code ?? '');
    const msg = (error?.message ?? '').toLowerCase();
    return (
      code === 'user-cancelled' ||
      code === 'E_USER_CANCELLED' ||
      code === 'E_USER_CANCELED' ||
      code === 'user-canceled' ||
      msg.includes('cancel')
    );
  } catch {
    return false;
  }
}

function setupListeners(iap: typeof import('react-native-iap')): void {
  if (purchaseUpdateSubscription) return;

  purchaseUpdateSubscription = iap.purchaseUpdatedListener(async (purchase: Purchase) => {
    try {
      const pending = pendingPurchases.get(purchase.productId);

      if (pending) {
        const txDateMs = typeof purchase.transactionDate === 'number' ? purchase.transactionDate : NaN;
        const isFromThisRequest = !Number.isNaN(txDateMs) &&
          txDateMs >= pending.requestStartedAt - REQUEST_TIME_TOLERANCE_MS;

        if (!isFromThisRequest) {
          // Stale replay — finish silently, leave promise in place
          try { await iap.finishTransaction({ purchase, isConsumable: false }); } catch {}
          return;
        }

        clearTimeout(pending.timeout);
        pendingPurchases.delete(purchase.productId);
        currentPurchasingProductId = null;

        try {
          await iap.finishTransaction({ purchase, isConsumable: false });
          pending.resolve('success');
        } catch (e) {
          pending.reject(e as Error);
        }
      } else {
        // No pending promise — orphaned transaction, finish silently
        try { await iap.finishTransaction({ purchase, isConsumable: false }); } catch {}
      }
    } catch (e) {
      const pending = pendingPurchases.get(purchase.productId);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingPurchases.delete(purchase.productId);
        currentPurchasingProductId = null;
        pending.reject(e as Error);
      }
    }
  });

  purchaseErrorSubscription = iap.purchaseErrorListener((error: PurchaseError) => {
    try {
      let productId = currentPurchasingProductId;
      if (!productId || !pendingPurchases.has(productId)) {
        const keys = Array.from(pendingPurchases.keys());
        productId = keys[0] ?? null;
      }
      if (!productId) return;

      const pending = pendingPurchases.get(productId);
      if (!pending) return;

      clearTimeout(pending.timeout);
      pendingPurchases.delete(productId);
      currentPurchasingProductId = null;

      if (isUserCancel(error)) {
        pending.resolve('cancelled');
      } else {
        pending.reject(new Error(String(error?.message || error?.code || 'Purchase failed')));
      }
    } catch (e) {
      // Must not throw to native
      const keys = Array.from(pendingPurchases.keys());
      if (keys.length > 0) {
        const pending = pendingPurchases.get(keys[0]);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingPurchases.delete(keys[0]);
          currentPurchasingProductId = null;
          pending.reject(e instanceof Error ? e : new Error(String(e)));
        }
      }
    }
  });
}

/** Connect to App Store and finish any unfinished non-consumable transactions from prior runs. */
export async function connectIAP(): Promise<boolean> {
  const iap = await getIAPModule();
  if (!iap) return false;

  if (isConnected) return true;

  // Clean up any leftover connection
  try {
    purchaseUpdateSubscription?.remove?.();
    purchaseUpdateSubscription = null;
    purchaseErrorSubscription?.remove?.();
    purchaseErrorSubscription = null;
    await iap.endConnection();
  } catch {}

  try {
    await iap.initConnection();
    isConnected = true;
    setupListeners(iap);

    // Orphan recovery: finish any previously unfinished non-consumable transactions
    try {
      const available = await iap.getAvailablePurchases();
      for (const p of available) {
        try { await iap.finishTransaction({ purchase: p, isConsumable: false }); } catch {}
      }
    } catch {}

    return true;
  } catch (e) {
    isConnected = false;
    if (__DEV__) console.warn('[IAP] connectIAP failed:', (e as Error)?.message);
    return false;
  }
}

/**
 * Fetch the theme pack product to get the localised price string.
 * Returns null on simulator / native unavailable / network error.
 * In v14, products use .id (identifier) and .displayPrice (formatted price).
 */
export async function fetchProduct(): Promise<{ productId: string; localizedPrice: string } | null> {
  const iap = await getIAPModule();
  if (!iap) return null;
  if (!isConnected) {
    const ok = await connectIAP();
    if (!ok) return null;
  }
  try {
    const result = await iap.fetchProducts({ skus: [THEME_PACK_PRODUCT_ID] });
    if (!result || result.length === 0) return null;
    // v14: product identifier is .id, formatted price is .displayPrice
    const p = result[0] as { id: string; displayPrice: string };
    if (!p?.id) return null;
    return { productId: p.id, localizedPrice: p.displayPrice };
  } catch {
    return null;
  }
}

/** Initiate purchase of the theme pack. Returns 'success', 'cancelled', or 'error'. */
export async function purchaseThemePack(): Promise<'success' | 'cancelled' | 'error'> {
  const iap = await getIAPModule();
  if (!iap) return 'error';

  if (!isConnected) {
    const ok = await connectIAP();
    if (!ok) return 'error';
  }

  if (!purchaseUpdateSubscription) setupListeners(iap);
  if (pendingPurchases.has(THEME_PACK_PRODUCT_ID)) return 'error'; // already in flight

  currentPurchasingProductId = THEME_PACK_PRODUCT_ID;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (pendingPurchases.has(THEME_PACK_PRODUCT_ID)) {
        pendingPurchases.delete(THEME_PACK_PRODUCT_ID);
        currentPurchasingProductId = null;
      }
      resolve('error');
    }, PURCHASE_TIMEOUT_MS);

    pendingPurchases.set(THEME_PACK_PRODUCT_ID, {
      resolve: (result) => {
        if (currentPurchasingProductId === THEME_PACK_PRODUCT_ID) currentPurchasingProductId = null;
        resolve(result);
      },
      reject: (e) => {
        if (__DEV__) console.warn('[IAP] purchaseThemePack rejected:', (e as Error)?.message);
        if (currentPurchasingProductId === THEME_PACK_PRODUCT_ID) currentPurchasingProductId = null;
        resolve('error');
      },
      timeout,
      requestStartedAt: Date.now(),
    });

    // v14: type 'in-app' for non-consumable products (not 'iap')
    iap.requestPurchase({
      type: 'in-app',
      request: {
        ios: { sku: THEME_PACK_PRODUCT_ID, andDangerouslyFinishTransactionAutomatically: false },
      },
    })
      .then(() => {
        // Waiting for purchaseUpdatedListener to resolve the pending promise
      })
      .catch((error: PurchaseError) => {
        const pending = pendingPurchases.get(THEME_PACK_PRODUCT_ID);
        if (!pending) { currentPurchasingProductId = null; return; } // listener already settled
        clearTimeout(pending.timeout);
        pendingPurchases.delete(THEME_PACK_PRODUCT_ID);
        currentPurchasingProductId = null;
        resolve(isUserCancel(error) ? 'cancelled' : 'error');
      });
  });
}

/**
 * Restore non-consumable purchases. Returns true if the theme pack was found,
 * false if not found or restore failed.
 */
export async function restorePurchases(): Promise<boolean> {
  const iap = await getIAPModule();
  if (!iap) return false;
  if (!isConnected) {
    const ok = await connectIAP();
    if (!ok) return false;
  }
  try {
    const purchases = await iap.getAvailablePurchases();
    let found = false;
    for (const p of purchases) {
      try { await iap.finishTransaction({ purchase: p, isConsumable: false }); } catch {}
      if (p.productId === THEME_PACK_PRODUCT_ID) found = true;
    }
    return found;
  } catch {
    return false;
  }
}

/**
 * Disconnect from App Store. Call on paywall unmount.
 * Note: finishTransaction uses isConsumable: false throughout — correct for a single
 * non-consumable product. If a consumable product is added in future, this must be
 * revisited (finishing a consumable as non-consumable triggers App Store validation errors).
 */
export async function disconnectIAP(): Promise<void> {
  const iap = await getIAPModule();

  pendingPurchases.forEach((p) => { clearTimeout(p.timeout); p.reject(new Error('IAP disconnected')); });
  pendingPurchases.clear();

  purchaseUpdateSubscription?.remove?.();
  purchaseUpdateSubscription = null;
  purchaseErrorSubscription?.remove?.();
  purchaseErrorSubscription = null;
  currentPurchasingProductId = null;

  if (isConnected && iap) {
    isConnected = false;
    try { await iap.endConnection(); } catch {}
  }
}
