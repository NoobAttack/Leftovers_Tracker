import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Design } from '@/constants/design';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Design.backgroundHeaderFooter },
        headerTintColor: Design.textOnDark,
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        tabBarStyle: { backgroundColor: Design.backgroundHeaderFooter },
        tabBarActiveTintColor: Design.textOnDark,
        tabBarInactiveTintColor: Design.textInactive,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-item"
        options={{
          title: 'Add Item',
          tabBarLabel: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="add-circle" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
