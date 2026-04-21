import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "stocko_token";
const IDENTITY_KEY = "stocko_identity";
const ONBOARDING_KEY = "stocko_onboarding_seen";

export async function saveSession(token: string, identity: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(IDENTITY_KEY, identity);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(IDENTITY_KEY);
}

export async function loadSession(): Promise<{ token: string | null; identity: string | null }> {
  const [token, identity] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(IDENTITY_KEY),
  ]);

  return { token, identity };
}

export async function loadOnboardingSeen(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return value === "1";
}

export async function markOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_KEY, "1");
}

