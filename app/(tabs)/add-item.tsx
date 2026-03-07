import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Design } from '@/constants/design';

export default function AddItemScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Our Fridge</Text>
      <Text style={styles.subtitle}>Add items so you know when they expire.</Text>
      <View style={styles.divider} />

      <View style={styles.card}>
        <Text style={styles.label}>What is the name of the item?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Pasta, Milk, Apples"
          placeholderTextColor={Design.textSecondary}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>When is it going to expire?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 3 days, 10/24/2026"
          placeholderTextColor={Design.textSecondary}
        />
      </View>

      <Link href="/" asChild>
        <Pressable style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Item</Text>
        </Pressable>
      </Link>

      <Link href="/" asChild>
        <Pressable style={styles.cancelPressable}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Design.backgroundMain },
  content: { padding: 20, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Design.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Design.textSecondary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Design.borderLight,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Design.backgroundCard,
    padding: 16,
    borderRadius: Design.radiusCard,
    marginBottom: 16,
    ...Design.shadowCard,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Design.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Design.backgroundMain,
    borderWidth: 1,
    borderColor: Design.borderLight,
    padding: 14,
    borderRadius: Design.radiusButton,
    fontSize: 16,
    color: Design.textPrimary,
  },
  saveButton: {
    backgroundColor: Design.accent,
    padding: 16,
    borderRadius: Design.radiusButton,
    marginTop: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Design.textOnDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelPressable: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Design.textSecondary,
  },
});
