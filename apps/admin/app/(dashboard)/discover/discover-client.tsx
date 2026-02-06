"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
	Search,
	UserPlus,
	Check,
	X,
	Clock,
	Users,
	Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import {
	searchAllUsers,
	sendFriendRequest,
	acceptFriendRequest,
	declineFriendRequest,
	removeFriend,
} from "./actions"
import { usePusher } from "@/components/pusher-provider"

interface User {
	id: string
	name: string
	username: string | null
	image: string | null
	bio?: string | null
	location?: string | null
}

interface DiscoverClientProps {
	currentUser: { id: string; name: string; image: string | null }
	initialUsers: User[]
	initialFriends: User[]
	initialPendingRequests: {
		incoming: any[]
		outgoing: any[]
	}
}

function getInitials(name: string) {
	return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function DiscoverClient({
	currentUser,
	initialUsers,
	initialFriends,
	initialPendingRequests,
}: DiscoverClientProps) {
	const router = useRouter()
	const { pusher } = usePusher()

	// State
	const [searchQuery, setSearchQuery] = useState("")
	const [searchResults, setSearchResults] = useState<User[]>([])
	const [isSearching, setIsSearching] = useState(false)
	const [friends, setFriends] = useState(initialFriends)
	const [pendingRequests, setPendingRequests] = useState(initialPendingRequests)
	const [loadingAction, setLoadingAction] = useState<string | null>(null)

	const debouncedSearch = useDebounce(searchQuery, 300)

	// Search users
	useEffect(() => {
		if (debouncedSearch.length < 2) {
			setSearchResults([])
			return
		}

		setIsSearching(true)
		searchAllUsers(debouncedSearch).then((results) => {
			setSearchResults(results.filter(u => u.id !== currentUser.id))
			setIsSearching(false)
		})
	}, [debouncedSearch, currentUser.id])

	// Pusher subscriptions
	useEffect(() => {
		if (!pusher) return

		const userChannel = pusher.subscribe(`private-user-${currentUser.id}`)

		userChannel.bind("friend-request", (data: any) => {
			setPendingRequests(prev => ({
				...prev,
				incoming: [{ ...data.from, createdAt: new Date() }, ...prev.incoming],
			}))
		})

		userChannel.bind("friend-accepted", () => {
			router.refresh()
		})

		return () => {
			pusher.unsubscribe(`private-user-${currentUser.id}`)
		}
	}, [pusher, currentUser.id, router])

	// Actions
	const handleSendFriendRequest = async (userId: string) => {
		setLoadingAction(userId)
		try {
			await sendFriendRequest(userId)
			setPendingRequests(prev => ({
				...prev,
				outgoing: [...prev.outgoing, { addresseeId: userId }],
			}))
		} catch (err: any) {
			console.error(err.message)
		} finally {
			setLoadingAction(null)
		}
	}

	const handleAcceptRequest = async (requesterId: string) => {
		setLoadingAction(requesterId)
		try {
			await acceptFriendRequest(requesterId)
			const accepted = pendingRequests.incoming.find(r => r.requesterId === requesterId)
			if (accepted) {
				setFriends(prev => [...prev, {
					id: requesterId,
					name: accepted.requesterName,
					username: accepted.requesterUsername,
					image: accepted.requesterImage,
				}])
			}
			setPendingRequests(prev => ({
				...prev,
				incoming: prev.incoming.filter(r => r.requesterId !== requesterId),
			}))
		} finally {
			setLoadingAction(null)
		}
	}

	const handleDeclineRequest = async (requesterId: string) => {
		setLoadingAction(requesterId)
		try {
			await declineFriendRequest(requesterId)
			setPendingRequests(prev => ({
				...prev,
				incoming: prev.incoming.filter(r => r.requesterId !== requesterId),
			}))
		} finally {
			setLoadingAction(null)
		}
	}

	const handleRemoveFriend = async (friendId: string) => {
		setLoadingAction(friendId)
		try {
			await removeFriend(friendId)
			setFriends(prev => prev.filter(f => f.id !== friendId))
		} finally {
			setLoadingAction(null)
		}
	}

	const displayUsers = searchQuery.length >= 2 ? searchResults : initialUsers

	const isFriend = (userId: string) => friends.some(f => f.id === userId)
	const isPendingOutgoing = (userId: string) => pendingRequests.outgoing.some(r => r.addresseeId === userId)
	const isPendingIncoming = (userId: string) => pendingRequests.incoming.some(r => r.requesterId === userId)

	return (
		<div className="flex-1 flex flex-col h-full">
			<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-4">
				<h1 className="text-2xl font-bold">Discover</h1>
				<p className="text-muted-foreground text-sm">Find and manage your friends</p>
			</header>

			<Tabs defaultValue="users" className="flex-1 flex flex-col">
				<div className="border-b px-6">
					<TabsList className="h-12 bg-transparent p-0 gap-4">
						<TabsTrigger value="users" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2">
							<Users className="size-4 mr-2" />
							Discover Users
						</TabsTrigger>
						<TabsTrigger value="friends" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2">
							<Users className="size-4 mr-2" />
							My Friends
							{pendingRequests.incoming.length > 0 && (
								<Badge variant="destructive" className="ml-2 size-5 p-0 justify-center">
									{pendingRequests.incoming.length}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>
				</div>

				{/* USERS TAB */}
				<TabsContent value="users" className="flex-1 p-6 m-0">
					<div className="max-w-4xl mx-auto space-y-6">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search by name or username..."
								className="pl-10"
							/>
							{isSearching && (
								<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
							)}
						</div>

						<div className="grid gap-3">
							{displayUsers.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground">
									{searchQuery.length >= 2 ? "No users found" : "No users yet"}
								</div>
							) : (
								displayUsers.map((user) => (
									<div
										key={user.id}
										className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
									>
										<Avatar className="size-12">
											{user.image && <AvatarImage src={user.image} alt={user.name} />}
											<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<p className="font-medium">{user.name}</p>
											{user.username && (
												<p className="text-sm text-muted-foreground">@{user.username}</p>
											)}
											{user.bio && (
												<p className="text-sm text-muted-foreground truncate mt-0.5">{user.bio}</p>
											)}
										</div>
										<div className="flex items-center gap-2">
											{isFriend(user.id) ? (
												<Badge variant="secondary">
													<Check className="size-3 mr-1" />
													Friends
												</Badge>
											) : isPendingOutgoing(user.id) ? (
												<Badge variant="outline">
													<Clock className="size-3 mr-1" />
													Pending
												</Badge>
											) : isPendingIncoming(user.id) ? (
												<div className="flex gap-1">
													<Button
														size="sm"
														onClick={() => handleAcceptRequest(user.id)}
														disabled={loadingAction === user.id}
													>
														<Check className="size-4" />
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleDeclineRequest(user.id)}
														disabled={loadingAction === user.id}
													>
														<X className="size-4" />
													</Button>
												</div>
											) : (
												<Button
													size="sm"
													onClick={() => handleSendFriendRequest(user.id)}
													disabled={loadingAction === user.id}
												>
													{loadingAction === user.id ? (
														<Loader2 className="size-4 animate-spin" />
													) : (
														<>
															<UserPlus className="size-4 mr-1" />
															Add
														</>
													)}
												</Button>
											)}
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</TabsContent>

				{/* FRIENDS TAB */}
				<TabsContent value="friends" className="flex-1 p-6 m-0">
					<div className="max-w-4xl mx-auto space-y-6">
						{/* Pending Requests */}
						{pendingRequests.incoming.length > 0 && (
							<div className="space-y-3">
								<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
									Friend Requests ({pendingRequests.incoming.length})
								</h3>
								{pendingRequests.incoming.map((req) => (
									<div
										key={req.requesterId}
										className="flex items-center gap-4 p-4 rounded-xl border bg-card"
									>
										<Avatar className="size-12">
											{req.requesterImage && <AvatarImage src={req.requesterImage} alt={req.requesterName} />}
											<AvatarFallback>{getInitials(req.requesterName)}</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<p className="font-medium">{req.requesterName}</p>
											{req.requesterUsername && (
												<p className="text-sm text-muted-foreground">@{req.requesterUsername}</p>
											)}
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												onClick={() => handleAcceptRequest(req.requesterId)}
												disabled={loadingAction === req.requesterId}
											>
												{loadingAction === req.requesterId ? (
													<Loader2 className="size-4 animate-spin" />
												) : (
													<>
														<Check className="size-4 mr-1" />
														Accept
													</>
												)}
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleDeclineRequest(req.requesterId)}
												disabled={loadingAction === req.requesterId}
											>
												<X className="size-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}

						{/* Friends List */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
								Friends ({friends.length})
							</h3>
							{friends.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground">
									No friends yet. Search for users and send friend requests!
								</div>
							) : (
								friends.map((friend) => (
									<div
										key={friend.id}
										className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
									>
										<Avatar className="size-12">
											{friend.image && <AvatarImage src={friend.image} alt={friend.name} />}
											<AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<p className="font-medium">{friend.name}</p>
											{friend.username && (
												<p className="text-sm text-muted-foreground">@{friend.username}</p>
											)}
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="ghost"
												className="text-destructive hover:text-destructive"
												onClick={() => handleRemoveFriend(friend.id)}
												disabled={loadingAction === friend.id}
											>
												{loadingAction === friend.id ? (
													<Loader2 className="size-4 animate-spin" />
												) : (
													<>
														<X className="size-4 mr-1" />
														Unfriend
													</>
												)}
											</Button>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}
