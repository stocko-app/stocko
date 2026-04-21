import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/store/auth-context";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
