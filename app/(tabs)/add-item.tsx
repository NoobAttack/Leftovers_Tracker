import { Design } from '@/constants/design';
import { addLeftoverItem } from '@/services/leftoverStorage';
import { lookupFoodFacts } from '@/services/openFoodFacts';
import { LeftoverApiDetails } from '@/types/leftover';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type EnrichmentResult = {
	apiDetails?: LeftoverApiDetails;
	notice?: string;
};

function isValidDateParts(year: number, month: number, day: number): boolean {
	const candidate = new Date(year, month - 1, day);
	return (
		!Number.isNaN(candidate.getTime()) &&
		candidate.getFullYear() === year &&
		candidate.getMonth() === month - 1 &&
		candidate.getDate() === day
	);
}

// Accept both date formats and store one consistent format.
function normalizeDateInput(raw: string): string | null {
	const value = raw.trim();
	if (!value) {
		return null;
	}

	const yyyyMmDdMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (yyyyMmDdMatch) {
		const [year, month, day] = yyyyMmDdMatch.slice(1).map(Number);
		return isValidDateParts(year, month, day) ? value : null;
	}

	const mmDdYyyyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
	if (!mmDdYyyyMatch) {
		return null;
	}

	const [month, day, year] = mmDdYyyyMatch.slice(1).map(Number);
	if (!isValidDateParts(year, month, day)) {
		return null;
	}

	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Try API data, but do not block saving if API fails.
async function enrichItemWithApi(name: string): Promise<EnrichmentResult> {
	try {
		const lookupResult = await lookupFoodFacts(name);
		if (!lookupResult) {
			return {
				notice: 'No API match found. Item saved with your entered details.',
			};
		}

		return { apiDetails: lookupResult };
	} catch {
		return {
			notice:
				'OpenFoodFacts is unavailable right now. Item saved without API details.',
		};
	}
}

export default function AddItemScreen() {
	const [name, setName] = useState('');
	const [expiryInput, setExpiryInput] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [apiNotice, setApiNotice] = useState<string | null>(null);

	async function handleSaveItem() {
		const trimmedName = name.trim();
		const normalizedExpiryDate = normalizeDateInput(expiryInput);
		setFormError(null);
		setApiNotice(null);

		// Basic checks first.
		if (!trimmedName) {
			setFormError('Please enter an item name.');
			return;
		}

		if (!normalizedExpiryDate) {
			setFormError('Use a valid expiration date: YYYY-MM-DD or MM/DD/YYYY.');
			return;
		}

		setIsSaving(true);

		// Optional API lookup.
		const enrichment = await enrichItemWithApi(trimmedName);
		setApiNotice(enrichment.notice ?? null);

		// Save item locally and go back home.
		try {
			await addLeftoverItem({
				id: Date.now().toString(),
				name: trimmedName,
				expiryDate: normalizedExpiryDate,
				createdAt: new Date().toISOString(),
				apiDetails: enrichment.apiDetails,
			});
      // Clear old values because tabs can stay mounted.
      setName('');
      setExpiryInput('');
			router.replace('/');
		} catch {
			setFormError('Could not save this item. Please try again.');
    } finally {
      // Re-enable button no matter what happened.
      setIsSaving(false);
		}
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<Text style={styles.sectionTitle}>Our Fridge</Text>
			<Text style={styles.subtitle}>
				Add items so you know when they expire.
			</Text>
			<View style={styles.divider} />

			<View style={styles.card}>
				<Text style={styles.label}>What is the name of the item?</Text>
				<TextInput
					style={styles.input}
					placeholder='e.g., Pasta, Milk, Apples'
					placeholderTextColor={Design.textSecondary}
					value={name}
					onChangeText={setName}
				/>
			</View>

			<View style={styles.card}>
				<Text style={styles.label}>When is it going to expire?</Text>
				<TextInput
					style={styles.input}
					placeholder='YYYY-MM-DD or MM/DD/YYYY'
					placeholderTextColor={Design.textSecondary}
					value={expiryInput}
					onChangeText={setExpiryInput}
				/>
			</View>

			{formError ? <Text style={styles.formError}>{formError}</Text> : null}
			{apiNotice ? <Text style={styles.apiNotice}>{apiNotice}</Text> : null}

			<Pressable
				style={styles.saveButton}
				onPress={handleSaveItem}
				disabled={isSaving}
			>
				{isSaving ? (
					<ActivityIndicator color={Design.textOnDark} />
				) : (
					<Text style={styles.saveButtonText}>Save Item</Text>
				)}
			</Pressable>

			<Pressable
				style={styles.cancelPressable}
				onPress={() => router.back()}
				disabled={isSaving}
			>
				<Text style={styles.cancelText}>Cancel</Text>
			</Pressable>
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
	formError: {
		color: Design.statusUrgent,
		marginTop: 4,
		marginBottom: 8,
		fontWeight: '600',
	},
	apiNotice: {
		color: Design.textSecondary,
		marginTop: 4,
		marginBottom: 8,
		fontWeight: '500',
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
