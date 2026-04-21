import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../store/auth-context";
import { stockoTheme } from "../theme/stocko";

export function ProfileScreen() {
  const { identity, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Sessão ativa: {identity ?? "—"}</Text>
        <Pressable style={styles.logoutButton} onPress={() => void signOut()}>
          <Text style={styles.logoutText}>Terminar sessão</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: stockoTheme.colors.navy950, padding: 16 },
  card: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(240, 180, 41, 0.14)",
    borderRadius: 16,
    backgroundColor: "rgba(13, 21, 48, 0.76)",
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 24, fontWeight: "800", color: stockoTheme.colors.slate100 },
  subtitle: { color: stockoTheme.colors.slate300, fontSize: 14 },
  logoutButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 12,
    borderColor: "rgba(239, 68, 68, 0.45)",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logoutText: { color: stockoTheme.colors.danger, fontWeight: "700" },
});

