import { Stack } from 'expo-router'

export default function TaskLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Completely hide from tab bar
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          tabBarStyle: { display: 'none' }, // Ensure this route is hidden
        }}
      />
    </Stack>
  )
}
