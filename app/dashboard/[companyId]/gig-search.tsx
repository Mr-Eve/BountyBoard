"use client";

import { useState } from "react";
import { SOURCE_INFO, type ScrapedGig, type GigSource } from "@/lib/scrapers/types";
import { formatBudget } from "@/lib/scrapers/base";

interface GigSearchSectionProps {
	companyId: string;
}

export function GigSearchSection({ companyId }: GigSearchSectionProps) {
	const [query, setQuery] = useState("");
	const [location, setLocation] = useState("");
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
			// Detect user's browser language (e.g., "en-US" -> "en")
			const browserLang = navigator.language?.split("-")[0] || "en";
			
			const response = await fetch("/api/gigs/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: query.trim(),
					companyId,
					sources: ["remoteok", "arbeitnow", "himalayas", "bountyboard"],
					options: { limit: 50 }, // Request more since some will be filtered
					language: browserLang,
					location: location.trim() || undefined, // For BountyBoard jobs
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
				Search for Gigs & Opportunities
			</h2>
			<p className="text-white/50 text-sm mb-6">
				Search freelance platforms for jobs, plus discover BountyBoard opportunities - service ideas for local businesses based on their pain points.
			</p>

			{/* Search Inputs */}
			<div className="flex flex-col md:flex-row gap-3 mb-6">
				<div className="flex-1 relative">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder="Service type (e.g., 'web design', 'SEO', 'booking system')"
						className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
					/>
				</div>
				<div className="md:w-64 relative">
					<input
						type="text"
						value={location}
						onChange={(e) => setLocation(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						placeholder="Location (e.g., 'Austin, TX')"
						className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.07] transition-all"
					/>
				</div>
				<button
					onClick={handleSearch}
					disabled={isSearching || !query.trim()}
					className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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

			<p className="text-white/30 text-xs mb-4">
				Add a location to find BountyBoard Jobs - real local businesses that need your services
			</p>

			{/* Source Pills - Show BountyBoard first */}
			<div className="flex flex-wrap gap-2 mb-6">
				<span
					style={{ backgroundColor: SOURCE_INFO.bountyboard.color }}
					className="px-3 py-1.5 rounded-lg text-xs text-white font-medium"
				>
					{SOURCE_INFO.bountyboard.name} Jobs
				</span>
				{Object.entries(SOURCE_INFO)
					.filter(([key]) => !["bountyboard", "manual", "upwork", "freelancer", "fiverr", "toptal", "indeed", "linkedin", "weworkremotely"].includes(key))
					.map(([key, info]) => (
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
	const [isExpanded, setIsExpanded] = useState(false);
	const source = SOURCE_INFO[gig.source];
	const isBountyBoard = gig.source === "bountyboard";

	// Generate AI summary for BountyBoard jobs
	const aiSummary = isBountyBoard ? generateAISummary(gig) : null;

	return (
		<div 
			className={`bg-white/5 border border-white/10 rounded-xl p-5 transition-all flex flex-col cursor-pointer ${
				isExpanded ? "bg-white/[0.07]" : "hover:bg-white/[0.07]"
			} ${isBountyBoard ? "border-pink-500/30" : ""}`}
			onClick={() => setIsExpanded(!isExpanded)}
		>
			{/* Header - Source & Budget/Outreach Label */}
			<div className="flex items-center justify-between gap-2 mb-3">
				<span
					style={{ backgroundColor: source.color }}
					className="px-2.5 py-1 rounded-md text-xs font-medium text-white"
				>
					{isBountyBoard ? "BountyBoard Job" : source.name}
				</span>
				{isBountyBoard ? (
					<span className="text-xs text-pink-400 font-medium">
						Outreach Opportunity
					</span>
				) : (
					<p className="text-lg font-bold text-amber-400">
						{formatBudget(gig.budget)}
					</p>
				)}
			</div>

			{/* Title */}
			<h4 className="text-base font-medium text-white mb-2 line-clamp-2">
				{gig.title}
			</h4>

			{/* AI Summary for BountyBoard jobs */}
			{isBountyBoard && aiSummary && (
				<div className="mb-3 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
					<p className="text-sm text-pink-200">
						{aiSummary}
					</p>
				</div>
			)}

			{/* Description - show more when expanded */}
			<p className={`text-sm text-white/50 mb-3 ${isExpanded ? "" : "line-clamp-2"} flex-grow`}>
				{gig.description}
			</p>

			{/* Expanded Content */}
			{isExpanded && (
				<div className="space-y-4 mb-4 pt-4 border-t border-white/10">
					{/* Contact Info for BountyBoard */}
					{isBountyBoard && gig.clientInfo && (
						<div className="space-y-2">
							<h5 className="text-sm font-medium text-white">Contact Information</h5>
							<div className="grid grid-cols-1 gap-2 text-sm">
								{gig.clientInfo.name && (
									<div className="flex items-center gap-2">
										<span className="text-white/40">Business:</span>
										<span className="text-white">{gig.clientInfo.name}</span>
									</div>
								)}
								{gig.clientInfo.location && (
									<div className="flex items-center gap-2">
										<span className="text-white/40">Location/Phone:</span>
										<span className="text-white">{gig.clientInfo.location}</span>
									</div>
								)}
								{gig.clientInfo.rating && (
									<div className="flex items-center gap-2">
										<span className="text-white/40">Rating:</span>
										<span className="text-white">{gig.clientInfo.rating}/5 stars</span>
										{gig.clientInfo.jobsPosted && (
											<span className="text-white/40">({gig.clientInfo.jobsPosted} reviews)</span>
										)}
									</div>
								)}
								{gig.sourceUrl && gig.sourceUrl !== "" && (
									<div className="flex items-center gap-2">
										<span className="text-white/40">Website:</span>
										<a 
											href={gig.sourceUrl} 
											target="_blank" 
											rel="noopener noreferrer"
											className="text-pink-400 hover:text-pink-300"
											onClick={(e) => e.stopPropagation()}
										>
											{gig.sourceUrl.replace(/^https?:\/\//, "").slice(0, 40)}...
										</a>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Full Skills List */}
					{gig.skills.length > 0 && (
						<div>
							<h5 className="text-sm font-medium text-white mb-2">Skills Needed</h5>
							<div className="flex flex-wrap gap-1.5">
								{gig.skills.map((skill) => (
									<span
										key={skill}
										className="px-2 py-1 bg-white/10 rounded text-xs text-white/70"
									>
										{skill}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Posted Date */}
					{gig.postedAt && !isBountyBoard && (
						<div className="text-xs text-white/40">
							Posted {formatTimeAgo(gig.postedAt)}
						</div>
					)}
				</div>
			)}

			{/* Collapsed Skills Preview */}
			{!isExpanded && gig.skills.length > 0 && (
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

			{/* Client Info & Posted (collapsed view) */}
			{!isExpanded && (
				<div className="flex items-center justify-between text-xs text-white/40 mb-4">
					<span className="truncate">
						{gig.clientInfo?.name || gig.clientInfo?.location || ""}
					</span>
					{gig.postedAt && !isBountyBoard && <span>{formatTimeAgo(gig.postedAt)}</span>}
				</div>
			)}

			{/* Expand/Collapse Indicator */}
			<div className="flex items-center justify-center mb-3">
				<span className="text-xs text-white/30">
					{isExpanded ? "Click to collapse" : "Click to expand"}
				</span>
			</div>

			{/* Actions */}
			<div className="flex gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
				<button
					onClick={onAdd}
					disabled={isAdding || isAdded}
					className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
						isAdded
							? "bg-emerald-500/20 text-emerald-400 cursor-default"
							: isAdding
							? "bg-white/10 text-white/50 cursor-wait"
							: "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
					}`}
				>
					{isAdded ? "Added" : isAdding ? "Adding..." : "Add to Board"}
				</button>
				{gig.sourceUrl && gig.sourceUrl !== "" && (
					<a
						href={gig.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="px-4 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all text-center"
					>
						{isBountyBoard ? "Visit" : "View"}
					</a>
				)}
			</div>
		</div>
	);
}

// Generate AI summary for BountyBoard jobs based on the description
function generateAISummary(gig: ScrapedGig): string {
	const desc = gig.description.toLowerCase();
	const businessName = gig.clientInfo?.name || "This business";
	
	// Detect what services are needed based on keywords in description
	const needs: string[] = [];
	
	if (desc.includes("no website") || desc.includes("needs a website")) {
		needs.push("a professional website");
	}
	if (desc.includes("online booking") || desc.includes("booking system") || desc.includes("hard to book")) {
		needs.push("an online booking system");
	}
	if (desc.includes("contact form") || desc.includes("missing contact")) {
		needs.push("a contact form");
	}
	if (desc.includes("seo") || desc.includes("not found on google") || desc.includes("hard to find online")) {
		needs.push("SEO optimization");
	}
	if (desc.includes("social media") || desc.includes("inactive") || desc.includes("no engagement")) {
		needs.push("social media management");
	}
	if (desc.includes("slow response") || desc.includes("never replied") || desc.includes("automation")) {
		needs.push("customer communication automation");
	}
	if (desc.includes("mobile") || desc.includes("responsive")) {
		needs.push("a mobile-friendly website");
	}
	if (desc.includes("reviews") || desc.includes("reputation")) {
		needs.push("review management");
	}
	
	if (needs.length === 0) {
		needs.push("digital improvements");
	}
	
	// Build the summary
	const needsList = needs.length === 1 
		? needs[0] 
		: needs.slice(0, -1).join(", ") + " and " + needs[needs.length - 1];
	
	return `${businessName} could benefit from ${needsList}. This is a great outreach opportunity - reach out to offer your services.`;
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

