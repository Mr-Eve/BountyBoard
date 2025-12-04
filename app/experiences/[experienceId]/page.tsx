import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getBountiesByCompany, seedDemoData } from "@/lib/bounties";
import { CATEGORY_INFO, STATUS_INFO } from "@/lib/types";
import type { Bounty, BountyCategory } from "@/lib/types";

export default async function ExperiencePage({
	params,
	searchParams,
}: {
	params: Promise<{ experienceId: string }>;
	searchParams: Promise<{ category?: string }>;
}) {
	const { experienceId } = await params;
	const { category: filterCategory } = await searchParams;

	// Verify user is logged in
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const [experience, user] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
	]);

	// Get the company ID from the experience
	// experience.company can be a Company object or string ID
	const companyId = typeof experience.company === "string" 
		? experience.company 
		: experience.company.id;

	// Seed demo data for testing
	seedDemoData(companyId);

	// Get bounties
	let bounties = await getBountiesByCompany(companyId);

	// Filter by category if specified
	if (filterCategory && filterCategory !== "all") {
		bounties = bounties.filter((b) => b.category === filterCategory);
	}

	// Only show open and in_progress bounties to members
	bounties = bounties.filter(
		(b) => b.status === "open" || b.status === "in_progress"
	);

	const displayName = user.name || `@${user.username}`;
	const openCount = bounties.filter((b) => b.status === "open").length;

	return (
		<div className="min-h-screen bg-[#0a0a0b]">
			{/* Hero Header */}
			<header className="relative overflow-hidden border-b border-white/10">
				<div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

				<div className="relative max-w-6xl mx-auto px-6 py-12">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-xl shadow-amber-500/30">
							🏆
						</div>
						<div>
							<h1 className="text-3xl font-bold text-white">
								Bounty Board
							</h1>
							<p className="text-white/50">
								Welcome back, {displayName}
							</p>
						</div>
					</div>

					<p className="text-white/70 text-lg max-w-2xl mb-6">
						Complete bounties to earn rewards and contribute to the
						community. Browse available tasks below.
					</p>

					<div className="flex items-center gap-6">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
							<span className="text-white/70">
								<strong className="text-white">{openCount}</strong> bounties
								available
							</span>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-6 py-8">
				{/* Category Filter */}
				<div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
					<CategoryPill
						category="all"
						label="All"
						emoji="✨"
						active={!filterCategory || filterCategory === "all"}
						experienceId={experienceId}
					/>
					{Object.entries(CATEGORY_INFO).map(([key, info]) => (
						<CategoryPill
							key={key}
							category={key}
							label={info.label}
							emoji={info.emoji}
							active={filterCategory === key}
							experienceId={experienceId}
						/>
					))}
				</div>

				{/* Bounties Grid */}
				{bounties.length === 0 ? (
					<EmptyState />
				) : (
					<div className="grid md:grid-cols-2 gap-5">
						{bounties.map((bounty) => (
							<BountyCard
								key={bounty.id}
								bounty={bounty}
								experienceId={experienceId}
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}

function CategoryPill({
	category,
	label,
	emoji,
	active,
	experienceId,
}: {
	category: string;
	label: string;
	emoji: string;
	active: boolean;
	experienceId: string;
}) {
	const href =
		category === "all"
			? `/experiences/${experienceId}`
			: `/experiences/${experienceId}?category=${category}`;

	return (
		<a
			href={href}
			className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
				active
					? "bg-gradient-to-r from-amber-500 to-orange-500 text-black"
					: "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
			}`}
		>
			{emoji} {label}
		</a>
	);
}

function BountyCard({
	bounty,
	experienceId,
}: {
	bounty: Bounty;
	experienceId: string;
}) {
	const category = CATEGORY_INFO[bounty.category];
	const status = STATUS_INFO[bounty.status];
	const isOpen = bounty.status === "open";

	return (
		<div className="group relative bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-amber-500/30 rounded-2xl p-6 transition-all">
			{/* Glow effect on hover */}
			<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all" />

			<div className="relative">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 mb-4">
					<div className="flex items-center gap-2">
						<span
							className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center text-sm`}
						>
							{category.emoji}
						</span>
						<span className="text-white/50 text-sm">{category.label}</span>
					</div>
					<span
						className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
							isOpen ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
						}`}
					>
						{status.label}
					</span>
				</div>

				{/* Content */}
				<h3 className="text-xl font-semibold text-white mb-2 group-hover:text-amber-200 transition-colors">
					{bounty.title}
				</h3>
				<p className="text-white/50 text-sm line-clamp-2 mb-4">
					{bounty.description}
				</p>

				{/* Requirements preview */}
				{bounty.requirements && bounty.requirements.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-4">
						{bounty.requirements.slice(0, 2).map((req, i) => (
							<span
								key={i}
								className="px-2 py-1 text-xs bg-white/5 text-white/50 rounded-md"
							>
								{req}
							</span>
						))}
						{bounty.requirements.length > 2 && (
							<span className="px-2 py-1 text-xs bg-white/5 text-white/40 rounded-md">
								+{bounty.requirements.length - 2} more
							</span>
						)}
					</div>
				)}

				{/* Footer */}
				<div className="flex items-center justify-between pt-4 border-t border-white/5">
					<div>
						<p className="text-2xl font-bold text-amber-400">
							{bounty.reward}
						</p>
						{bounty.deadline && (
							<p className="text-xs text-white/40">
								Due{" "}
								{new Date(bounty.deadline).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</p>
						)}
					</div>
					<a
						href={`/experiences/${experienceId}/bounty/${bounty.id}`}
						className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
							isOpen
								? "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
								: "bg-white/10 text-white/70"
						}`}
					>
						{isOpen ? "View & Apply" : "View Details"}
					</a>
				</div>
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="text-center py-20 px-8">
			<div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-4xl">
				🔍
			</div>
			<h3 className="text-2xl font-semibold text-white mb-3">
				No bounties found
			</h3>
			<p className="text-white/50 max-w-md mx-auto">
				There are no bounties matching your filter. Try selecting a different
				category or check back later for new opportunities.
			</p>
		</div>
	);
}
