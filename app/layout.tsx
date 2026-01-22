import type { Metadata } from "next";

export const metadata: Metadata = {
	metadataBase: new URL("https://jetbeans.cafe"),
	title: {
		default: "JetBeans",
		template: "%s • JetBeans",
	},
	description: "Premium coffee, brewing gear, and subscriptions.",
	robots: {
		index: true,
		follow: true,
	},
	openGraph: {
		type: "website",
		siteName: "JetBeans",
		title: "JetBeans",
		description: "Premium coffee and brewing gear.",
	},
	twitter: {
		card: "summary_large_image",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
};
