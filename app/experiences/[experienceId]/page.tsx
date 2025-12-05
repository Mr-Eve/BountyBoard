import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getApprovedGigs, SOURCE_INFO, type CuratedGig } from "@/lib/scrapers";
import { formatBudget } from "@/lib/scrapers/base";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	// Verify user is logged in
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const [experience, user] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
	]);

	// Get the company ID from the experience
	const companyId =
		typeof experience.company === "string"
			? experience.company
			: experience.company.id;

	// Get approved gigs for members
	const gigs = await getApprovedGigs(companyId);

	// Sort gigs: pinned first, then by date
	const sortedGigs = [...gigs].sort((a, b) => {
		if (a.pinned && !b.pinned) return -1;
		if (!a.pinned && b.pinned) return 1;
		return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
	});

	const displayName = user.name || `@${user.username}`;

	return (
		<div className="min-h-screen bg-[#0a0a0b]">
			{/* Hero Header */}
			<header className="relative overflow-hidden border-b border-white/10">
				<div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

				<div className="relative max-w-6xl mx-auto px-6 py-12">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-black shadow-xl shadow-amber-500/30">
							BB
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">Bounty Board</h1>
							<p className="text-white/50">Welcome back, {displayName}</p>
						</div>
					</div>

					<p className="text-white/70 text-lg max-w-2xl mb-6">
						Hand-picked freelance opportunities curated just for this community.
						Find your next gig and start earning.
					</p>

					<div className="flex items-center gap-6">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
							<span className="text-white/70">
								<strong className="text-white">{gigs.length}</strong> curated
								opportunities
							</span>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-6 py-8">
				{/* Gigs Grid */}
				{gigs.length === 0 ? (
					<EmptyState />
				) : (
					<div className="grid md:grid-cols-2 gap-5">
						{sortedGigs.map((curatedGig) => (
							<GigCard
								key={curatedGig.id}
								curatedGig={curatedGig}
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}

function GigCard({ curatedGig }: { curatedGig: CuratedGig }) {
	const { gig, customReward, notes, aiSummary, pinned } = curatedGig;
	const source = SOURCE_INFO[gig.source];
	const isBountyBoard = gig.source === "bountyboard";

	return (
		<div className="group relative bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-amber-500/30 rounded-2xl p-6 transition-all">
			{/* Glow effect on hover */}
			<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all" />

			<div className="relative">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 mb-4">
					<div className="flex items-center gap-2">
						<span
							style={{ backgroundColor: source.color }}
							className="px-3 py-1 rounded-lg text-white text-xs font-medium flex items-center gap-1"
						>
							{isBountyBoard && <span>✦</span>}
							{isBountyBoard ? "AI Curated" : source.name}
						</span>
						{pinned && (
							<span className="px-3 py-1 rounded-lg border border-amber-500 text-amber-500 text-xs font-medium">
								Pinned
							</span>
						)}
					</div>
					{gig.clientInfo?.rating && (
						<span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium">
							{gig.clientInfo.rating} stars
						</span>
					)}
				</div>

				{/* Content */}
				<h3 className="text-xl font-semibold text-white mb-2 group-hover:text-amber-200 transition-colors">
					{gig.title}
				</h3>
				
				{/* AI Summary for BountyBoard gigs */}
				{isBountyBoard && aiSummary && (
					<div className="mb-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
						<p className="text-sm text-pink-200">
							{aiSummary}
						</p>
					</div>
				)}

				{!aiSummary && (
					<p className="text-white/50 text-sm line-clamp-2 mb-4">
						{gig.description}
					</p>
				)}

				{/* Leader's Notes */}
				{notes && (
					<div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
						<p className="text-sm text-amber-200">
							<span className="font-medium">Note:</span> {notes}
						</p>
					</div>
				)}

				{/* Skills */}
				{gig.skills.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-4">
						{gig.skills.slice(0, 4).map((skill) => (
							<span
								key={skill}
								className="px-2 py-1 text-xs bg-white/5 text-white/50 rounded-md"
							>
								{skill}
							</span>
						))}
						{gig.skills.length > 4 && (
							<span className="px-2 py-1 text-xs bg-white/5 text-white/40 rounded-md">
								+{gig.skills.length - 4} more
							</span>
						)}
					</div>
				)}

				{/* Client Info */}
				{gig.clientInfo && (
					<div className="flex items-center gap-3 text-xs text-white/40 mb-4">
						{gig.clientInfo.name && (
							<span className="flex items-center gap-1">
								{gig.clientInfo.name}
							</span>
						)}
						{gig.clientInfo.location && (
							<span className="flex items-center gap-1">
								{gig.clientInfo.location}
							</span>
						)}
					</div>
				)}

				{/* Footer */}
				<div className="flex items-center justify-between pt-4 border-t border-white/5">
					<div>
						<p className="text-2xl font-bold text-amber-400">
							{customReward || formatBudget(gig.budget)}
						</p>
						{gig.postedAt && (
							<p className="text-xs text-white/40">
								Posted{" "}
								{new Date(gig.postedAt).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								})}
							</p>
						)}
					</div>
					<a
						href={gig.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
					>
						Apply Now
					</a>
				</div>
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="text-center py-20 px-8">
			<div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl font-bold text-white/50">
				?
			</div>
			<h3 className="text-2xl font-semibold text-white mb-3">
				No gigs available yet
			</h3>
			<p className="text-white/50 max-w-md mx-auto">
				The community leaders are curating opportunities for you. Check back
				soon for hand-picked gigs!
			</p>
		</div>
	);
}
