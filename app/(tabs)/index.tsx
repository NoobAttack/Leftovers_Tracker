import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { Design } from '@/constants/design';
import { getCompactCardLayoutEnabled } from '@/services/preferencesStorage';
import { getLeftoverItems, removeLeftoverItem, saveLeftoverItems } from '@/services/leftoverStorage';
import { LeftoverItem } from '@/types/leftover';

type ExpiryTone = 'urgent' | 'soon' | 'ok';

type ExpiryStatus = {
  label: string;
  tone: ExpiryTone;
};

// Turn expiry date into label + urgency level.
function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(expiryDate);
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const days = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000);

  if (days < 0) {
    return { label: `Expired ${Math.abs(days)} day(s) ago`, tone: 'urgent' };
  }
  if (days === 0) {
    return { label: 'Expires Today', tone: 'urgent' };
  }
  if (days <= 2) {
    return { label: `Expires in ${days} day(s)`, tone: 'soon' };
  }

  return { label: `Expires in ${days} day(s)`, tone: 'ok' };
}

// Pick text color for each urgency level.
function getStatusStyle(tone: ExpiryTone): TextStyle {
  if (tone === 'urgent') {
    return styles.statusUrgent;
  }
  if (tone === 'soon') {
    return styles.statusSoon;
  }
  return styles.statusOk;
}

// Build extra lines only when API data exists.
function getMetaLines(item: LeftoverItem): string[] {
  const lines = [`Expires on ${item.expiryDate}`];
  if (item.apiDetails?.brand) {
    lines.push(`Brand: ${item.apiDetails.brand}`);
  }
  if (item.apiDetails?.category) {
    lines.push(`Category: ${item.apiDetails.category}`);
  }
  if (item.apiDetails?.nutritionGrade) {
    lines.push(`Nutrition grade: ${item.apiDetails.nutritionGrade.toUpperCase()}`);
  }
  return lines;
}

export default function HomeScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [items, setItems] = useState<LeftoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsErrorMessage, setItemsErrorMessage] = useState<string | null>(null);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [activeCameraItemId, setActiveCameraItemId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('No photo captured yet.');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [compactCardLayoutEnabled, setCompactCardLayoutEnabled] = useState(false);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  }, [items]);
  const activeCameraItem = useMemo(() => {
    if (!activeCameraItemId) {
      return null;
    }
    return items.find((item) => item.id === activeCameraItemId) ?? null;
  }, [activeCameraItemId, items]);
  const hasItems = sortedItems.length > 0;

  // Reload items whenever user comes back to this tab.
  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setItemsErrorMessage(null);
      const loadedItems = await getLeftoverItems();
      setItems(loadedItems);
    } catch {
      setItemsErrorMessage('Could not load your saved leftovers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDisplayPreferences = useCallback(async () => {
    try {
      const compactEnabled = await getCompactCardLayoutEnabled();
      setCompactCardLayoutEnabled(compactEnabled);
    } catch {
      // Keep current value if preference read fails.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
      void loadDisplayPreferences();
    }, [loadDisplayPreferences, loadItems])
  );

  // Delete from storage, then update list on screen.
  async function handleDelete(itemId: string) {
    try {
      await removeLeftoverItem(itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch {
      setItemsErrorMessage('Could not remove that item. Please try again.');
    }
  }

  async function handleTakePhoto() {
    if (!permission?.granted) {
      setCameraErrorMessage('Grant camera permission first.');
      return;
    }
    if (!activeCameraItemId) {
      setCameraErrorMessage('Select an item first.');
      return;
    }

    if (!cameraRef.current || !isCameraReady) {
      setCameraErrorMessage('Camera is still getting ready.');
      setStatusMessage('Camera is initializing...');
      return;
    }

    try {
      setIsCapturing(true);
      setCameraErrorMessage(null);
      setStatusMessage('Capturing photo...');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const hasValidUri = typeof photo?.uri === 'string' && photo.uri.trim().length > 0;
      const hasValidSize =
        typeof photo?.width !== 'number' ||
        typeof photo?.height !== 'number' ||
        (photo.width > 0 && photo.height > 0);

      if (!hasValidUri || !hasValidSize) {
        setCameraErrorMessage('Photo data is empty. Try again.');
        setStatusMessage('Capture failed.');
        return;
      }

      const next = items.map((item) =>
        item.id === activeCameraItemId ? { ...item, photoUri: photo.uri } : item
      );
      await saveLeftoverItems(next);
      setItems(next);
      setStatusMessage('Photo captured successfully.');
      setIsCameraMode(false);
      setActiveCameraItemId(null);
      setIsCameraReady(false);
    } catch {
      setCameraErrorMessage('Unexpected error. Please try again.');
      setStatusMessage('Capture failed.');
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleRequestPermission() {
    setCameraErrorMessage(null);
    const result = await requestPermission();
    if (!result.granted) {
      setStatusMessage('Permission denied.');
      return;
    }
    setStatusMessage('Permission granted. Camera is initializing...');
  }

  function handleOpenCamera(itemId: string) {
    setActiveCameraItemId(itemId);
    setIsCameraMode(true);
    setCameraErrorMessage(null);
    setStatusMessage('Ready to capture photo.');
    setIsCameraReady(false);
  }

  function handleExitCameraMode() {
    setIsCameraMode(false);
    setActiveCameraItemId(null);
    setCameraErrorMessage(null);
    setIsCapturing(false);
    setIsCameraReady(false);
    setStatusMessage('No photo captured yet.');
  }

  function handleRetryLoad() {
    void loadItems();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isCameraMode ? (
        <>
          <Text style={styles.title}>Take Item Photo</Text>
          <Text style={styles.description}>
            {activeCameraItem ? `Capturing for: ${activeCameraItem.name}` : 'Select an item to capture.'}
          </Text>

          {!permission ? (
            <View style={styles.permissionChecking}>
              <ActivityIndicator />
              <Text style={styles.helperText}>Checking camera permission...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionText}>Please allow camera access.</Text>
              <Pressable style={styles.primaryButton} onPress={handleRequestPermission}>
                <Text style={styles.primaryButtonText}>Grant Permission</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cameraSection}>
              <View style={styles.cameraPreview}>
                <CameraView
                  ref={cameraRef}
                  facing="back"
                  onCameraReady={() => {
                    setIsCameraReady(true);
                    setStatusMessage('Camera ready. Tap Capture Photo.');
                  }}
                  style={styles.cameraView}
                />
              </View>
              {!isCameraReady ? (
                <View style={styles.cameraInitializingRow}>
                  <ActivityIndicator size="small" />
                  <Text style={styles.helperText}>Camera is initializing...</Text>
                </View>
              ) : null}
              <Pressable
                style={[
                  styles.primaryButton,
                  isCapturing || !isCameraReady || !activeCameraItem ? styles.primaryButtonDisabled : null,
                ]}
                disabled={isCapturing || !isCameraReady || !activeCameraItem}
                onPress={handleTakePhoto}
              >
                <Text style={styles.primaryButtonText}>
                  {isCapturing ? 'Capturing...' : 'Capture Photo'}
                </Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleExitCameraMode}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.cameraFeedback}>
            <Text style={styles.cameraStatusText}>{statusMessage}</Text>
            {cameraErrorMessage ? <Text style={styles.errorText}>{cameraErrorMessage}</Text> : null}
          </View>
        </>
      ) : (
        <>
          <View style={styles.heroSection}>
            <Text style={styles.title}>Leftovers Tracker</Text>
            <Text style={styles.tagline}>KEEP YOUR FRIDGE CLEAN.</Text>
            <Text style={styles.description}>
              Track what is in your fridge and see what is expiring soon so nothing goes to waste.
            </Text>
          </View>

          <Link href="/add-item" asChild>
            <Pressable style={[styles.primaryButton, styles.primaryCta]}>
              <Text style={styles.primaryButtonText}>+ Add Leftover</Text>
            </Pressable>
          </Link>

          <Text style={styles.sectionTitle}>Your Leftovers</Text>

          {itemsErrorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{itemsErrorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={handleRetryLoad}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={Design.accent} />
              <Text style={styles.helperText}>Loading your leftovers...</Text>
            </View>
          ) : null}

          {!isLoading && !hasItems ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No leftovers yet</Text>
              <Text style={styles.emptyDescription}>
                Add your first item above and we will show freshness alerts and quick photo previews here.
              </Text>
            </View>
          ) : null}

          {!isLoading
            ? sortedItems.map((item) => {
                const status = getExpiryStatus(item.expiryDate);
                const metadata = getMetaLines(item);
                return (
                  <View
                    style={[styles.itemCard, compactCardLayoutEnabled ? styles.itemCardCompact : null]}
                    key={item.id}
                  >
                    <View style={[styles.itemRow, compactCardLayoutEnabled ? styles.itemRowCompact : null]}>
                      <View style={styles.itemMain}>
                        <Text style={[styles.itemName, compactCardLayoutEnabled ? styles.itemNameCompact : null]}>
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.itemStatus,
                            compactCardLayoutEnabled ? styles.itemStatusCompact : null,
                            getStatusStyle(status.tone),
                          ]}
                        >
                          {status.label}
                        </Text>
                        {metadata.map((line) => (
                          <Text
                            style={[styles.itemMeta, compactCardLayoutEnabled ? styles.itemMetaCompact : null]}
                            key={`${item.id}-${line}`}
                          >
                            {line}
                          </Text>
                        ))}
                        <View
                          style={[
                            styles.itemActions,
                            compactCardLayoutEnabled ? styles.itemActionsCompact : null,
                          ]}
                        >
                          <Pressable
                            style={[styles.photoButton, compactCardLayoutEnabled ? styles.compactActionButton : null]}
                            onPress={() => handleOpenCamera(item.id)}
                          >
                            <Text style={styles.photoButtonText}>
                              {item.photoUri ? 'Retake Photo' : 'Take Photo'}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[styles.deleteButton, compactCardLayoutEnabled ? styles.compactActionButton : null]}
                            onPress={() => handleDelete(item.id)}
                          >
                            <Text style={styles.deleteButtonText}>Remove</Text>
                          </Pressable>
                        </View>
                      </View>
                      {item.photoUri ? (
                        <Image
                          style={[styles.itemThumbnail, compactCardLayoutEnabled ? styles.itemThumbnailCompact : null]}
                          source={{ uri: item.photoUri }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.itemThumbnailPlaceholder,
                            compactCardLayoutEnabled ? styles.itemThumbnailCompact : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.itemThumbnailPlaceholderText,
                              compactCardLayoutEnabled ? styles.itemThumbnailPlaceholderTextCompact : null,
                            ]}
                          >
                            No Photo
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            : null}

          <Link href="/settings" asChild>
            <Pressable style={styles.settingsButton}>
              <Text style={styles.settingsButtonText}>Settings</Text>
            </Pressable>
          </Link>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Design.backgroundMain },
  content: {
    paddingHorizontal: Design.screenPaddingHorizontal,
    paddingBottom: Design.screenPaddingBottom,
    paddingTop: Design.spaceXl,
  },
  heroSection: {
    marginBottom: Design.spaceLg,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Design.textPrimary,
    textAlign: 'center',
    marginBottom: Design.spaceXs + 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: Design.accent,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: Design.spaceMd,
  },
  description: {
    fontSize: 15,
    color: Design.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Design.accent,
    borderRadius: Design.radiusButton,
    minHeight: Design.buttonHeight,
    paddingVertical: Design.spaceMd,
    paddingHorizontal: Design.spaceLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCta: {
    marginBottom: Design.spaceXl,
  },
  primaryButtonText: {
    color: Design.textOnDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Design.textPrimary,
    marginBottom: Design.spaceMd,
  },
  loadingCard: {
    backgroundColor: Design.backgroundCard,
    borderRadius: Design.radiusCard,
    padding: Design.spaceLg,
    marginBottom: Design.spaceMd,
    alignItems: 'center',
    gap: Design.spaceSm,
    ...Design.shadowCard,
  },
  errorCard: {
    backgroundColor: Design.backgroundCard,
    borderRadius: Design.radiusCard,
    padding: Design.spaceLg,
    marginBottom: Design.spaceMd,
    borderWidth: 1,
    borderColor: '#F2B8B5',
    gap: Design.spaceSm,
  },
  errorText: {
    color: Design.statusUrgent,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'flex-start',
    minHeight: Design.buttonHeightCompact,
    paddingHorizontal: Design.spaceMd,
    borderRadius: Design.radiusButton,
    borderWidth: 1,
    borderColor: Design.statusUrgent,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: Design.statusUrgent,
    fontWeight: '700',
    fontSize: 13,
  },
  helperText: {
    color: Design.textSecondary,
    marginBottom: 0,
  },
  permissionChecking: {
    alignItems: 'center',
    gap: Design.spaceMd,
    paddingVertical: 32,
  },
  permissionCard: {
    backgroundColor: Design.backgroundCard,
    borderRadius: Design.radiusCard,
    borderWidth: 1,
    borderColor: Design.borderLight,
    padding: Design.spaceLg,
    gap: Design.spaceMd,
    ...Design.shadowCard,
  },
  permissionText: {
    fontSize: 15,
    color: Design.textPrimary,
    textAlign: 'center',
  },
  cameraSection: {
    gap: Design.spaceMd,
  },
  cameraPreview: {
    height: 320,
    overflow: 'hidden',
    borderRadius: Design.radiusCard,
    borderWidth: 1,
    borderColor: Design.borderLight,
  },
  cameraView: {
    flex: 1,
  },
  cameraInitializingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Design.spaceSm,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    borderRadius: Design.radiusButton,
    borderWidth: 1,
    borderColor: Design.borderLight,
    backgroundColor: Design.backgroundCard,
    minHeight: Design.buttonHeight,
    paddingVertical: Design.spaceMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Design.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  cameraFeedback: {
    marginTop: Design.spaceLg,
    gap: Design.spaceSm,
  },
  cameraStatusText: {
    fontSize: 15,
    color: Design.textPrimary,
  },
  emptyState: {
    backgroundColor: Design.backgroundCard,
    borderRadius: Design.radiusCard,
    padding: Design.spaceLg,
    marginBottom: Design.spaceMd,
    ...Design.shadowCard,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Design.textPrimary,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 14,
    color: Design.textSecondary,
    lineHeight: 20,
  },
  itemCard: {
    backgroundColor: Design.backgroundCard,
    padding: Design.spaceLg,
    borderRadius: Design.radiusCard,
    marginBottom: Design.spaceMd,
    ...Design.shadowCard,
  },
  itemCardCompact: {
    paddingVertical: Design.spaceMd,
    paddingHorizontal: Design.spaceMd,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Design.spaceMd,
  },
  itemRowCompact: {
    gap: Design.spaceSm,
  },
  itemMain: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Design.textPrimary,
    marginBottom: 4,
  },
  itemNameCompact: {
    fontSize: 15,
    marginBottom: 2,
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemStatusCompact: {
    fontSize: 13,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: Design.textSecondary,
    marginBottom: 3,
  },
  itemMetaCompact: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemActions: {
    marginTop: Design.spaceSm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Design.spaceSm,
  },
  itemActionsCompact: {
    marginTop: Design.spaceXs,
    gap: Design.spaceXs,
  },
  compactActionButton: {
    minHeight: 32,
    paddingHorizontal: Design.spaceSm,
    paddingVertical: 6,
  },
  photoButton: {
    backgroundColor: Design.accent,
    borderRadius: Design.radiusButton,
    minHeight: Design.buttonHeightCompact,
    paddingHorizontal: Design.spaceMd,
    paddingVertical: Design.spaceSm,
    justifyContent: 'center',
  },
  photoButtonText: {
    color: Design.textOnDark,
    fontSize: 13,
    fontWeight: '700',
  },
  itemThumbnail: {
    width: Design.thumbnailSize,
    height: Design.thumbnailSize,
    borderRadius: Design.radiusCard,
    borderWidth: 1,
    borderColor: Design.borderLight,
    backgroundColor: Design.backgroundMuted,
    marginTop: Design.spaceXs,
  },
  itemThumbnailCompact: {
    width: 62,
    height: 62,
    marginTop: 0,
  },
  itemThumbnailPlaceholder: {
    width: Design.thumbnailSize,
    height: Design.thumbnailSize,
    borderRadius: Design.radiusCard,
    borderWidth: 1,
    borderColor: Design.borderLight,
    borderStyle: 'dashed',
    backgroundColor: Design.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Design.spaceXs,
  },
  itemThumbnailPlaceholderText: {
    fontSize: 11,
    color: Design.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  itemThumbnailPlaceholderTextCompact: {
    fontSize: 10,
  },
  statusUrgent: { color: Design.statusUrgent },
  statusSoon: { color: Design.statusSoon },
  statusOk: { color: Design.statusOk },
  deleteButton: {
    backgroundColor: Design.backgroundMuted,
    borderWidth: 1,
    borderColor: Design.borderLight,
    borderRadius: Design.radiusButton,
    minHeight: Design.buttonHeightCompact,
    paddingHorizontal: Design.spaceMd,
    paddingVertical: Design.spaceSm,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: Design.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  settingsButton: {
    marginTop: Design.spaceXl + Design.spaceXs,
    paddingVertical: 14,
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Design.textSecondary,
  },
});
