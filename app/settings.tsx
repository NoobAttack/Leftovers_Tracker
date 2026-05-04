import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Design } from '@/constants/design';
import { getCompactCardLayoutEnabled, setCompactCardLayoutEnabled } from '@/services/preferencesStorage';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [compactViewEnabled, setCompactViewEnabled] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const compactEnabled = await getCompactCardLayoutEnabled();
        setCompactViewEnabled(compactEnabled);
      } catch {
        // Keep default false if read fails.
      }
    }

    void loadPreferences();
  }, []);

  async function handleCompactViewChange(nextValue: boolean) {
    setCompactViewEnabled(nextValue);
    try {
      await setCompactCardLayoutEnabled(nextValue);
    } catch {
      // Keep UI responsive even if storage write fails.
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Personalize your leftovers tracking experience.</Text>

        <View style={styles.card}>
          <Text style={styles.settingText}>Enable Expiration Alerts</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: Design.borderLight, true: Design.accent }}
            thumbColor={Design.textOnDark}
          />
        </View>
        <View style={styles.card}>
          <Text style={styles.settingText}>Compact Card Layout</Text>
          <Switch
            value={compactViewEnabled}
            onValueChange={handleCompactViewChange}
            trackColor={{ false: Design.borderLight, true: Design.accent }}
            thumbColor={Design.textOnDark}
          />
        </View>

        <Link href="/" asChild>
          <Pressable style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back to Fridge</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Design.backgroundMain },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Design.backgroundHeaderFooter,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: { minWidth: 60 },
  backText: { color: Design.textOnDark, fontSize: 16, fontWeight: '600' },
  headerTitle: {
    color: Design.textOnDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  subtitle: {
    fontSize: 14,
    color: Design.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Design.backgroundCard,
    padding: 16,
    borderRadius: Design.radiusCard,
    marginBottom: 12,
    ...Design.shadowCard,
  },
  settingText: { fontSize: 16, fontWeight: '500', color: Design.textPrimary },
  backLink: { marginTop: 24, alignItems: 'center' },
  backLinkText: {
    color: Design.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
