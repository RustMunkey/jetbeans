"use client"

import * as React from "react"

export type ToolbarWidget =
	| "calculator"
	| "music"
	| "notes"
	| "stats"
	| "converter"
	| null

type ToolbarContextType = {
	isOpen: boolean
	activeWidget: ToolbarWidget
	openToolbar: () => void
	closeToolbar: () => void
	toggleToolbar: () => void
	setActiveWidget: (widget: ToolbarWidget) => void
	openWidget: (widget: ToolbarWidget) => void
}

const ToolbarContext = React.createContext<ToolbarContextType | null>(null)

export function useToolbar() {
	const context = React.useContext(ToolbarContext)
	if (!context) {
		throw new Error("useToolbar must be used within ToolbarProvider")
	}
	return context
}

export function ToolbarProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = React.useState(false)
	const [activeWidget, setActiveWidget] = React.useState<ToolbarWidget>(null)

	const openToolbar = React.useCallback(() => {
		setIsOpen(true)
	}, [])

	const closeToolbar = React.useCallback(() => {
		setIsOpen(false)
	}, [])

	const toggleToolbar = React.useCallback(() => {
		setIsOpen((prev) => !prev)
	}, [])

	const openWidget = React.useCallback((widget: ToolbarWidget) => {
		setActiveWidget(widget)
		setIsOpen(true)
	}, [])

	// Listen for events from the central keyboard shortcuts system
	React.useEffect(() => {
		const handleToggleToolbar = () => {
			toggleToolbar()
		}

		const handleOpenWidget = (e: CustomEvent<string>) => {
			const widget = e.detail as ToolbarWidget
			if (widget) {
				openWidget(widget)
			}
		}

		const handleEscape = () => {
			if (isOpen) {
				closeToolbar()
			}
		}

		window.addEventListener("toggle-toolbar", handleToggleToolbar)
		window.addEventListener("open-widget", handleOpenWidget as EventListener)
		window.addEventListener("keyboard-escape", handleEscape)

		return () => {
			window.removeEventListener("toggle-toolbar", handleToggleToolbar)
			window.removeEventListener("open-widget", handleOpenWidget as EventListener)
			window.removeEventListener("keyboard-escape", handleEscape)
		}
	}, [isOpen, toggleToolbar, closeToolbar, openWidget])

	return (
		<ToolbarContext.Provider
			value={{
				isOpen,
				activeWidget,
				openToolbar,
				closeToolbar,
				toggleToolbar,
				setActiveWidget,
				openWidget,
			}}
		>
			{children}
		</ToolbarContext.Provider>
	)
}
