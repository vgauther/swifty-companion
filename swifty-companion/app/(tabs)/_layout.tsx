// app/tabs/_layout.tsx
import { Stack } from "expo-router";

export default function TabsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,          // on affiche la barre native
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: "#000", // couleur texte + flèche
                headerTitleStyle: { fontWeight: "600" },
            }}
        />
    );
}
