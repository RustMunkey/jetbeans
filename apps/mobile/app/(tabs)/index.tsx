import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useSDK } from "@/lib/sdk"
import { useAuth } from "@/lib/auth"

export default function DashboardScreen() {
  const { client, isReady } = useSDK()
  const { isLoading, isAuthenticated } = useAuth()

  if (!isReady || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#654321" />
      </View>
    )
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Setup Required</Text>
          <Text style={styles.subtitle}>
            Set EXPO_PUBLIC_STOREFRONT_API_KEY in your environment to connect to your JetBeans store.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>JetBeans</Text>
        <Text style={styles.subtitle}>
          {isAuthenticated ? "Welcome back!" : "Welcome to your store"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#654321",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
})
