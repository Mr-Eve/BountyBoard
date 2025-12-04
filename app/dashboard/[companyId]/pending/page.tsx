import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getCuratedGigs } from "@/lib/scrapers";
import Link from "next/link";
import { CuratedGigsSection } from "../curated-gigs";

export default async function PendingPage({
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

	// Get pending gigs
	const pendingGigs = await getCuratedGigs(companyId, "pending");
	const allGigs = await getCuratedGigs(companyId);
	const approvedCount = allGigs.filter((g) => g.status === "approved").length;

	const displayName = user.name || `@${user.username}`;
	const companyName = company.title || "Your Community";

	return (
		<div className="min-h-screen bg-[#0a0a0b]">
			{/* Header */}
			<header className="border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10">
				<div className="max-w-7xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-3 mb-1">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-black">
									BB
								</div>
								<h1 className="text-2xl font-bold text-white">Bounty Board</h1>
							</div>
							<p className="text-white/50 text-sm">
								{companyName} • Managed by {displayName}
							</p>
						</div>
					</div>
				</div>
			</header>

			{/* Tabs Navigation */}
			<div className="border-b border-white/10">
				<div className="max-w-7xl mx-auto px-6">
					<nav className="flex gap-1">
						<TabLink href={`/dashboard/${companyId}`}>Find Gigs</TabLink>
						<TabLink href={`/dashboard/${companyId}/curated`}>
							Board ({approvedCount})
						</TabLink>
						<TabLink href={`/dashboard/${companyId}/pending`} active>
							Saved ({pendingGigs.length})
						</TabLink>
					</nav>
				</div>
			</div>

			<main className="max-w-7xl mx-auto px-6 py-8">
				<div className="mb-6">
					<h2 className="text-2xl font-bold text-white mb-2">
						Saved Gigs
					</h2>
					<p className="text-white/50">
						Gigs you've saved for later. Move them to your Board to show to members.
					</p>
				</div>

				{pendingGigs.length === 0 ? (
					<EmptyState companyId={companyId} />
				) : (
					<CuratedGigsSection gigs={pendingGigs} companyId={companyId} />
				)}
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
					? "text-amber-400 border-amber-400"
					: "text-white/50 border-transparent hover:text-white/70"
			}`}
		>
			{children}
		</Link>
	);
}

function EmptyState({ companyId }: { companyId: string }) {
	return (
		<div className="text-center py-16 px-8 bg-white/5 border border-white/10 border-dashed rounded-2xl">
			<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center text-xl font-bold text-white/50">
				0
			</div>
			<h3 className="text-xl font-semibold text-white mb-2">
				No pending gigs
			</h3>
			<p className="text-white/50 mb-6 max-w-md mx-auto">
				All caught up! Search for more gigs to add to your curated list.
			</p>
			<Link
				href={`/dashboard/${companyId}`}
				className="inline-flex px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all"
			>
				Find More Gigs
			</Link>
		</div>
	);
}

