import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextStyle, View } from 'react-native';
import { Design } from '@/constants/design';
import { getLeftoverItems, removeLeftoverItem } from '@/services/leftoverStorage';
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
  const [items, setItems] = useState<LeftoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
  }, [items]);

  // Reload items whenever user comes back to this tab.
  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const loadedItems = await getLeftoverItems();
      setItems(loadedItems);
    } catch {
      setErrorMessage('Could not load your saved leftovers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems])
  );

  // Delete from storage, then update list on screen.
  async function handleDelete(itemId: string) {
    try {
      await removeLeftoverItem(itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch {
      setErrorMessage('Could not remove that item. Please try again.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Leftovers Tracker</Text>
      <Text style={styles.tagline}>KEEP YOUR FRIDGE CLEAN.</Text>
      <Text style={styles.description}>
        Track what is in your fridge and see what is expiring soon so nothing goes to waste.
      </Text>

      <Link href="/add-item" asChild>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>+ Add Leftover</Text>
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>Expiring Soon</Text>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {isLoading ? <Text style={styles.helperText}>Loading your leftovers...</Text> : null}

      {!isLoading && sortedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No leftovers yet</Text>
          <Text style={styles.emptyDescription}>
            Add your first item and we will highlight when it is close to expiring.
          </Text>
        </View>
      ) : null}

      {!isLoading
        ? sortedItems.map((item) => {
            const status = getExpiryStatus(item.expiryDate);
            const metadata = getMetaLines(item);
            return (
              <View style={styles.itemCard} key={item.id}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={[styles.itemStatus, getStatusStyle(status.tone)]}>{status.label}</Text>
                {metadata.map((line) => (
                  <Text style={styles.itemMeta} key={`${item.id}-${line}`}>
                    {line}
                  </Text>
                ))}
                <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteButtonText}>Remove</Text>
                </Pressable>
              </View>
            );
          })
        : null}

      <Link href="/settings" asChild>
        <Pressable style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>Settings</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Design.backgroundMain },
  content: { padding: 20, paddingBottom: 32 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Design.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: Design.accent,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Design.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: Design.accent,
    borderRadius: Design.radiusButton,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 12,
  },
  errorText: {
    color: Design.statusUrgent,
    fontWeight: '600',
    marginBottom: 10,
  },
  helperText: {
    color: Design.textSecondary,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: Design.backgroundCard,
    borderRadius: Design.radiusCard,
    padding: 16,
    marginBottom: 12,
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
    padding: 16,
    borderRadius: Design.radiusCard,
    marginBottom: 12,
    ...Design.shadowCard,
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Design.textPrimary,
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemMeta: {
    fontSize: 13,
    color: Design.textSecondary,
    marginBottom: 3,
  },
  statusUrgent: { color: Design.statusUrgent },
  statusSoon: { color: Design.statusSoon },
  statusOk: { color: Design.statusOk },
  deleteButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: Design.backgroundMain,
    borderWidth: 1,
    borderColor: Design.borderLight,
    borderRadius: Design.radiusButton,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: Design.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  settingsButton: {
    marginTop: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Design.textSecondary,
  },
});
