import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getCuratedGigs } from "@/lib/scrapers";
import Link from "next/link";
import Image from "next/image";
import { GigSearchSection } from "./gig-search";
import { OnboardingModal, OnboardingGuideButton } from "@/app/components/onboarding-modal";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	// Verify user is logged in and has access
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const [company, user] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
	]);

	// Get curated gigs for this company
	const curatedGigs = await getCuratedGigs(companyId);
	const approvedCount = curatedGigs.filter((g) => g.status === "approved").length;
	const pendingCount = curatedGigs.filter((g) => g.status === "pending").length;

	const displayName = user.name || `@${user.username}`;
	const companyName = company.title || "Your Community";

	return (
		<div className="min-h-screen bg-[#0a0a0b]">
			{/* Onboarding */}
			<OnboardingModal variant="admin" storageKey="bountyboard-admin-onboarding" />

			{/* Header */}
			<header className="border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10">
				<div className="max-w-7xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-3 mb-1">
								<Image
									src="/BountyBoardIcon.png"
									alt="Bounty Board"
									width={40}
									height={40}
									className="rounded-xl"
								/>
								<h1 className="text-2xl font-bold text-white">
									Bounty Board
								</h1>
							</div>
							<p className="text-white/50 text-sm">
								{companyName} • Managed by {displayName}
							</p>
						</div>
						<OnboardingGuideButton variant="admin" storageKey="bountyboard-admin-onboarding" />
					</div>
				</div>
			</header>

			{/* Tabs Navigation */}
			<div className="border-b border-white/10">
				<div className="max-w-7xl mx-auto px-6">
					<nav className="flex gap-1">
						<TabLink href={`/dashboard/${companyId}`} active data-onboarding="tab-find">
							Find Gigs
						</TabLink>
						<TabLink href={`/dashboard/${companyId}/curated`} data-onboarding="tab-board">
							Board ({approvedCount})
						</TabLink>
						<TabLink href={`/dashboard/${companyId}/pending`} data-onboarding="tab-saved">
							Saved ({pendingCount})
						</TabLink>
					</nav>
				</div>
			</div>

			<main className="max-w-7xl mx-auto px-6 py-8">
				{/* Gig Search Section */}
				<GigSearchSection companyId={companyId} />
			</main>
		</div>
	);
}

function TabLink({
	href,
	active,
	children,
	"data-onboarding": dataOnboarding,
}: {
	href: string;
	active?: boolean;
	children: React.ReactNode;
	"data-onboarding"?: string;
}) {
	return (
		<Link
			href={href}
			data-onboarding={dataOnboarding}
			className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
				active
					? "text-amber-400 border-amber-400"
					: "text-white/50 border-transparent hover:text-white/70"
			}`}
		>
			{children}
		</Link>
	);
}

