// app/tabs/index.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput
} from "react-native";
import { getUserByLogin } from "../../services/ftApi";

export default function HomeScreen() {
  const [login, setLogin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSearch = async () => {
    const trimmed = login.trim();
    setError(null);

    if (!trimmed) {
      setError("Merci de saisir un login 42.");
      return;
    }

    try {
      setLoading(true);

      // On teste la connexion + l'existence du login
      await getUserByLogin(trimmed);

      setLoading(false);

      // Navigation vers la page de résultats
      router.push({
        pathname: "/(tabs)/result",
        params: { login: trimmed },
      });
    } catch (e: any) {
      console.log(e);
      setLoading(false);
      setError(e?.message || "Erreur lors de la récupération du user.");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg.png")}
      // style={styles.background}
      style={styles.container}
      resizeMode="cover"   // ou "contain", "stretch"
    >
      <Text style={styles.title}>Swifty Companion</Text>

      <Text style={styles.label}>Login 42</Text>
      <TextInput
        style={styles.input}
        placeholder="ex: vgauther"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          (pressed || loading) && styles.buttonPressed,
        ]}
        onPress={handleSearch}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>Rechercher</Text>
        )}
      </Pressable>
    </ImageBackground >

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    backgroundColor: "#ff0000",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 32,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#4b5563",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#000",
    marginBottom: 12,
    backgroundColor: "#fff"
  },
  error: {
    color: "#fca5a5",
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 16,
  },
});
