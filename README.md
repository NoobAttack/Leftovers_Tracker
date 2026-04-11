# Leftovers Tracker - Semester Project 3

This is my Semester Project 3 app built with Expo/React Native. It helps track leftovers so you can see what needs to be used soon.

## Features

- Multi-screen app using Expo Router
- Add leftovers with expiration dates
- AsyncStorage saves items between app restarts
- OpenFoodFacts API adds extra product info when available
- API failures are handled with fallback messages
- Styled Home, Add Item, and Settings screens

## Tech Stack

- Expo + React Native + TypeScript
- Expo Router
- AsyncStorage (`@react-native-async-storage/async-storage`)
- OpenFoodFacts public API

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npx expo start
```

3. Optional lint check:

```bash
npm run lint
```

## API Integration Details

- Service file: `services/openFoodFacts.ts`
- Endpoint: OpenFoodFacts search API
- Called when saving an item in `app/(tabs)/add-item.tsx`
- API data shows on Home cards in `app/(tabs)/index.tsx`
- If the API fails, the app still saves the item

## Required Project Preview

For submission, include at least one screenshot or short video showing:

- A styled screen
- API-backed item details on at least one saved card
- App functionality/navigation (if possible)

Quick way to capture preview:
1. Add an item (for example: "Milk", with a valid date).
2. Return to Home and verify the item card appears with any API details.
3. Capture the screen in Expo Go, emulator, or web preview.
