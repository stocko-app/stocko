import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { stockoTheme } from "../theme/stocko";
import { useAuth } from "../store/auth-context";

export function HomeScreen() {
  const { identity } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Bem-vindo, {identity ?? "trader"}.</Text>
        <Text style={styles.note}>No próximo passo vamos ligar este ecrã aos dados semanais da API.</Text>
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
    gap: 8,
  },
  title: { fontSize: 24, fontWeight: "800", color: stockoTheme.colors.slate100 },
  subtitle: { color: stockoTheme.colors.slate300, fontSize: 15 },
  note: { color: stockoTheme.colors.slate500, fontSize: 13, marginTop: 4 },
});

