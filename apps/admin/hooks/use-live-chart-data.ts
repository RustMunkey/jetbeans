"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { usePusher } from "@/components/pusher-provider"

export interface ChartDataPoint {
	date: string
	revenue: number
	orders?: number
}

interface OrderEvent {
	total?: string
	amount?: number
	createdAt?: string
}

interface UseLiveChartDataOptions {
	initialData: ChartDataPoint[]
}

/**
 * Hook for live-updating chart data
 * Increments today's data point when new orders come in
 */
export function useLiveChartData({ initialData }: UseLiveChartDataOptions) {
	const { pusher, isConnected } = usePusher()
	const [data, setData] = useState<ChartDataPoint[]>(initialData)
	const initialRef = useRef(initialData)

	// Get today's date string in YYYY-MM-DD format
	const getTodayStr = useCallback(() => {
		return new Date().toISOString().split("T")[0]
	}, [])

	// Update when server data changes (e.g., date change, refresh)
	useEffect(() => {
		if (JSON.stringify(initialData) !== JSON.stringify(initialRef.current)) {
			setData(initialData)
			initialRef.current = initialData
		}
	}, [initialData])

	useEffect(() => {
		if (!pusher || !isConnected) return

		const channel = pusher.subscribe("private-orders")

		// When order is created, increment today's revenue
		channel.bind("order:created", (event: OrderEvent) => {
			const amount = event.total
				? parseFloat(event.total)
				: (event.amount || 0) / 100

			const todayStr = getTodayStr()

			setData((prev) => {
				// Find today's entry
				const todayIndex = prev.findIndex((d) => d.date === todayStr)

				if (todayIndex >= 0) {
					// Update today's revenue
					return prev.map((point, i) =>
						i === todayIndex
							? {
									...point,
									revenue: point.revenue + amount,
									orders: (point.orders || 0) + 1,
							  }
							: point
					)
				} else {
					// Add today as new entry (shouldn't happen often)
					return [
						...prev,
						{ date: todayStr, revenue: amount, orders: 1 },
					]
				}
			})
		})

		return () => {
			channel.unbind_all()
			pusher.unsubscribe("private-orders")
		}
	}, [pusher, isConnected, getTodayStr])

	return { data, isConnected }
}
