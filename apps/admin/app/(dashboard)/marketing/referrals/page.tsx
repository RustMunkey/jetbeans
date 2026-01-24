import { getReferrals, getReferralCodes } from "../actions"
import { ReferralsClient } from "./referrals-client"

export default async function ReferralsPage() {
	const [referrals, codes] = await Promise.all([
		getReferrals(),
		getReferralCodes(),
	])

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<ReferralsClient referrals={referrals} codes={codes} />
		</div>
	)
}
