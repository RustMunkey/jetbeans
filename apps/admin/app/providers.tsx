"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AccentThemeProvider } from "@/components/accent-theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			storageKey="jetbeans-theme"
		>
			<AccentThemeProvider>
				{children}
			</AccentThemeProvider>
			<Toaster />
		</ThemeProvider>
	);
}
