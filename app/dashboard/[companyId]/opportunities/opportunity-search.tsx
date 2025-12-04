"use client";

import { useState } from "react";
import type { BusinessOpportunity, PainPoint, MissingFeature, ServiceSuggestion } from "@/lib/opportunities/types";

interface OpportunitySearchSectionProps {
	companyId: string;
}

export function OpportunitySearchSection({ companyId }: OpportunitySearchSectionProps) {
	const [businessType, setBusinessType] = useState("");
	const [location, setLocation] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [results, setResults] = useState<BusinessOpportunity[]>([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);
	const [addingOpps, setAddingOpps] = useState<Set<string>>(new Set());
	const [addedOpps, setAddedOpps] = useState<Set<string>>(new Set());

	// Website URL analysis
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [websiteResult, setWebsiteResult] = useState<BusinessOpportunity | null>(null);

	const handleSearch = async () => {
		if (!businessType.trim() || !location.trim()) return;

		setIsSearching(true);
		setHasSearched(true);
		setErrors([]);

		try {
			const response = await fetch("/api/opportunities/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: businessType.trim(),
					location: location.trim(),
					options: {
						analyzeWebsites: true,
						maxResults: 10,
					},
				}),
			});

			const data = await response.json();
			if (data.success) {
				setResults(data.opportunities);
				if (data.errors) {
					setErrors(data.errors);
				}
			} else {
				setErrors([data.error || "Search failed"]);
			}
		} catch (error) {
			console.error("Search failed:", error);
			setErrors(["Failed to search for opportunities"]);
		} finally {
			setIsSearching(false);
		}
	};

	const handleAnalyzeWebsite = async () => {
		if (!websiteUrl.trim()) return;

		setIsAnalyzing(true);
		setWebsiteResult(null);

		try {
			const response = await fetch("/api/opportunities/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					websiteUrl: websiteUrl.trim(),
				}),
			});

			const data = await response.json();
			if (data.success) {
				setWebsiteResult(data.opportunity);
			} else {
				setErrors([data.error || "Analysis failed"]);
			}
		} catch (error) {
			console.error("Analysis failed:", error);
			setErrors(["Failed to analyze website"]);
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleAddOpportunity = async (opportunity: BusinessOpportunity) => {
		setAddingOpps((prev) => new Set(prev).add(opportunity.id));

		try {
			const response = await fetch("/api/opportunities/curated", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					companyId,
					opportunity,
					status: "pending",
				}),
			});

			if (response.ok) {
				setAddedOpps((prev) => new Set(prev).add(opportunity.id));
			}
		} catch (error) {
			console.error("Failed to add opportunity:", error);
		} finally {
			setAddingOpps((prev) => {
				const next = new Set(prev);
				next.delete(opportunity.id);
				return next;
			});
		}
	};

	return (
		<div className="space-y-8">
			{/* Business Search */}
			<div className="bg-white/5 border border-white/10 rounded-2xl p-6">
				<h3 className="text-lg font-semibold text-white mb-4">
					Search Local Businesses
				</h3>
				<p className="text-white/50 text-sm mb-6">
					Find businesses in a specific area and analyze their reviews for service opportunities.
				</p>

				<div className="grid md:grid-cols-2 gap-4 mb-4">
					<div>
						<label className="block text-sm text-white/50 mb-2">Business Type</label>
						<input
							type="text"
							value={businessType}
							onChange={(e) => setBusinessType(e.target.value)}
							placeholder="e.g., salons, restaurants, dentists"
							className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
						/>
					</div>
					<div>
						<label className="block text-sm text-white/50 mb-2">Location</label>
						<input
							type="text"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder="e.g., Austin, TX or London, UK"
							className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
						/>
					</div>
				</div>

				<button
					onClick={handleSearch}
					disabled={isSearching || !businessType.trim() || !location.trim()}
					className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSearching ? (
						<span className="flex items-center gap-2">
							<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
							</svg>
							Searching & Analyzing...
						</span>
					) : (
						"Search Businesses"
					)}
				</button>

				<p className="mt-3 text-xs text-white/30">
					Requires GOOGLE_PLACES_API_KEY environment variable
				</p>
			</div>

			{/* Website Analysis */}
			<div className="bg-white/5 border border-white/10 rounded-2xl p-6">
				<h3 className="text-lg font-semibold text-white mb-4">
					Analyze a Website
				</h3>
				<p className="text-white/50 text-sm mb-6">
					Enter a business website URL to detect missing features and service opportunities.
				</p>

				<div className="flex gap-4">
					<input
						type="url"
						value={websiteUrl}
						onChange={(e) => setWebsiteUrl(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleAnalyzeWebsite()}
						placeholder="https://example.com"
						className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
					/>
					<button
						onClick={handleAnalyzeWebsite}
						disabled={isAnalyzing || !websiteUrl.trim()}
						className="px-6 py-3 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isAnalyzing ? "Analyzing..." : "Analyze"}
					</button>
				</div>

				{/* Website Analysis Result */}
				{websiteResult && (
					<div className="mt-6">
						<OpportunityCard
							opportunity={websiteResult}
							onAdd={() => handleAddOpportunity(websiteResult)}
							isAdding={addingOpps.has(websiteResult.id)}
							isAdded={addedOpps.has(websiteResult.id)}
						/>
					</div>
				)}
			</div>

			{/* Errors */}
			{errors.length > 0 && (
				<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
					<p className="text-red-400 font-medium mb-2">Issues encountered:</p>
					<ul className="text-sm text-red-300/70 space-y-1">
						{errors.map((error, i) => (
							<li key={i}>- {error}</li>
						))}
					</ul>
				</div>
			)}

			{/* Search Results */}
			{hasSearched && (
				<div>
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-medium text-white">
							{isSearching
								? "Searching..."
								: results.length > 0
								? `Found ${results.length} opportunities`
								: "No opportunities found"}
						</h3>
					</div>

					{isSearching && (
						<div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
							<div className="flex flex-col items-center gap-3">
								<svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
								<p className="text-white/50">
									Searching businesses and analyzing reviews...
								</p>
								<p className="text-white/30 text-sm">
									This may take a moment
								</p>
							</div>
						</div>
					)}

					{!isSearching && results.length === 0 && (
						<div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
							<p className="text-white/50">
								No opportunities found. Try a different business type or location.
							</p>
						</div>
					)}

					<div className="space-y-4">
						{results.map((opportunity) => (
							<OpportunityCard
								key={opportunity.id}
								opportunity={opportunity}
								onAdd={() => handleAddOpportunity(opportunity)}
								isAdding={addingOpps.has(opportunity.id)}
								isAdded={addedOpps.has(opportunity.id)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function OpportunityCard({
	opportunity,
	onAdd,
	isAdding,
	isAdded,
}: {
	opportunity: BusinessOpportunity;
	onAdd: () => void;
	isAdding: boolean;
	isAdded: boolean;
}) {
	const { business, painPoints, missingFeatures, suggestedServices, opportunityScore, priorityLevel } = opportunity;

	const priorityColors = {
		high: "bg-red-500/20 text-red-400 border-red-500/30",
		medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
		low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
	};

	return (
		<div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all">
			{/* Header */}
			<div className="flex items-start justify-between gap-4 mb-4">
				<div className="flex-1">
					<div className="flex items-center gap-3 mb-2">
						<h4 className="text-xl font-semibold text-white">{business.name}</h4>
						<span className={`px-2 py-1 rounded-lg text-xs font-medium border ${priorityColors[priorityLevel]}`}>
							{priorityLevel.toUpperCase()} PRIORITY
						</span>
					</div>
					<div className="flex items-center gap-4 text-sm text-white/50">
						<span>{business.category}</span>
						<span>{business.city}</span>
						{business.rating > 0 && (
							<span className="flex items-center gap-1">
								{business.rating.toFixed(1)} stars ({business.reviewCount} reviews)
							</span>
						)}
					</div>
				</div>
				<div className="text-right">
					<div className="text-3xl font-bold text-purple-400">{opportunityScore}</div>
					<div className="text-xs text-white/40">Opportunity Score</div>
				</div>
			</div>

			{/* Contact Info */}
			<div className="flex flex-wrap gap-4 mb-4 text-sm">
				{business.website && (
					<a
						href={business.website}
						target="_blank"
						rel="noopener noreferrer"
						className="text-purple-400 hover:text-purple-300"
					>
						{new URL(business.website).hostname}
					</a>
				)}
				{business.phone && (
					<span className="text-white/50">{business.phone}</span>
				)}
			</div>

			{/* Pain Points */}
			{painPoints.length > 0 && (
				<div className="mb-4">
					<h5 className="text-sm font-medium text-white/70 mb-2">
						Pain Points from Reviews ({painPoints.length})
					</h5>
					<div className="flex flex-wrap gap-2">
						{painPoints.slice(0, 5).map((pp) => (
							<PainPointBadge key={pp.category} painPoint={pp} />
						))}
					</div>
				</div>
			)}

			{/* Missing Features */}
			{missingFeatures.length > 0 && (
				<div className="mb-4">
					<h5 className="text-sm font-medium text-white/70 mb-2">
						Missing Website Features ({missingFeatures.length})
					</h5>
					<div className="flex flex-wrap gap-2">
						{missingFeatures.slice(0, 5).map((mf) => (
							<MissingFeatureBadge key={mf.feature} feature={mf} />
						))}
					</div>
				</div>
			)}

			{/* Suggested Services */}
			{suggestedServices.length > 0 && (
				<div className="mb-4">
					<h5 className="text-sm font-medium text-white/70 mb-2">
						Suggested Services
					</h5>
					<div className="space-y-2">
						{suggestedServices.slice(0, 3).map((suggestion) => (
							<ServiceSuggestionCard key={suggestion.service.id} suggestion={suggestion} />
						))}
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
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
					{isAdded ? "Added to List" : isAdding ? "Adding..." : "Add to Board"}
				</button>
				{business.website && (
					<a
						href={business.website}
						target="_blank"
						rel="noopener noreferrer"
						className="px-4 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all"
					>
						Visit Website
					</a>
				)}
			</div>
		</div>
	);
}

function PainPointBadge({ painPoint }: { painPoint: PainPoint }) {
	const categoryLabels: Record<string, string> = {
		booking_issues: "Booking Issues",
		website_problems: "Website Problems",
		slow_response: "Slow Response",
		communication: "Communication",
		online_presence: "Online Presence",
		pricing_clarity: "Pricing Clarity",
		payment_options: "Payment Options",
		customer_service: "Customer Service",
		wait_times: "Wait Times",
		accessibility: "Accessibility",
		information_missing: "Missing Info",
		social_media: "Social Media",
		mobile_experience: "Mobile Experience",
		other: "Other",
	};

	return (
		<div className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-medium flex items-center gap-2">
			<span>{categoryLabels[painPoint.category] || painPoint.category}</span>
			<span className="px-1.5 py-0.5 bg-purple-500/30 rounded text-[10px]">
				{painPoint.count}x
			</span>
		</div>
	);
}

function MissingFeatureBadge({ feature }: { feature: MissingFeature }) {
	const featureLabels: Record<string, string> = {
		online_booking: "Online Booking",
		contact_form: "Contact Form",
		live_chat: "Live Chat",
		newsletter_signup: "Newsletter",
		gift_cards: "Gift Cards",
		online_ordering: "Online Ordering",
		pricing_page: "Pricing Page",
		faq_page: "FAQ Page",
		testimonials: "Testimonials",
		ssl_certificate: "SSL Certificate",
		mobile_responsive: "Mobile Responsive",
		social_integration: "Social Links",
		google_analytics: "Analytics",
		schema_markup: "Schema Markup",
		sitemap: "Sitemap",
		blog: "Blog",
	};

	return (
		<div className="px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded-lg text-xs font-medium">
			{featureLabels[feature.feature] || feature.feature}
		</div>
	);
}

function ServiceSuggestionCard({ suggestion }: { suggestion: ServiceSuggestion }) {
	return (
		<div className="p-3 bg-white/5 rounded-lg">
			<div className="flex items-center justify-between mb-1">
				<span className="font-medium text-white text-sm">{suggestion.service.name}</span>
				<span className="text-amber-400 text-sm font-medium">{suggestion.service.estimatedValue}</span>
			</div>
			<p className="text-xs text-white/50 line-clamp-2">{suggestion.pitchSummary}</p>
		</div>
	);
}

