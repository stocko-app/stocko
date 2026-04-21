import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BootScreen } from "../screens/BootScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PicksScreen } from "../screens/PicksScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RankingsScreen } from "../screens/RankingsScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { useAuth } from "../store/auth-context";
import { stockoTheme } from "../theme/stocko";
import { AppTabParamList, AuthStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

function AuthNavigator() {
  const { onboardingSeen } = useAuth();

  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingSeen ? <AuthStack.Screen name="Onboarding" component={OnboardingScreen} /> : null}
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: stockoTheme.colors.gold400,
        tabBarInactiveTintColor: stockoTheme.colors.slate500,
        tabBarStyle: {
          backgroundColor: stockoTheme.colors.navy900,
          borderTopColor: "rgba(255,255,255,0.06)",
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Picks" component={PicksScreen} />
      <Tab.Screen name="Rankings" component={RankingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { bootstrapping, isAuthenticated } = useAuth();

  if (bootstrapping) {
    return <BootScreen />;
  }

  const theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: stockoTheme.colors.navy950,
      card: stockoTheme.colors.navy900,
      text: stockoTheme.colors.slate100,
      primary: stockoTheme.colors.gold400,
      border: "rgba(255,255,255,0.06)",
    },
  };

  return <NavigationContainer theme={theme}>{isAuthenticated ? <AppTabs /> : <AuthNavigator />}</NavigationContainer>;
}

