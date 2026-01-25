import { getUserAudioTracks } from "./actions"
import { MusicSettings } from "./music-settings"

export default async function MusicSettingsPage() {
	const tracks = await getUserAudioTracks()

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<MusicSettings initialTracks={tracks} />
		</div>
	)
}
