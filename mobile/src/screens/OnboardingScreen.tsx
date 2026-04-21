import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { stockoTheme } from "../theme/stocko";
import { useAuth } from "../store/auth-context";

type Props = NativeStackScreenProps<AuthStackParamList, "Onboarding">;

export function OnboardingScreen({ navigation }: Props) {
  const { setOnboardingSeen } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Stocko</Text>
        <Text style={styles.subtitle}>Fantasy investing com dados reais de mercado.</Text>

        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Escolhe 5 picks por semana</Text>
          <Text style={styles.bullet}>• Activa capitão para duplicar pontos</Text>
          <Text style={styles.bullet}>• Sobe de tier todos os meses</Text>
        </View>

        <Pressable
          style={styles.primary}
          onPress={() => {
            setOnboardingSeen();
            navigation.replace("Login");
          }}
        >
          <Text style={styles.primaryText}>Começar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: stockoTheme.colors.navy950,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(13, 21, 48, 0.75)",
    borderColor: "rgba(240, 180, 41, 0.2)",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: stockoTheme.colors.gold400,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: stockoTheme.colors.slate300,
  },
  bulletList: {
    gap: 10,
  },
  bullet: {
    color: stockoTheme.colors.slate100,
    fontSize: 15,
  },
  primary: {
    marginTop: 6,
    backgroundColor: stockoTheme.colors.gold500,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryText: {
    color: stockoTheme.colors.navy950,
    fontWeight: "800",
    fontSize: 15,
  },
});

