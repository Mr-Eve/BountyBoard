import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getBountiesByCompany, seedDemoData } from "@/lib/bounties";
import { CATEGORY_INFO, STATUS_INFO } from "@/lib/types";
import type { Bounty } from "@/lib/types";
import Link from "next/link";

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

	// Seed demo data for testing (remove in production)
	seedDemoData(companyId);

	// Get bounties for this company
	const bounties = await getBountiesByCompany(companyId);

	const displayName = user.name || `@${user.username}`;
	const companyName = company.title || "Your Community";

	const stats = {
		total: bounties.length,
		open: bounties.filter((b) => b.status === "open").length,
		inProgress: bounties.filter((b) => b.status === "in_progress").length,
		completed: bounties.filter((b) => b.status === "completed").length,
	};

	return (
		<div className="min-h-screen bg-[#0a0a0b]">
			{/* Header */}
			<header className="border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10">
				<div className="max-w-7xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="flex items-center gap-3 mb-1">
								<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl">
									🏆
								</div>
								<h1 className="text-2xl font-bold text-white">
									Bounty Board
								</h1>
							</div>
							<p className="text-white/50 text-sm">
								{companyName} • Managed by {displayName}
							</p>
						</div>
						<Link
							href={`/dashboard/${companyId}/new`}
							className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/20"
						>
							+ New Bounty
						</Link>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-6 py-8">
				{/* Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<StatCard
						label="Total Bounties"
						value={stats.total}
						color="from-white/10 to-white/5"
					/>
					<StatCard
						label="Open"
						value={stats.open}
						color="from-emerald-500/20 to-emerald-500/5"
					/>
					<StatCard
						label="In Progress"
						value={stats.inProgress}
						color="from-amber-500/20 to-amber-500/5"
					/>
					<StatCard
						label="Completed"
						value={stats.completed}
						color="from-blue-500/20 to-blue-500/5"
					/>
				</div>

				{/* Bounties List */}
				<div className="space-y-4">
					<h2 className="text-lg font-semibold text-white/80">
						Your Bounties
					</h2>

					{bounties.length === 0 ? (
						<EmptyState companyId={companyId} />
					) : (
						<div className="grid gap-4">
							{bounties.map((bounty) => (
								<BountyCard
									key={bounty.id}
									bounty={bounty}
									companyId={companyId}
								/>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}

function StatCard({
	label,
	value,
	color,
}: {
	label: string;
	value: number;
	color: string;
}) {
	return (
		<div
			className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-5`}
		>
			<p className="text-white/50 text-sm mb-1">{label}</p>
			<p className="text-3xl font-bold text-white">{value}</p>
		</div>
	);
}

function BountyCard({
	bounty,
	companyId,
}: {
	bounty: Bounty;
	companyId: string;
}) {
	const category = CATEGORY_INFO[bounty.category];
	const status = STATUS_INFO[bounty.status];

	return (
		<div className="group bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-5 transition-all">
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-2">
						<span
							className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.color} text-white`}
						>
							{status.label}
						</span>
						<span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70">
							{category.emoji} {category.label}
						</span>
					</div>
					<h3 className="text-lg font-semibold text-white mb-1 truncate">
						{bounty.title}
					</h3>
					<p className="text-white/50 text-sm line-clamp-2">
						{bounty.description}
					</p>
				</div>
				<div className="text-right shrink-0">
					<p className="text-xl font-bold text-amber-400">{bounty.reward}</p>
					{bounty.deadline && (
						<p className="text-xs text-white/40 mt-1">
							Due{" "}
							{new Date(bounty.deadline).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
							})}
						</p>
					)}
				</div>
			</div>

			<div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
				<Link
					href={`/dashboard/${companyId}/bounty/${bounty.id}`}
					className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
				>
					View Details
				</Link>
				<Link
					href={`/dashboard/${companyId}/bounty/${bounty.id}/edit`}
					className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
				>
					Edit
				</Link>
			</div>
		</div>
	);
}

function EmptyState({ companyId }: { companyId: string }) {
	return (
		<div className="text-center py-16 px-8 bg-white/5 border border-white/10 border-dashed rounded-2xl">
			<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-3xl">
				🎯
			</div>
			<h3 className="text-xl font-semibold text-white mb-2">
				No bounties yet
			</h3>
			<p className="text-white/50 mb-6 max-w-md mx-auto">
				Create your first bounty to start engaging your community with
				tasks and rewards.
			</p>
			<Link
				href={`/dashboard/${companyId}/new`}
				className="inline-flex px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all"
			>
				Create Your First Bounty
			</Link>
		</div>
	);
}
