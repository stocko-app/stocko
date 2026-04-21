import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { stockoTheme } from "../theme/stocko";

export function RankingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Rankings</Text>
        <Text style={styles.subtitle}>Top global e ligas privadas serão ligados no próximo passo.</Text>
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
  subtitle: { color: stockoTheme.colors.slate300, fontSize: 14, lineHeight: 20 },
});

