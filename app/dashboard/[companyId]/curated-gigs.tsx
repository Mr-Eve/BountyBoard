"use client";

import { useState } from "react";
import { SOURCE_INFO, type CuratedGig } from "@/lib/scrapers/types";
import { formatBudget } from "@/lib/scrapers/base";
import Link from "next/link";

interface CuratedGigsSectionProps {
	gigs: CuratedGig[];
	companyId: string;
	showViewAll?: boolean;
}

export function CuratedGigsSection({
	gigs,
	companyId,
	showViewAll,
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
				// Refresh the page to show updated status
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

	if (gigs.length === 0) {
		return null;
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold text-white">
					Recently Curated Gigs
				</h2>
				{showViewAll && (
					<Link
						href={`/dashboard/${companyId}/curated`}
						className="text-sm text-amber-400 hover:text-amber-300"
					>
						View all
					</Link>
				)}
			</div>

			<div className="space-y-3">
				{gigs.map((curatedGig) => (
					<CuratedGigCard
						key={curatedGig.id}
						curatedGig={curatedGig}
						onUpdateStatus={(status) =>
							handleUpdateStatus(curatedGig.id, status)
						}
						isUpdating={updatingGigs.has(curatedGig.id)}
					/>
				))}
			</div>
		</div>
	);
}

function CuratedGigCard({
	curatedGig,
	onUpdateStatus,
	isUpdating,
}: {
	curatedGig: CuratedGig;
	onUpdateStatus: (status: CuratedGig["status"]) => void;
	isUpdating: boolean;
}) {
	const { gig, status } = curatedGig;
	const source = SOURCE_INFO[gig.source];

	const statusColors = {
		pending: "bg-amber-500/20 text-amber-400",
		approved: "bg-emerald-500/20 text-emerald-400",
		rejected: "bg-red-500/20 text-red-400",
		hidden: "bg-gray-500/20 text-gray-400",
	};

	const statusLabels = {
		pending: "Pending",
		approved: "Approved",
		rejected: "Rejected",
		hidden: "Hidden",
	};

	return (
		<div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-all">
			<div className="flex items-center gap-4">
				{/* Content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<span
							style={{ backgroundColor: source.color }}
							className="px-2.5 py-0.5 rounded text-xs font-medium text-white"
						>
							{source.name}
						</span>
						<span
							className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[status]}`}
						>
							{statusLabels[status]}
						</span>
					</div>
					<h4 className="text-white font-medium truncate">{gig.title}</h4>
					<p className="text-sm text-white/40 truncate">{gig.description}</p>
				</div>

				{/* Budget */}
				<div className="text-right shrink-0">
					<p className="text-lg font-semibold text-amber-400">
						{formatBudget(gig.budget)}
					</p>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2 shrink-0">
					{status === "pending" && (
						<>
							<button
								onClick={() => onUpdateStatus("approved")}
								disabled={isUpdating}
								className="px-3 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-all disabled:opacity-50 text-xs font-medium"
								title="Approve"
							>
								Approve
							</button>
							<button
								onClick={() => onUpdateStatus("rejected")}
								disabled={isUpdating}
								className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all disabled:opacity-50 text-xs font-medium"
								title="Reject"
							>
								Reject
							</button>
						</>
					)}
					{status === "approved" && (
						<button
							onClick={() => onUpdateStatus("hidden")}
							disabled={isUpdating}
							className="px-3 py-2 bg-white/10 text-white/50 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 text-xs font-medium"
							title="Hide"
						>
							Hide
						</button>
					)}
					{(status === "rejected" || status === "hidden") && (
						<button
							onClick={() => onUpdateStatus("approved")}
							disabled={isUpdating}
							className="px-3 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-all disabled:opacity-50 text-xs font-medium"
							title="Approve"
						>
							Approve
						</button>
					)}
					<a
						href={gig.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="px-3 py-2 bg-white/5 text-white/50 hover:text-white rounded-lg transition-all text-xs font-medium"
						title="View original"
					>
						View
					</a>
				</div>
			</div>
		</div>
	);
}

