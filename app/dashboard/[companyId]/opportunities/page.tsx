import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import { OpportunitySearchSection } from "./opportunity-search";

export default async function OpportunitiesPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;

	const { userId } = await whopsdk.verifyUserToken(await headers());
	const [company, user] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
	]);

	const displayName = user.name || `@${user.username}`;
	const companyName = company.title || "Your Community";

	return (
		<div className="min-h-screen bg-[#0a0a0b]">
			{/* Header */}
			<header className="border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10">
				<div className="max-w-7xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-3 mb-1">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xl font-bold text-white">
									BB
								</div>
								<h1 className="text-2xl font-bold text-white">
									Opportunity Finder
								</h1>
							</div>
							<p className="text-white/50 text-sm">
								{companyName} - Managed by {displayName}
							</p>
						</div>
						<Link
							href={`/dashboard/${companyId}`}
							className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all"
						>
							Back to Gigs
						</Link>
					</div>
				</div>
			</header>

			{/* Navigation */}
			<div className="border-b border-white/10">
				<div className="max-w-7xl mx-auto px-6">
					<nav className="flex gap-1">
						<TabLink href={`/dashboard/${companyId}`}>
							Find Gigs
						</TabLink>
						<TabLink href={`/dashboard/${companyId}/opportunities`} active>
							Find Opportunities
						</TabLink>
						<TabLink href={`/dashboard/${companyId}/curated`}>
							Curated
						</TabLink>
					</nav>
				</div>
			</div>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-6 py-8">
				{/* Info Banner */}
				<div className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
					<h2 className="text-lg font-semibold text-white mb-2">
						Discover Service Opportunities
					</h2>
					<p className="text-white/60 text-sm mb-4">
						Search for local businesses and analyze their reviews and websites to find 
						potential service opportunities. We'll identify pain points from customer 
						reviews and missing features on their websites.
					</p>
					<div className="flex flex-wrap gap-4 text-sm">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-purple-400" />
							<span className="text-white/50">Review Pain Points</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-pink-400" />
							<span className="text-white/50">Missing Website Features</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 rounded-full bg-amber-400" />
							<span className="text-white/50">Service Suggestions</span>
						</div>
					</div>
				</div>

				{/* Search Section */}
				<OpportunitySearchSection companyId={companyId} />
			</main>
		</div>
	);
}

function TabLink({
	href,
	active,
	children,
}: {
	href: string;
	active?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Link
			href={href}
			className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
				active
					? "text-purple-400 border-purple-400"
					: "text-white/50 border-transparent hover:text-white/70"
			}`}
		>
			{children}
		</Link>
	);
}

