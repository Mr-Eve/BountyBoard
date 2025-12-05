"use client";

import { useState, useEffect } from "react";
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
	const handleAddToBoard = async (gig: ScrapedGig, aiSummary?: string) => {
		setAddingGigs((prev) => new Set(prev).add(gig.id));

		try {
			const response = await fetch("/api/gigs/curated", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					gig,
					status: "approved", // Goes directly to Board
					aiSummary, // Include AI summary for bountyboard gigs
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
	const handleSaveGig = async (gig: ScrapedGig, aiSummary?: string) => {
		setSavingGigs((prev) => new Set(prev).add(gig.id));

		try {
			const response = await fetch("/api/gigs/curated", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					gig,
					status: "pending", // Goes to Saved
					aiSummary, // Include AI summary for bountyboard gigs
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
			<h1 className="font-bold text-white mb-1" style={{ fontSize: '2rem' }}>
				Search for Gigs & Opportunities
			</h1>
			<p className="text-white/50 text-sm mb-1" style={{ fontSize: '.8rem', paddingBottom: '10px' }}>
				Search freelance platforms for jobs, plus discover service ideas from
				<br />
				 AI-curated business opportunities - businesses based on their reviews 
				<br />
				and business analysis.
				<br />
				 
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
									{source === "bountyboard" ? "AI Curated" : info.name}
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
								onAddToBoard={(aiSummary) => handleAddToBoard(gig, aiSummary)}
								onSave={(aiSummary) => handleSaveGig(gig, aiSummary)}
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
	onAddToBoard: (aiSummary?: string) => void;
	onSave: (aiSummary?: string) => void;
	isAdding: boolean;
	isAdded: boolean;
	isSaving: boolean;
	isSaved: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [aiSummary, setAiSummary] = useState<string | null>(null);
	const [isLoadingSummary, setIsLoadingSummary] = useState(false);
	const source = SOURCE_INFO[gig.source];
	const isBountyBoard = gig.source === "bountyboard";

	// Fetch AI summary for BountyBoard jobs
	useEffect(() => {
		if (!isBountyBoard || aiSummary) return;
		
		const fetchSummary = async () => {
			setIsLoadingSummary(true);
			try {
				const response = await fetch("/api/ai/summarize", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						businessName: gig.clientInfo?.name || "This business",
						businessCategory: gig.title.split(" - ").pop()?.replace(" Opportunity", "") || "business",
						serviceQuery: gig.deadline || "",
						description: gig.description,
						reviews: gig.clientInfo?.location || "",
					}),
				});
				
				if (response.ok) {
					const data = await response.json();
					setAiSummary(data.summary);
				} else {
					// Fallback to local generation
					setAiSummary(generateAISummary(gig));
				}
			} catch (error) {
				console.error("Failed to fetch AI summary:", error);
				setAiSummary(generateAISummary(gig));
			} finally {
				setIsLoadingSummary(false);
			}
		};
		
		fetchSummary();
	}, [isBountyBoard, gig, aiSummary]);

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
					className="px-2.5 py-1 rounded-md text-xs font-medium text-white flex items-center gap-1"
				>
					{isBountyBoard && <span>✦</span>}
					{isBountyBoard ? "AI Curated" : source.name}
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
			{isBountyBoard && (
				<div className="mb-3 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
					{isLoadingSummary ? (
						<div className="flex items-center gap-2">
							<svg className="animate-spin h-4 w-4 text-pink-400" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							<span className="text-sm text-pink-300">Generating AI analysis...</span>
						</div>
					) : (
						<p className="text-sm text-pink-200">
							{aiSummary}
						</p>
					)}
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
					onClick={() => onAddToBoard(aiSummary || undefined)}
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
					onClick={() => onSave(aiSummary || undefined)}
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
	const businessCategory = gig.title.split(" - ").pop()?.replace(" Opportunity", "").toLowerCase() || "business";
	
	// The service query is stored in the deadline field (repurposed)
	const serviceQuery = gig.deadline || "";
	
	if (!serviceQuery) {
		return `${businessName} is a potential client. Reach out to discuss how you can help their business grow.`;
	}
	
	const queryLower = serviceQuery.toLowerCase();
	
	// Business-specific service mappings - how each service helps specific business types
	const businessServiceMap: Record<string, Record<string, string>> = {
		// Restaurants & Food
		"restaurant": {
			"design": `${businessName} could use a menu redesign to highlight high-margin dishes, or updated branding to stand out on delivery apps where visual appeal drives orders.`,
			"web": `${businessName} needs a website with online ordering integration - restaurants without this lose 30% of potential orders to competitors.`,
			"website": `${businessName} could convert more searchers into diners with a website featuring their menu, photos of signature dishes, and easy reservation booking.`,
			"seo": `${businessName} is missing local search traffic. "Best ${businessCategory} near me" searches could bring them 50+ new customers monthly with proper SEO.`,
			"social": `${businessName} could showcase daily specials and behind-the-scenes kitchen content to build a loyal following that drives repeat visits.`,
			"photo": `${businessName} needs professional food photography - appetizing images increase online orders by up to 30%.`,
			"video": `${businessName} could create short-form content showing dish preparation to go viral on TikTok/Reels and attract younger diners.`,
			"marketing": `${businessName} could run targeted ads to nearby residents during dinner decision hours (4-6pm) when people are deciding where to eat.`,
			"app": `${businessName} could build customer loyalty with an app featuring rewards, easy reordering, and push notifications for specials.`,
			"booking": `${businessName} loses reservations when the phone goes unanswered. An online booking system captures those customers 24/7.`,
		},
		"cafe": {
			"design": `${businessName} could refresh their brand identity to attract remote workers looking for aesthetic workspaces to post on Instagram.`,
			"web": `${businessName} needs a website showing their space, menu, and WiFi availability - key factors for the remote work crowd.`,
			"social": `${businessName} could build a community of regulars by featuring customer photos and promoting their cozy atmosphere online.`,
			"photo": `${businessName} needs Instagram-worthy photos of their drinks and space to attract the social media-savvy coffee crowd.`,
		},
		"bakery": {
			"design": `${businessName} could elevate their packaging design to make their products gift-worthy and Instagram-shareable.`,
			"web": `${businessName} needs online ordering for custom cakes and pre-orders - this alone could increase revenue 40%.`,
			"photo": `${businessName} needs drool-worthy photos of their baked goods that make people stop scrolling and start ordering.`,
			"ecommerce": `${businessName} could ship signature items nationwide - many bakeries have built 6-figure online businesses this way.`,
		},
		// Health & Fitness
		"gym": {
			"design": `${businessName} could modernize their brand to compete with boutique fitness studios that are stealing their younger demographic.`,
			"web": `${businessName} needs a website with class schedules, trainer bios, and online membership signup to convert website visitors.`,
			"app": `${businessName} could increase retention with an app for class booking, workout tracking, and community challenges.`,
			"video": `${businessName} could offer on-demand workout videos as a premium membership tier, creating recurring revenue.`,
			"marketing": `${businessName} could target New Year's resolution makers and summer body seekers with seasonal ad campaigns.`,
		},
		"spa": {
			"design": `${businessName} could create a luxurious brand identity that justifies premium pricing and attracts high-end clients.`,
			"web": `${businessName} needs an elegant website with service menus, pricing, and easy online booking to capture impulse bookings.`,
			"booking": `${businessName} loses 20% of potential appointments when clients can't book outside business hours. Online booking fixes this.`,
			"photo": `${businessName} needs serene, professional imagery that conveys the relaxation experience before clients even arrive.`,
			"email": `${businessName} could drive repeat visits with automated birthday offers and "we miss you" campaigns to lapsed clients.`,
		},
		"salon": {
			"design": `${businessName} could update their brand to reflect current style trends and attract fashion-forward clients.`,
			"web": `${businessName} needs a portfolio website showcasing their stylists' work - clients want to see results before booking.`,
			"booking": `${businessName} could reduce no-shows by 50% with automated appointment reminders and easy rescheduling.`,
			"social": `${businessName} should post before/after transformations - this content consistently goes viral and drives bookings.`,
			"photo": `${businessName} needs professional before/after photos that showcase their stylists' skills and build trust.`,
		},
		"dentist": {
			"design": `${businessName} could create a friendly, modern brand that reduces dental anxiety and appeals to families.`,
			"web": `${businessName} needs a website with patient testimonials, insurance info, and online appointment requests to convert searchers.`,
			"seo": `${businessName} is losing patients to competitors ranking higher for "dentist near me" - local SEO could change this.`,
			"video": `${businessName} could create educational content about procedures to build trust and reduce patient anxiety.`,
			"marketing": `${businessName} could target new movers in the area who are actively searching for a new dentist.`,
		},
		// Professional Services
		"lawyer": {
			"design": `${businessName} could establish credibility with a professional brand identity that conveys expertise and trustworthiness.`,
			"web": `${businessName} needs a website with practice area pages, attorney bios, and case results to convert potential clients.`,
			"seo": `${businessName} could capture high-intent searches like "${businessCategory} lawyer near me" that indicate immediate need.`,
			"content": `${businessName} could establish thought leadership with legal guides that rank in search and demonstrate expertise.`,
			"video": `${businessName} could create FAQ videos answering common legal questions to build trust before the consultation.`,
		},
		"accountant": {
			"design": `${businessName} could modernize their brand to attract younger business owners who expect digital-first services.`,
			"web": `${businessName} needs a website with service packages, pricing transparency, and easy contact forms for tax season leads.`,
			"automation": `${businessName} could automate client onboarding and document collection, saving 10+ hours per week.`,
			"marketing": `${businessName} could run targeted campaigns before tax deadlines when business owners are actively seeking help.`,
		},
		// Retail
		"store": {
			"design": `${businessName} could refresh their visual identity to compete with modern DTC brands entering their market.`,
			"web": `${businessName} needs an ecommerce website to capture online sales - retail without online presence loses 40% of potential revenue.`,
			"ecommerce": `${businessName} could expand beyond local foot traffic by selling online to customers nationwide.`,
			"photo": `${businessName} needs professional product photography that makes their items look as good online as in-store.`,
			"social": `${businessName} could showcase new arrivals and style inspiration to drive both online and in-store traffic.`,
			"email": `${businessName} could drive repeat purchases with new arrival alerts and exclusive subscriber discounts.`,
		},
		"boutique": {
			"design": `${businessName} could create a cohesive brand aesthetic across packaging, tags, and social media that commands premium pricing.`,
			"web": `${businessName} needs a beautiful ecommerce site that reflects their curated in-store experience.`,
			"photo": `${businessName} needs lifestyle photography showing their products styled in aspirational settings.`,
			"social": `${businessName} could build a style-focused Instagram presence that turns followers into customers.`,
		},
		// Home Services
		"plumber": {
			"design": `${businessName} could stand out from competitors with professional truck wraps and uniforms that build trust.`,
			"web": `${businessName} needs a website with services, service areas, and emergency contact info for urgent searches.`,
			"seo": `${businessName} could dominate "emergency plumber" searches in their area - these are high-value, immediate-need customers.`,
			"marketing": `${businessName} could run Google Ads targeting homeowners searching for plumbing services right now.`,
		},
		"contractor": {
			"design": `${businessName} could create professional proposals and presentations that help win bigger contracts.`,
			"web": `${businessName} needs a portfolio website showcasing completed projects to build credibility with potential clients.`,
			"photo": `${businessName} needs before/after project photos that demonstrate the quality of their work.`,
			"video": `${businessName} could create time-lapse videos of projects that showcase their craftsmanship and go viral.`,
		},
		// Real Estate
		"realtor": {
			"design": `${businessName} could create a personal brand that stands out in a sea of generic real estate marketing.`,
			"web": `${businessName} needs an IDX-integrated website with listings and neighborhood guides to capture buyer leads.`,
			"photo": `${businessName} needs professional listing photography - homes with pro photos sell 32% faster.`,
			"video": `${businessName} could create virtual tours and neighborhood videos that attract out-of-town buyers.`,
			"social": `${businessName} could showcase listings and local expertise on social media to stay top-of-mind with potential clients.`,
			"marketing": `${businessName} could run targeted ads to likely home sellers based on home equity and length of ownership.`,
		},
	};
	
	// Service-specific fallbacks for business types not explicitly mapped
	const serviceDefaults: Record<string, (name: string, category: string) => string> = {
		"design": (name, cat) => `${name} could attract more customers with refreshed branding that communicates quality and professionalism. A cohesive visual identity across signage, menus, and digital presence builds trust and justifies premium pricing.`,
		"graphic": (name, cat) => `${name} could stand out from competitors with professional graphics for their marketing materials, social media, and storefront that catch attention and communicate their unique value.`,
		"web": (name, cat) => `${name} is losing potential customers who search online first. A professional website with clear services, pricing, and easy contact options converts searchers into paying customers.`,
		"website": (name, cat) => `${name} needs a website that works as a 24/7 salesperson - showcasing their work, answering common questions, and making it easy to take the next step.`,
		"seo": (name, cat) => `${name} could capture customers actively searching for "${cat} near me" - these high-intent searches represent people ready to buy, not just browse.`,
		"social": (name, cat) => `${name} could build a loyal community by sharing behind-the-scenes content, customer stories, and timely updates that keep them top-of-mind when people need a ${cat}.`,
		"marketing": (name, cat) => `${name} could reach their ideal customers with targeted digital ads that appear exactly when people are searching for ${cat} services in their area.`,
		"video": (name, cat) => `${name} could showcase their expertise and personality through video content that builds trust before customers ever walk through the door.`,
		"photo": (name, cat) => `${name} needs professional photography that makes their ${cat === "business" ? "products and services" : cat} look as good online as they are in person.`,
		"content": (name, cat) => `${name} could attract customers through helpful content that answers their questions and establishes ${name} as the go-to expert in their area.`,
		"email": (name, cat) => `${name} could turn one-time customers into regulars with email campaigns featuring special offers, updates, and reminders that drive repeat business.`,
		"booking": (name, cat) => `${name} is losing appointments when customers can't book outside business hours. Online booking captures these customers 24/7 and reduces no-shows with automated reminders.`,
		"app": (name, cat) => `${name} could increase customer loyalty and repeat business with a mobile app featuring easy booking, rewards, and personalized notifications.`,
		"ecommerce": (name, cat) => `${name} could expand beyond their local area by selling online, turning a local ${cat} into a business with nationwide reach.`,
		"automation": (name, cat) => `${name} could save hours every week by automating repetitive tasks like appointment reminders, follow-ups, and customer communications.`,
		"ai": (name, cat) => `${name} could use AI to automate customer inquiries, personalize recommendations, and free up staff to focus on high-value work.`,
		"chatbot": (name, cat) => `${name} could capture leads and answer common questions 24/7 with a chatbot, ensuring no customer inquiry goes unanswered.`,
		"crm": (name, cat) => `${name} could track customer interactions and automate follow-ups with a CRM, ensuring no lead falls through the cracks.`,
		"branding": (name, cat) => `${name} could command higher prices and attract better customers with professional branding that communicates quality and builds instant trust.`,
		"logo": (name, cat) => `${name} could establish a memorable identity with a professional logo that looks great on signage, business cards, and social media.`,
		"print": (name, cat) => `${name} could leave a lasting impression with professionally designed business cards, flyers, and marketing materials.`,
	};
	
	// Try to find a specific business + service match first
	for (const [bizType, services] of Object.entries(businessServiceMap)) {
		if (businessCategory.includes(bizType) || gig.title.toLowerCase().includes(bizType)) {
			for (const [serviceKey, message] of Object.entries(services)) {
				if (queryLower.includes(serviceKey)) {
					return message;
				}
			}
		}
	}
	
	// Fall back to service-specific defaults
	for (const [serviceKey, messageFn] of Object.entries(serviceDefaults)) {
		if (queryLower.includes(serviceKey)) {
			return messageFn(businessName, businessCategory);
		}
	}
	
	// Final fallback
	const serviceName = serviceQuery.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
	return `${businessName} could benefit from ${serviceName.toLowerCase()} services. Analyze their current online presence and reviews to identify specific pain points you can solve, then reach out with a tailored pitch.`;
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

