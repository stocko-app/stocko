import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from "react-native";
import { stockoTheme } from "../theme/stocko";

export function BootScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator color={stockoTheme.colors.gold400} />
      <Text style={styles.text}>A preparar Stocko...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: stockoTheme.colors.navy950,
  },
  text: {
    color: stockoTheme.colors.slate300,
    fontSize: 14,
  },
});

