"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { useSidebar } from "@/components/ui/sidebar"
import { useCommandMenu } from "@/components/command-menu"

// Platform detection
const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0

// Modifier key display
const MOD = isMac ? "⌘" : "Ctrl"
const ALT = isMac ? "⌥" : "Alt"
const SHIFT = "⇧"

export type Shortcut = {
	id: string
	name: string
	description: string
	keys: string[] // e.g., ["meta", "k"] or ["meta", "shift", "p"]
	action: () => void
	category: "navigation" | "actions" | "view" | "editing"
	global?: boolean // Works everywhere, even in inputs
}

type KeyboardShortcutsContextType = {
	shortcuts: Shortcut[]
	registerShortcut: (shortcut: Shortcut) => void
	unregisterShortcut: (id: string) => void
	showHelp: () => void
	hideHelp: () => void
	isHelpOpen: boolean
}

const KeyboardShortcutsContext = React.createContext<KeyboardShortcutsContextType | null>(null)

export function useKeyboardShortcuts() {
	const context = React.useContext(KeyboardShortcutsContext)
	if (!context) {
		throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider")
	}
	return context
}

// Format keys for display
function formatKeys(keys: string[]): string {
	return keys
		.map((key) => {
			switch (key) {
				case "meta":
					return MOD
				case "alt":
					return ALT
				case "shift":
					return SHIFT
				case "enter":
					return "↵"
				case "escape":
					return "Esc"
				case "arrowup":
					return "↑"
				case "arrowdown":
					return "↓"
				case "arrowleft":
					return "←"
				case "arrowright":
					return "→"
				case "backspace":
					return "⌫"
				case "delete":
					return "Del"
				case "tab":
					return "Tab"
				case "space":
					return "Space"
				default:
					return key.toUpperCase()
			}
		})
		.join(" + ")
}

// Check if keys match event
function matchesEvent(keys: string[], e: KeyboardEvent): boolean {
	// Guard against malformed keyboard events
	if (!e.key) return false

	const pressedKeys: string[] = []

	if (e.metaKey || e.ctrlKey) pressedKeys.push("meta")
	if (e.altKey) pressedKeys.push("alt")
	if (e.shiftKey) pressedKeys.push("shift")

	const key = e.key.toLowerCase()
	if (!["meta", "control", "alt", "shift"].includes(key)) {
		pressedKeys.push(key)
	}

	if (pressedKeys.length !== keys.length) return false

	return keys.every((k) => pressedKeys.includes(k))
}

// Check if we're in an input element
function isInputElement(target: EventTarget | null): boolean {
	if (!target) return false
	const element = target as HTMLElement
	const tagName = element.tagName?.toLowerCase()
	return (
		tagName === "input" ||
		tagName === "textarea" ||
		tagName === "select" ||
		element.isContentEditable
	)
}

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
	const [shortcuts, setShortcuts] = React.useState<Shortcut[]>([])
	const [isHelpOpen, setIsHelpOpen] = React.useState(false)
	const router = useRouter()
	const { setTheme } = useTheme()
	const { toggleSidebar } = useSidebar()
	const { open: openCommandMenu } = useCommandMenu()

	// Use refs to avoid infinite loops in useEffect
	const routerRef = React.useRef(router)
	const setThemeRef = React.useRef(setTheme)
	const toggleSidebarRef = React.useRef(toggleSidebar)
	const openCommandMenuRef = React.useRef(openCommandMenu)

	// Keep refs up to date
	React.useEffect(() => {
		routerRef.current = router
		setThemeRef.current = setTheme
		toggleSidebarRef.current = toggleSidebar
		openCommandMenuRef.current = openCommandMenu
	})

	// Register default shortcuts (only once)
	React.useEffect(() => {
		const defaultShortcuts: Shortcut[] = [
			// Navigation
			{
				id: "go-home",
				name: "Go to Dashboard",
				description: "Navigate to the dashboard",
				keys: ["meta", "shift", "h"],
				action: () => routerRef.current.push("/"),
				category: "navigation",
			},
			{
				id: "go-orders",
				name: "Go to Orders",
				description: "Navigate to orders",
				keys: ["meta", "shift", "o"],
				action: () => routerRef.current.push("/orders"),
				category: "navigation",
			},
			{
				id: "go-products",
				name: "Go to Products",
				description: "Navigate to products",
				keys: ["meta", "shift", "p"],
				action: () => routerRef.current.push("/products"),
				category: "navigation",
			},
			{
				id: "go-customers",
				name: "Go to Customers",
				description: "Navigate to customers",
				keys: ["meta", "shift", "c"],
				action: () => routerRef.current.push("/customers"),
				category: "navigation",
			},
			{
				id: "go-analytics",
				name: "Go to Analytics",
				description: "Navigate to analytics",
				keys: ["meta", "shift", "a"],
				action: () => routerRef.current.push("/analytics"),
				category: "navigation",
			},
			{
				id: "go-settings",
				name: "Go to Settings",
				description: "Navigate to settings",
				keys: ["meta", ","],
				action: () => routerRef.current.push("/settings"),
				category: "navigation",
			},
			{
				id: "go-messages",
				name: "Go to Messages",
				description: "Navigate to messages",
				keys: ["meta", "shift", "m"],
				action: () => routerRef.current.push("/notifications/messages"),
				category: "navigation",
			},
			{
				id: "go-back",
				name: "Go Back",
				description: "Navigate to previous page",
				keys: ["meta", "["],
				action: () => routerRef.current.back(),
				category: "navigation",
			},
			{
				id: "go-forward",
				name: "Go Forward",
				description: "Navigate to next page",
				keys: ["meta", "]"],
				action: () => routerRef.current.forward(),
				category: "navigation",
			},

			// Actions
			{
				id: "search",
				name: "Search",
				description: "Open command palette",
				keys: ["meta", "k"],
				action: () => openCommandMenuRef.current(),
				category: "actions",
				global: true,
			},
			{
				id: "new-product",
				name: "New Product",
				description: "Create a new product",
				keys: ["meta", "shift", "n"],
				action: () => routerRef.current.push("/products?new=true"),
				category: "actions",
			},
			{
				id: "new-order",
				name: "New Order",
				description: "Create a new order",
				keys: ["alt", "shift", "o"],
				action: () => routerRef.current.push("/orders?new=true"),
				category: "actions",
			},

			// View
			{
				id: "toggle-sidebar",
				name: "Toggle Sidebar",
				description: "Show or hide the sidebar",
				keys: ["meta", "b"],
				action: () => toggleSidebarRef.current(),
				category: "view",
				global: true,
			},
			{
				id: "toggle-theme",
				name: "Toggle Theme",
				description: "Switch between light and dark mode",
				keys: ["meta", "shift", "l"],
				action: () => {
					const html = document.documentElement
					const current = html.classList.contains("dark") ? "dark" : "light"
					setThemeRef.current(current === "dark" ? "light" : "dark")
				},
				category: "view",
			},
			{
				id: "show-shortcuts",
				name: "Show Shortcuts",
				description: "Display keyboard shortcuts help",
				keys: ["?"],
				action: () => setIsHelpOpen(true),
				category: "view",
			},

			// Editing
			{
				id: "save",
				name: "Save",
				description: "Save current form",
				keys: ["meta", "s"],
				action: () => {
					// Dispatch custom event for forms to handle
					document.dispatchEvent(new CustomEvent("keyboard-save"))
				},
				category: "editing",
				global: true,
			},
			{
				id: "escape",
				name: "Close / Cancel",
				description: "Close modal or cancel action",
				keys: ["escape"],
				action: () => {
					document.dispatchEvent(new CustomEvent("keyboard-escape"))
				},
				category: "editing",
				global: true,
			},
		]

		setShortcuts(defaultShortcuts)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Global keyboard listener
	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip if in help dialog and pressing something other than escape
			if (isHelpOpen && e.key !== "Escape") return

			// Handle ? key specially (needs shift detection)
			if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
				if (!isInputElement(e.target)) {
					e.preventDefault()
					setIsHelpOpen(true)
					return
				}
			}

			for (const shortcut of shortcuts) {
				if (matchesEvent(shortcut.keys, e)) {
					// Skip non-global shortcuts when in input
					if (!shortcut.global && isInputElement(e.target)) {
						continue
					}

					e.preventDefault()
					shortcut.action()
					return
				}
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [shortcuts, isHelpOpen])

	const registerShortcut = React.useCallback((shortcut: Shortcut) => {
		setShortcuts((prev) => [...prev.filter((s) => s.id !== shortcut.id), shortcut])
	}, [])

	const unregisterShortcut = React.useCallback((id: string) => {
		setShortcuts((prev) => prev.filter((s) => s.id !== id))
	}, [])

	const showHelp = React.useCallback(() => setIsHelpOpen(true), [])
	const hideHelp = React.useCallback(() => setIsHelpOpen(false), [])

	const categories = React.useMemo(() => {
		const nav = shortcuts.filter((s) => s.category === "navigation")
		const actions = shortcuts.filter((s) => s.category === "actions")
		const view = shortcuts.filter((s) => s.category === "view")
		const editing = shortcuts.filter((s) => s.category === "editing")
		return { nav, actions, view, editing }
	}, [shortcuts])

	return (
		<KeyboardShortcutsContext.Provider
			value={{
				shortcuts,
				registerShortcut,
				unregisterShortcut,
				showHelp,
				hideHelp,
				isHelpOpen,
			}}
		>
			{children}
			<Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Keyboard Shortcuts</DialogTitle>
					</DialogHeader>
					<div className="grid gap-6 py-4">
						{categories.nav.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-muted-foreground mb-3">Navigation</h3>
								<div className="space-y-2">
									{categories.nav.map((s) => (
										<ShortcutRow key={s.id} shortcut={s} />
									))}
								</div>
							</div>
						)}
						{categories.actions.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-muted-foreground mb-3">Actions</h3>
								<div className="space-y-2">
									{categories.actions.map((s) => (
										<ShortcutRow key={s.id} shortcut={s} />
									))}
								</div>
							</div>
						)}
						{categories.view.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-muted-foreground mb-3">View</h3>
								<div className="space-y-2">
									{categories.view.map((s) => (
										<ShortcutRow key={s.id} shortcut={s} />
									))}
								</div>
							</div>
						)}
						{categories.editing.length > 0 && (
							<div>
								<h3 className="text-sm font-semibold text-muted-foreground mb-3">Editing</h3>
								<div className="space-y-2">
									{categories.editing.map((s) => (
										<ShortcutRow key={s.id} shortcut={s} />
									))}
								</div>
							</div>
						)}
					</div>
					<div className="text-xs text-muted-foreground border-t pt-4">
						Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd> to close
					</div>
				</DialogContent>
			</Dialog>
		</KeyboardShortcutsContext.Provider>
	)
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
	return (
		<div className="flex items-center justify-between py-1.5">
			<div>
				<p className="text-sm font-medium">{shortcut.name}</p>
				<p className="text-xs text-muted-foreground">{shortcut.description}</p>
			</div>
			<kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
				{formatKeys(shortcut.keys)}
			</kbd>
		</div>
	)
}
