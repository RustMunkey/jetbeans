import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
		googleClientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
		hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
		adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL,
		nodeEnv: process.env.NODE_ENV,
	});
}
