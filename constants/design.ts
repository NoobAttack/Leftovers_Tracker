/**
 * Design system based on app layout design
 */

export const Design = {
	// Backgrounds
	backgroundMain: '#F8F8F8',
	backgroundCard: '#FFFFFF',
	backgroundHeaderFooter: '#1A1A1A',

	// Text
	textPrimary: '#2F3642',
	textSecondary: '#6C7A89',
	textOnDark: '#FFFFFF',
	textInactive: '#BDC3C7',

	// Accent (orange/peach)
	accent: '#E7884A',
	accentPrice: '#FF9800',

	// Status (expiration)
	statusUrgent: '#E53935',
	statusSoon: '#E8A317',
	statusOk: '#2E7D32',

	// UI
	borderLight: '#E0E0E0',
	shadowCard: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	radiusCard: 10,
	radiusButton: 8,
	headerHeight: 56,
	tabBarHeight: 64,
} as const;
