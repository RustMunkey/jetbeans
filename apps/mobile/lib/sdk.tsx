import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { JetBeans } from "@jetbeans/sdk"

const STOREFRONT_API_KEY = process.env.EXPO_PUBLIC_STOREFRONT_API_KEY || ""
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://app.jetbeans.cafe"

type SDKContextType = {
  client: JetBeans | null
  isReady: boolean
}

const SDKContext = createContext<SDKContextType>({ client: null, isReady: false })

export function SDKProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<SDKContextType>({ client: null, isReady: false })

  useEffect(() => {
    if (!STOREFRONT_API_KEY || !STOREFRONT_API_KEY.startsWith("sf_")) {
      setCtx({ client: null, isReady: true })
      return
    }
    try {
      const c = new JetBeans({
        apiKey: STOREFRONT_API_KEY,
        baseUrl: API_BASE_URL,
      })
      setCtx({ client: c, isReady: true })
    } catch {
      setCtx({ client: null, isReady: true })
    }
  }, [])

  return <SDKContext.Provider value={ctx}>{children}</SDKContext.Provider>
}

export function useSDK() {
  return useContext(SDKContext)
}
