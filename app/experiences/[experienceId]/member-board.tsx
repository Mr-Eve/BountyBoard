"use client";

import { useState } from "react";
import { SOURCE_INFO, type CuratedGig } from "@/lib/scrapers/types";
import { formatBudget } from "@/lib/scrapers/base";
import { OnboardingModal, OnboardingHelpButton } from "@/app/components/onboarding-modal";

interface MemberBoardProps {
	gigs: CuratedGig[];
}

export function MemberBoard({ gigs }: MemberBoardProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// Sort gigs: pinned first, then by date
	const sortedGigs = [...gigs].sort((a, b) => {
		if (a.pinned && !b.pinned) return -1;
		if (!a.pinned && b.pinned) return 1;
		return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
	});

	// Filter gigs based on search query
	const filteredGigs = sortedGigs.filter((curatedGig) => {
		if (!searchQuery.trim()) return true;
		
		const query = searchQuery.toLowerCase();
		const { gig, notes, aiSummary } = curatedGig;
		
		return (
			gig.title.toLowerCase().includes(query) ||
			gig.description.toLowerCase().includes(query) ||
			gig.skills.some(skill => skill.toLowerCase().includes(query)) ||
			(notes && notes.toLowerCase().includes(query)) ||
			(aiSummary && aiSummary.toLowerCase().includes(query)) ||
			(gig.clientInfo?.name && gig.clientInfo.name.toLowerCase().includes(query)) ||
			(gig.clientInfo?.location && gig.clientInfo.location.toLowerCase().includes(query))
		);
	});

	return (
		<div>
			{/* Onboarding */}
			<OnboardingModal variant="member" storageKey="bountyboard-member-onboarding" />
			<OnboardingHelpButton variant="member" storageKey="bountyboard-member-onboarding" />

			{/* Search Bar */}
			<div className="mb-6" data-onboarding="member-search">
				<div className="relative">
					<svg
						className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search curated gigs..."
						className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					)}
				</div>
				{searchQuery && (
					<p className="mt-2 text-sm text-white/50">
						Found {filteredGigs.length} {filteredGigs.length === 1 ? "gig" : "gigs"} matching "{searchQuery}"
					</p>
				)}
			</div>

			{/* Gigs Grid */}
			{filteredGigs.length === 0 ? (
				searchQuery ? (
					<div className="text-center py-12">
						<p className="text-white/50">No gigs found matching your search.</p>
						<button
							onClick={() => setSearchQuery("")}
							className="mt-4 text-amber-400 hover:text-amber-300 transition-colors"
						>
							Clear search
						</button>
					</div>
				) : (
					<EmptyState />
				)
			) : (
				<div className="grid md:grid-cols-2 gap-5">
					{filteredGigs.map((curatedGig, index) => (
						<GigCard key={curatedGig.id} curatedGig={curatedGig} isFirst={index === 0} />
					))}
				</div>
			)}
		</div>
	);
}

function GigCard({ curatedGig, isFirst = false }: { curatedGig: CuratedGig; isFirst?: boolean }) {
	const { gig, customReward, notes, aiSummary, pinned } = curatedGig;
	const source = SOURCE_INFO[gig.source];
	const isBountyBoard = gig.source === "bountyboard";

	return (
		<div 
			className="group relative bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-amber-500/30 rounded-2xl p-6 transition-all"
			data-onboarding={isFirst ? "gig-card" : undefined}
		>
			{/* Glow effect on hover */}
			<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition-all" />

			<div className="relative">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 mb-4">
					<div className="flex items-center gap-2">
						<span
							style={{ backgroundColor: source.color }}
							className="px-3 py-1 rounded-lg text-white text-xs font-medium flex items-center gap-1"
							data-onboarding={isFirst && isBountyBoard ? "ai-curated" : undefined}
						>
							{isBountyBoard && <span>✦</span>}
							{isBountyBoard ? "AI Curated" : source.name}
						</span>
						{pinned && (
							<span 
								className="px-3 py-1 rounded-lg border text-xs font-medium"
								style={{ borderColor: "#ffc000", color: "#ffc000" }}
								data-onboarding={isFirst && pinned ? "pinned-tag" : undefined}
							>
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
						<p className="text-sm text-pink-200">{aiSummary}</p>
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
						data-onboarding={isFirst ? "apply-button" : undefined}
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

