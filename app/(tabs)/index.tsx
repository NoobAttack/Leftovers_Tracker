import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Design } from '@/constants/design';

export default function HomeScreen() {
	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			{/* Branding */}
			<Text style={styles.title}>Leftovers Tracker</Text>
			<Text style={styles.tagline}>KEEP YOUR FRIDGE CLEAN.</Text>
			<Text style={styles.description}>
				Track what’s in your fridge and see what’s expiring soon so nothing goes
				to waste.
			</Text>

			{/* Expiring Soon */}
			<Text style={styles.sectionTitle}>🔥 Expiring Soon</Text>

			<View style={styles.itemCard}>
				<Text style={styles.itemName}>🥛 Milk</Text>
				<Text style={[styles.itemStatus, styles.statusUrgent]}>
					Expires Today
				</Text>
			</View>
			<View style={styles.itemCard}>
				<Text style={styles.itemName}>🍎 Apples</Text>
				<Text style={[styles.itemStatus, styles.statusSoon]}>
					Expires in 2 Days
				</Text>
			</View>
			<View style={styles.itemCard}>
				<Text style={styles.itemName}>🍕 Pizza</Text>
				<Text style={[styles.itemStatus, styles.statusOk]}>
					Expires in 5 Days
				</Text>
			</View>

			{/* Settings link */}
			<Link href='/settings' asChild>
				<Pressable style={styles.settingsButton}>
					<Text style={styles.settingsButtonText}>⚙️ Settings</Text>
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
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: Design.textPrimary,
		marginBottom: 12,
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
	},
	statusUrgent: { color: Design.statusUrgent },
	statusSoon: { color: Design.statusSoon },
	statusOk: { color: Design.statusOk },
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
