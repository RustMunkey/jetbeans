import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SDKProvider } from "@/lib/sdk"
import { AuthProvider } from "@/lib/auth"

export default function RootLayout() {
  return (
    <SDKProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </AuthProvider>
    </SDKProvider>
  )
}
