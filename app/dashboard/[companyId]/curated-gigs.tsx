"use client";

import { useState } from "react";
import { SOURCE_INFO, type CuratedGig } from "@/lib/scrapers/types";
import { formatBudget } from "@/lib/scrapers/base";
import Link from "next/link";

interface CuratedGigsSectionProps {
	gigs: CuratedGig[];
	companyId: string;
	showViewAll?: boolean;
	mode?: "board" | "saved"; // board = approved gigs, saved = pending gigs
}

export function CuratedGigsSection({
	gigs,
	companyId,
	showViewAll,
	mode = "board",
}: CuratedGigsSectionProps) {
	const [updatingGigs, setUpdatingGigs] = useState<Set<string>>(new Set());

	const handleUpdateStatus = async (
		gigId: string,
		status: CuratedGig["status"]
	) => {
		setUpdatingGigs((prev) => new Set(prev).add(gigId));

		try {
			const response = await fetch("/api/gigs/curated", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: gigId, status }),
			});

			if (response.ok) {
				window.location.reload();
			}
		} catch (error) {
			console.error("Failed to update gig:", error);
		} finally {
			setUpdatingGigs((prev) => {
				const next = new Set(prev);
				next.delete(gigId);
				return next;
			});
		}
	};

	const handleTogglePin = async (gigId: string, currentlyPinned: boolean) => {
		setUpdatingGigs((prev) => new Set(prev).add(gigId));

		try {
			const response = await fetch("/api/gigs/curated", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: gigId, pinned: !currentlyPinned }),
			});

			if (response.ok) {
				window.location.reload();
			}
		} catch (error) {
			console.error("Failed to toggle pin:", error);
		} finally {
			setUpdatingGigs((prev) => {
				const next = new Set(prev);
				next.delete(gigId);
				return next;
			});
		}
	};

	if (gigs.length === 0) {
		return null;
	}

	// Sort gigs: pinned first, then by date
	const sortedGigs = [...gigs].sort((a, b) => {
		if (a.pinned && !b.pinned) return -1;
		if (!a.pinned && b.pinned) return 1;
		return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
	});

	return (
		<div>
			{showViewAll && (
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold text-white">
						Recently Curated Gigs
					</h2>
					<Link
						href={`/dashboard/${companyId}/curated`}
						className="text-sm text-amber-400 hover:text-amber-300"
					>
						View all
					</Link>
				</div>
			)}

			<div className="grid md:grid-cols-2 gap-5">
				{sortedGigs.map((curatedGig) => (
					<CuratedGigCard
						key={curatedGig.id}
						curatedGig={curatedGig}
						onUpdateStatus={(status) =>
							handleUpdateStatus(curatedGig.id, status)
						}
						onTogglePin={() =>
							handleTogglePin(curatedGig.id, curatedGig.pinned || false)
						}
						isUpdating={updatingGigs.has(curatedGig.id)}
						mode={mode}
					/>
				))}
			</div>
		</div>
	);
}

function CuratedGigCard({
	curatedGig,
	onUpdateStatus,
	onTogglePin,
	isUpdating,
	mode,
}: {
	curatedGig: CuratedGig;
	onUpdateStatus: (status: CuratedGig["status"]) => void;
	onTogglePin: () => void;
	isUpdating: boolean;
	mode: "board" | "saved";
}) {
	const { gig, status, notes, customReward, aiSummary, pinned } = curatedGig;
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
							<span className="px-3 py-1 rounded-lg border border-amber-400 text-amber-400 text-xs font-medium">
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
					
					{/* Actions */}
					<div className="flex items-center gap-2">
						{/* Board mode actions */}
						{mode === "board" && status === "approved" && (
							<>
								<button
									onClick={onTogglePin}
									disabled={isUpdating}
									className="px-4 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
								>
									{isUpdating ? "..." : pinned ? "Unpin" : "Pin"}
								</button>
								<button
									onClick={() => onUpdateStatus("hidden")}
									disabled={isUpdating}
									className="px-4 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
								>
									{isUpdating ? "..." : "Remove"}
								</button>
							</>
						)}
						
						{/* Saved mode actions */}
						{mode === "saved" && status === "pending" && (
							<>
								<button
									onClick={() => onUpdateStatus("approved")}
									disabled={isUpdating}
									className="px-4 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
								>
									{isUpdating ? "..." : "Add"}
								</button>
								<button
									onClick={() => onUpdateStatus("rejected")}
									disabled={isUpdating}
									className="px-4 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
								>
									{isUpdating ? "..." : "Remove"}
								</button>
							</>
						)}
						
						{/* Restore actions for hidden/rejected */}
						{(status === "rejected" || status === "hidden") && (
							<button
								onClick={() => onUpdateStatus("approved")}
								disabled={isUpdating}
								className="px-4 py-2.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl transition-all disabled:opacity-50 text-sm font-medium"
							>
								{isUpdating ? "..." : "Restore"}
							</button>
						)}
						
						<a
							href={gig.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="px-4 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl transition-all text-sm font-medium"
						>
							View
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
