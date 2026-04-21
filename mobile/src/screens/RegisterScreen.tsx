import { useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/types";
import { register } from "../features/auth/auth-service";
import { useAuth } from "../store/auth-context";
import { stockoTheme } from "../theme/stocko";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      await signIn(response.accessToken, username.trim() || email.trim());
    } catch (e) {
      setError((e as Error).message || "Erro no registo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Registo</Text>
        <Text style={styles.subtitle}>Cria conta e começa a jogar já.</Text>

        <TextInput value={fullName} onChangeText={setFullName} placeholder="Nome completo" placeholderTextColor={stockoTheme.colors.slate500} style={styles.input} />
        <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Username" placeholderTextColor={stockoTheme.colors.slate500} style={styles.input} />
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Email" placeholderTextColor={stockoTheme.colors.slate500} style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor={stockoTheme.colors.slate500} style={styles.input} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primary} disabled={loading || !fullName || !username || !email || !password} onPress={onRegister}>
          {loading ? <ActivityIndicator color={stockoTheme.colors.navy950} /> : <Text style={styles.primaryText}>Criar conta</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Já tens conta? Entrar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: stockoTheme.colors.navy950, justifyContent: "center", padding: 20 },
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
  primary: { marginTop: 4, backgroundColor: stockoTheme.colors.gold500, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  primaryText: { color: stockoTheme.colors.navy950, fontWeight: "800" },
  link: { textAlign: "center", color: stockoTheme.colors.gold400, marginTop: 8 },
  error: { color: stockoTheme.colors.danger, fontSize: 13 },
});

