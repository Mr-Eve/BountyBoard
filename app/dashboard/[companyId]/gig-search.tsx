"use client";

import { useState } from "react";
import { SOURCE_INFO, type ScrapedGig, type GigSource } from "@/lib/scrapers/types";
import { formatBudget } from "@/lib/scrapers/base";

interface GigSearchSectionProps {
	companyId: string;
}

// Available sources that can be toggled
const AVAILABLE_SOURCES: GigSource[] = ["bountyboard", "remoteok", "arbeitnow", "himalayas"];

export function GigSearchSection({ companyId }: GigSearchSectionProps) {
	const [query, setQuery] = useState("");
	const [location, setLocation] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [results, setResults] = useState<ScrapedGig[]>([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [addingGigs, setAddingGigs] = useState<Set<string>>(new Set());
	const [addedGigs, setAddedGigs] = useState<Set<string>>(new Set());
	const [savingGigs, setSavingGigs] = useState<Set<string>>(new Set());
	const [savedGigs, setSavedGigs] = useState<Set<string>>(new Set());
	const [enabledSources, setEnabledSources] = useState<Set<GigSource>>(
		new Set(AVAILABLE_SOURCES)
	);
	const [showAdvanced, setShowAdvanced] = useState(false);

	const toggleSource = (source: GigSource) => {
		setEnabledSources((prev) => {
			const next = new Set(prev);
			if (next.has(source)) {
				// Don't allow disabling all sources
				if (next.size > 1) {
					next.delete(source);
				}
			} else {
				next.add(source);
			}
			return next;
		});
	};

	const handleSearch = async () => {
		if (!query.trim()) return;

		setIsSearching(true);
		setHasSearched(true);

		try {
			// Detect user's browser language (e.g., "en-US" -> "en")
			const browserLang = navigator.language?.split("-")[0] || "en";
			
			// Only search enabled sources
			const sourcesToSearch = AVAILABLE_SOURCES.filter(s => enabledSources.has(s));
			
			const response = await fetch("/api/gigs/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: query.trim(),
					companyId,
					sources: sourcesToSearch,
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

	// Add directly to board (approved status)
	const handleAddToBoard = async (gig: ScrapedGig) => {
		setAddingGigs((prev) => new Set(prev).add(gig.id));

		try {
			const response = await fetch("/api/gigs/curated", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					gig,
					status: "approved", // Goes directly to Board
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

	// Save for later (pending status)
	const handleSaveGig = async (gig: ScrapedGig) => {
		setSavingGigs((prev) => new Set(prev).add(gig.id));

		try {
			const response = await fetch("/api/gigs/curated", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					gig,
					status: "pending", // Goes to Saved
				}),
			});

			if (response.ok) {
				setSavedGigs((prev) => new Set(prev).add(gig.id));
			}
		} catch (error) {
			console.error("Failed to save gig:", error);
		} finally {
			setSavingGigs((prev) => {
				const next = new Set(prev);
				next.delete(gig.id);
				return next;
			});
		}
	};

	return (
		<div>
			<h1 className="font-bold text-white mb-4" style={{ fontSize: '2rem' }}>
				Search for Gigs & Opportunities
			</h1>
			<p className="text-white/50 text-sm mb-6">
				Search freelance platforms for jobs, plus discover BountyBoard opportunities - service ideas for local businesses based on their pain points.
			</p>

			{/* Search Inputs */}
			<div className="flex flex-col md:flex-row gap-3 mb-4">
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

			{/* Advanced Search Toggle */}
			<button
				onClick={() => setShowAdvanced(!showAdvanced)}
				className="flex items-center gap-2 text-white/50 hover:text-white/70 text-sm mb-4 transition-colors"
			>
				<svg
					className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
				</svg>
				Advanced Search
			</button>

			{/* Advanced Search Options */}
			{showAdvanced && (
				<div className="mb-6 px-4 py-3 bg-white/5 border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center gap-4">
					{/* Location Input */}
					<div className="flex items-center gap-2">
						<label className="text-white/40 text-xs whitespace-nowrap">Location:</label>
						<input
							type="text"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder="e.g., Austin, TX"
							className="w-full md:w-48 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 text-sm"
						/>
					</div>

					{/* Divider */}
					<div className="hidden md:block w-px h-6 bg-white/10" />

					{/* Source Pills */}
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-white/40 text-xs">Sources:</span>
						{AVAILABLE_SOURCES.map((source) => {
							const info = SOURCE_INFO[source];
							const isEnabled = enabledSources.has(source);
							return (
								<button
									key={source}
									onClick={() => toggleSource(source)}
									style={{ 
										backgroundColor: isEnabled ? info.color : "transparent",
										borderColor: info.color,
									}}
									className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
										isEnabled 
											? "text-white" 
											: "text-white/50 hover:text-white/70"
									}`}
								>
									{source === "bountyboard" ? "BountyBoard" : info.name}
								</button>
							);
						})}
					</div>
				</div>
			)}

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
								onAddToBoard={() => handleAddToBoard(gig)}
								onSave={() => handleSaveGig(gig)}
								isAdding={addingGigs.has(gig.id)}
								isAdded={addedGigs.has(gig.id)}
								isSaving={savingGigs.has(gig.id)}
								isSaved={savedGigs.has(gig.id)}
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
	onAddToBoard,
	onSave,
	isAdding,
	isAdded,
	isSaving,
	isSaved,
}: {
	gig: ScrapedGig;
	onAddToBoard: () => void;
	onSave: () => void;
	isAdding: boolean;
	isAdded: boolean;
	isSaving: boolean;
	isSaved: boolean;
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
				{/* Add to Board button - goes directly to Board tab */}
				<button
					onClick={onAddToBoard}
					disabled={isAdding || isAdded}
					className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
						isAdded
							? "bg-emerald-500/20 text-emerald-400 cursor-default"
							: isAdding
							? "bg-white/10 text-white/50 cursor-wait"
							: "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
					}`}
				>
					{isAdded ? "On Board" : isAdding ? "Adding..." : "Add to Board"}
				</button>
				{/* Save button - goes to Saved tab */}
				<button
					onClick={onSave}
					disabled={isSaving || isSaved || isAdded}
					className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
						isSaved
							? "bg-blue-500/20 text-blue-400 cursor-default"
							: isAdded
							? "bg-white/5 text-white/30 cursor-default"
							: isSaving
							? "bg-white/10 text-white/50 cursor-wait"
							: "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
					}`}
				>
					{isSaved ? "Saved" : isSaving ? "..." : "Save"}
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

// Generate AI summary for BountyBoard jobs based on the service being offered
function generateAISummary(gig: ScrapedGig): string {
	const businessName = gig.clientInfo?.name || "This business";
	const businessCategory = gig.title.split(" - ").pop()?.replace(" Opportunity", "") || "business";
	
	// The service query is stored in the deadline field (repurposed)
	const serviceQuery = gig.deadline || "";
	
	if (!serviceQuery) {
		// Fallback for old format
		return `${businessName} is a potential client for your services. Reach out to discuss how you can help their business grow.`;
	}
	
	// Format the service name nicely
	const serviceName = serviceQuery
		.split(" ")
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
	
	// Generate contextual summary based on the service type
	const serviceContexts: Record<string, string> = {
		"ai": `${businessName} is a ${businessCategory} that could leverage AI to automate tasks, improve customer service, or gain insights from their data.`,
		"artificial intelligence": `${businessName} could use AI solutions to streamline operations, enhance customer experiences, or make data-driven decisions.`,
		"machine learning": `${businessName} has data from customer interactions that could be used for ML-powered recommendations, predictions, or automation.`,
		"chatbot": `${businessName} handles customer inquiries that could be automated with a chatbot, improving response times and freeing up staff.`,
		"automation": `${businessName} likely has repetitive processes that could be automated to save time and reduce errors.`,
		"data": `${businessName} generates customer and business data that could be better utilized for insights and decision-making.`,
		"analytics": `${businessName} could benefit from better analytics to understand customer behavior and optimize operations.`,
		"web": `${businessName} could use an improved web presence to attract more customers and provide better online experiences.`,
		"website": `${businessName} could benefit from a modern, professional website to establish credibility and capture leads.`,
		"seo": `${businessName} could rank higher in local search results with proper SEO, bringing in more organic customers.`,
		"marketing": `${businessName} could reach more potential customers with targeted digital marketing strategies.`,
		"social": `${businessName} could build a stronger community and brand presence through active social media engagement.`,
		"content": `${businessName} could establish thought leadership and attract customers through quality content marketing.`,
		"video": `${businessName} could showcase their services and build trust with professional video content.`,
		"crm": `${businessName} could better manage customer relationships and follow-ups with a proper CRM system.`,
		"email": `${businessName} could nurture leads and retain customers with strategic email marketing campaigns.`,
		"booking": `${businessName} could reduce no-shows and phone calls with an online booking system.`,
		"ecommerce": `${businessName} could expand their revenue by selling products or services online.`,
		"app": `${businessName} could improve customer engagement with a dedicated mobile app.`,
	};
	
	// Find matching context
	const queryLower = serviceQuery.toLowerCase();
	for (const [keyword, context] of Object.entries(serviceContexts)) {
		if (queryLower.includes(keyword)) {
			return context + " This is a great outreach opportunity!";
		}
	}
	
	// Generic but service-specific fallback
	return `${businessName} is a ${businessCategory} that could benefit from ${serviceName.toLowerCase()} services. Reach out to discuss how you can help their business.`;
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

