"use client";

import { useState } from "react";
import { SOURCE_INFO, type ScrapedGig, type GigSource } from "@/lib/scrapers/types";
import { formatBudget } from "@/lib/scrapers/base";

interface GigSearchSectionProps {
	companyId: string;
}

export function GigSearchSection({ companyId }: GigSearchSectionProps) {
	const [query, setQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [results, setResults] = useState<ScrapedGig[]>([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [addingGigs, setAddingGigs] = useState<Set<string>>(new Set());
	const [addedGigs, setAddedGigs] = useState<Set<string>>(new Set());

	const handleSearch = async () => {
		if (!query.trim()) return;

		setIsSearching(true);
		setHasSearched(true);

		try {
			const response = await fetch("/api/gigs/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: query.trim(),
					companyId,
					sources: ["remoteok", "arbeitnow", "himalayas"],
					options: { limit: 30 },
				}),
			});

			const data = await response.json();
			if (data.success) {
				setResults(data.gigs);
			}
		} catch (error) {
			console.error("Search failed:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const handleAddGig = async (gig: ScrapedGig) => {
		setAddingGigs((prev) => new Set(prev).add(gig.id));

		try {
			const response = await fetch("/api/gigs/curated", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					gig,
					status: "pending",
				}),
			});

			if (response.ok) {
				setAddedGigs((prev) => new Set(prev).add(gig.id));
			}
		} catch (error) {
			console.error("Failed to add gig:", error);
		} finally {
			setAddingGigs((prev) => {
				const next = new Set(prev);
				next.delete(gig.id);
				return next;
			});
		}
	};

	return (
		<div>
			<h2 className="text-xl font-semibold text-white mb-4">
				Search for Gigs
			</h2>
			<p className="text-white/50 text-sm mb-6">
				Search across multiple freelance platforms to find opportunities for your community members.
			</p>

			{/* Search Input */}
			<div className="flex gap-3 mb-6">
				<div className="flex-1 relative">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder="Search for gigs... (e.g., 'React developer', 'logo design', 'content writing')"
						className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
					/>
				</div>
				<button
					onClick={handleSearch}
					disabled={isSearching || !query.trim()}
					className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSearching ? (
						<span className="flex items-center gap-2">
							<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
									fill="none"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								/>
							</svg>
							Searching...
						</span>
					) : (
						"Search"
					)}
				</button>
			</div>

			{/* Source Pills */}
			<div className="flex flex-wrap gap-2 mb-6">
				{Object.entries(SOURCE_INFO).slice(0, 6).map(([key, info]) => (
					<span
						key={key}
						style={{ backgroundColor: info.color }}
						className="px-3 py-1.5 rounded-lg text-xs text-white font-medium"
					>
						{info.name}
					</span>
				))}
			</div>

			{/* Results */}
			{hasSearched && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-medium text-white">
							{isSearching
								? "Loading results..."
								: results.length > 0
								? `Found ${results.length} gigs`
								: "No gigs found"}
						</h3>
						{results.length > 0 && !isSearching && (
							<span className="text-sm text-white/40">
								Click + to add to your curated list
							</span>
						)}
					</div>

					{isSearching && (
						<div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
							<div className="flex flex-col items-center gap-3">
								<svg className="animate-spin h-8 w-8 text-amber-400" viewBox="0 0 24 24">
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
										fill="none"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
									/>
								</svg>
								<p className="text-white/50">
									Searching across job platforms...
								</p>
							</div>
						</div>
					)}

					{results.length === 0 && !isSearching && (
						<div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
							<p className="text-white/50">
								No gigs found for "{query}". Try different keywords.
							</p>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{results.map((gig) => (
							<GigResultCard
								key={gig.id}
								gig={gig}
								onAdd={() => handleAddGig(gig)}
								isAdding={addingGigs.has(gig.id)}
								isAdded={addedGigs.has(gig.id)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function GigResultCard({
	gig,
	onAdd,
	isAdding,
	isAdded,
}: {
	gig: ScrapedGig;
	onAdd: () => void;
	isAdding: boolean;
	isAdded: boolean;
}) {
	const source = SOURCE_INFO[gig.source];

	return (
		<div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-all flex flex-col">
			{/* Header - Source & Budget */}
			<div className="flex items-center justify-between gap-2 mb-3">
				<span
					style={{ backgroundColor: source.color }}
					className="px-2.5 py-1 rounded-md text-xs font-medium text-white"
				>
					{source.name}
				</span>
				<p className="text-lg font-bold text-amber-400">
					{formatBudget(gig.budget)}
				</p>
			</div>

			{/* Title */}
			<h4 className="text-base font-medium text-white mb-2 line-clamp-2">
				{gig.title}
			</h4>

			{/* Description */}
			<p className="text-sm text-white/50 line-clamp-2 mb-3 flex-grow">
				{gig.description}
			</p>

			{/* Skills */}
			{gig.skills.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mb-3">
					{gig.skills.slice(0, 4).map((skill) => (
						<span
							key={skill}
							className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50"
						>
							{skill}
						</span>
					))}
					{gig.skills.length > 4 && (
						<span className="px-2 py-0.5 text-xs text-white/30">
							+{gig.skills.length - 4} more
						</span>
					)}
				</div>
			)}

			{/* Client Info & Posted */}
			<div className="flex items-center justify-between text-xs text-white/40 mb-4">
				<span className="truncate">
					{gig.clientInfo?.name || gig.clientInfo?.location || ""}
				</span>
				{gig.postedAt && <span>{formatTimeAgo(gig.postedAt)}</span>}
			</div>

			{/* Actions */}
			<div className="flex gap-2 mt-auto">
				<button
					onClick={onAdd}
					disabled={isAdding || isAdded}
					className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
						isAdded
							? "bg-emerald-500/20 text-emerald-400 cursor-default"
							: isAdding
							? "bg-white/10 text-white/50 cursor-wait"
							: "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
					}`}
				>
					{isAdded ? "Added" : isAdding ? "Adding..." : "+ Add"}
				</button>
				<a
					href={gig.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="px-4 py-2 bg-white/5 text-white/50 hover:text-white rounded-lg text-sm transition-all text-center"
				>
					View
				</a>
			</div>
		</div>
	);
}

function formatTimeAgo(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	if (diffHours < 1) return "Just now";
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

