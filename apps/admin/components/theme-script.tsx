import { themePresets } from "./accent-theme-provider"

// Generate the blocking script that applies theme before paint
// This prevents flash of default theme colors
export function ThemeScript() {
	// Serialize theme presets to JSON for embedding in script
	const presetsJson = JSON.stringify(themePresets)

	const script = `
(function() {
	try {
		var presets = ${presetsJson};
		var savedAccent = localStorage.getItem("jetbeans-accent-theme") || "coffee";
		var savedTheme = localStorage.getItem("theme") || "system";

		// Determine if dark mode
		var isDark = savedTheme === "dark" ||
			(savedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

		var preset = presets[savedAccent];
		if (!preset) preset = presets.coffee;

		var colors = isDark ? preset.dark : preset.light;
		var root = document.documentElement;

		// Apply CSS variables
		root.style.setProperty("--background", colors.background);
		root.style.setProperty("--foreground", colors.foreground);
		root.style.setProperty("--card", colors.card);
		root.style.setProperty("--card-foreground", colors.cardForeground);
		root.style.setProperty("--popover", colors.popover);
		root.style.setProperty("--popover-foreground", colors.popoverForeground);
		root.style.setProperty("--primary", colors.primary);
		root.style.setProperty("--primary-foreground", colors.primaryForeground);
		root.style.setProperty("--secondary", colors.secondary);
		root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
		root.style.setProperty("--muted", colors.muted);
		root.style.setProperty("--muted-foreground", colors.mutedForeground);
		root.style.setProperty("--accent", colors.accent);
		root.style.setProperty("--accent-foreground", colors.accentForeground);
		root.style.setProperty("--border", colors.border);
		root.style.setProperty("--input", colors.input);
		root.style.setProperty("--ring", colors.ring);
		root.style.setProperty("--chart-1", colors.chart1);
		root.style.setProperty("--chart-2", colors.chart2);
		root.style.setProperty("--chart-3", colors.chart3);
		root.style.setProperty("--chart-4", colors.chart4);
		root.style.setProperty("--chart-5", colors.chart5);
		root.style.setProperty("--sidebar", colors.sidebar);
		root.style.setProperty("--sidebar-foreground", colors.sidebarForeground);
		root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
		root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground);
		root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
		root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
		root.style.setProperty("--sidebar-border", colors.sidebarBorder);
		root.style.setProperty("--sidebar-ring", colors.sidebarRing);
		root.style.setProperty("--stat-up", colors.statUp);
		root.style.setProperty("--stat-down", colors.statDown);

		// Generate heatmap colors
		var chart1Match = colors.chart1.match(/oklch\\(([0-9.]+)\\s+([0-9.]+)\\s+([0-9.]+)\\)/);
		if (chart1Match) {
			var c = parseFloat(chart1Match[2]);
			var h = parseFloat(chart1Match[3]);
			if (isDark) {
				root.style.setProperty("--heatmap-0", "oklch(0.18 " + (c * 0.15).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-1", "oklch(0.30 " + (c * 0.40).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-2", "oklch(0.42 " + (c * 0.65).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-3", "oklch(0.54 " + (c * 0.85).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-4", "oklch(0.66 " + (c * 1.00).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-5", "oklch(0.78 " + (c * 1.00).toFixed(3) + " " + h + ")");
			} else {
				root.style.setProperty("--heatmap-0", "oklch(0.94 " + (c * 0.15).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-1", "oklch(0.84 " + (c * 0.40).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-2", "oklch(0.72 " + (c * 0.65).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-3", "oklch(0.60 " + (c * 0.85).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-4", "oklch(0.50 " + (c * 1.00).toFixed(3) + " " + h + ")");
				root.style.setProperty("--heatmap-5", "oklch(0.40 " + (c * 1.00).toFixed(3) + " " + h + ")");
			}
		}
	} catch(e) {}
})();
`

	return (
		<script
			dangerouslySetInnerHTML={{ __html: script }}
			suppressHydrationWarning
		/>
	)
}
