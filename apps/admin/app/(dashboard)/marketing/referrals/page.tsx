import { getReferrals, getReferralCodes } from "../actions"
import { ReferralsClient } from "./referrals-client"

interface PageProps {
	searchParams: Promise<{
		page?: string
		codesPage?: string
	}>
}

export default async function ReferralsPage({ searchParams }: PageProps) {
	const params = await searchParams
	const referralsPage = Number(params.page) || 1
	const codesPage = Number(params.codesPage) || 1

	const [referralsData, codesData] = await Promise.all([
		getReferrals({ page: referralsPage, pageSize: 30 }),
		getReferralCodes({ page: codesPage, pageSize: 30 }),
	])

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<ReferralsClient
				referrals={referralsData.items}
				referralsTotalCount={referralsData.totalCount}
				referralsCurrentPage={referralsPage}
				codes={codesData.items}
				codesTotalCount={codesData.totalCount}
				codesCurrentPage={codesPage}
			/>
		</div>
	)
}
