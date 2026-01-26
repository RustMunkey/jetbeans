"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	Calculator01Icon,
	MusicNote03Icon,
	Note01Icon,
	ChartHistogramIcon,
	ArrowDataTransferHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToolbar, type ToolbarWidget } from "./toolbar-provider"
import { cn } from "@/lib/utils"

const WIDGETS: {
	id: ToolbarWidget
	icon: typeof Calculator01Icon
	label: string
}[] = [
	{ id: "calculator", icon: Calculator01Icon, label: "Calculator" },
	{ id: "music", icon: MusicNote03Icon, label: "Music" },
	{ id: "notes", icon: Note01Icon, label: "Notes" },
	{ id: "stats", icon: ChartHistogramIcon, label: "Quick Stats" },
	{ id: "converter", icon: ArrowDataTransferHorizontalIcon, label: "Converter" },
]

export function ToolbarPanel() {
	const { isOpen, activeWidget, setActiveWidget, openWidget } = useToolbar()

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ x: 80, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					exit={{ x: 80, opacity: 0 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="fixed right-4 top-1/2 -translate-y-1/2 z-50"
				>
					<div className="flex flex-col gap-1 p-2 bg-background/95 backdrop-blur-sm border rounded-2xl shadow-lg">
						{WIDGETS.map((widget) => (
							<Tooltip key={widget.id} delayDuration={0}>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className={cn(
											"size-10 rounded-xl transition-colors",
											activeWidget === widget.id && "bg-primary text-primary-foreground hover:bg-primary/90"
										)}
										onClick={() => openWidget(widget.id)}
									>
										<HugeiconsIcon icon={widget.icon} size={18} />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left" sideOffset={8}>
									<p>{widget.label}</p>
								</TooltipContent>
							</Tooltip>
						))}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}
