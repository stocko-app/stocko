import { useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { checkUser, login } from "../features/auth/auth-service";
import { useAuth } from "../store/auth-context";
import { stockoTheme } from "../theme/stocko";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"identifier" | "password">("identifier");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onContinue = async () => {
    setLoading(true);
    setError("");
    try {
      const exists = await checkUser(identifier.trim());
      if (!exists) {
        setError("Conta não encontrada.");
      } else {
        setStep("password");
      }
    } catch (e) {
      setError((e as Error).message || "Erro ao validar utilizador.");
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await login(identifier.trim(), password);
      await signIn(result.accessToken, identifier.trim());
    } catch (e) {
      setError((e as Error).message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>Acede à tua conta Stocko.</Text>

        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          placeholder="Email ou username"
          placeholderTextColor={stockoTheme.colors.slate500}
          style={styles.input}
          editable={!loading}
        />

        {step === "password" ? (
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor={stockoTheme.colors.slate500}
            style={styles.input}
            editable={!loading}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={styles.primary}
          disabled={loading || !identifier || (step === "password" && !password)}
          onPress={step === "identifier" ? onContinue : onLogin}
        >
          {loading ? (
            <ActivityIndicator color={stockoTheme.colors.navy950} />
          ) : (
            <Text style={styles.primaryText}>{step === "identifier" ? "Continuar" : "Entrar"}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Ainda não tens conta? Regista-te</Text>
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(240, 180, 41, 0.15)",
    backgroundColor: "rgba(13, 21, 48, 0.76)",
    padding: 20,
    gap: 12,
  },
  title: { color: stockoTheme.colors.slate100, fontSize: 28, fontWeight: "800" },
  subtitle: { color: stockoTheme.colors.slate400, marginBottom: 8 },
  input: {
    backgroundColor: stockoTheme.colors.navy800,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: stockoTheme.colors.slate100,
  },
  primary: {
    marginTop: 4,
    backgroundColor: stockoTheme.colors.gold500,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryText: { color: stockoTheme.colors.navy950, fontWeight: "800" },
  link: { textAlign: "center", color: stockoTheme.colors.gold400, marginTop: 8 },
  error: { color: stockoTheme.colors.danger, fontSize: 13 },
});

