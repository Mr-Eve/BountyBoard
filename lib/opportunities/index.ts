// Business Opportunity Discovery System
// Main orchestrator for finding service opportunities

export * from "./types";
export * from "./analyzer";
export * from "./website-analyzer";
export { getGooglePlacesScraper, GooglePlacesScraper } from "./scrapers/google-places";

import type {
	Business,
	BusinessOpportunity,
	BusinessSearchParams,
	CuratedOpportunity,
	Review,
} from "./types";
import { analyzeBusinessOpportunity } from "./analyzer";
import { analyzeWebsite } from "./website-analyzer";
import { getGooglePlacesScraper } from "./scrapers/google-places";

// In-memory storage for curated opportunities (will be replaced with DB)
const curatedOpportunities = new Map<string, CuratedOpportunity>();

// Search for businesses and analyze opportunities
export async function discoverOpportunities(
	params: BusinessSearchParams,
	options?: {
		analyzeWebsites?: boolean;
		maxResults?: number;
	}
): Promise<{
	opportunities: BusinessOpportunity[];
	errors: string[];
}> {
	const errors: string[] = [];
	const opportunities: BusinessOpportunity[] = [];

	// Get Google Places scraper
	const googleScraper = getGooglePlacesScraper();

	if (!googleScraper.isConfigured()) {
		errors.push("Google Places API not configured. Set GOOGLE_PLACES_API_KEY environment variable.");
		return { opportunities, errors };
	}

	// Search for businesses
	const searchResult = await googleScraper.searchBusinesses(params);
	
	if (searchResult.error) {
		errors.push(searchResult.error);
	}

	const maxResults = options?.maxResults || 10;
	const businesses = searchResult.businesses.slice(0, maxResults);

	// Analyze each business
	for (const business of businesses) {
		try {
			// Get detailed info including reviews
			const details = await googleScraper.getBusinessDetails(business.sourceId);
			
			if (details.error) {
				errors.push(`Error fetching ${business.name}: ${details.error}`);
				continue;
			}

			if (!details.business) continue;

			const fullBusiness = details.business;
			const reviews = details.reviews;

			// Analyze website if enabled and website exists
			let websiteAnalysis = null;
			if (options?.analyzeWebsites && fullBusiness.website) {
				try {
					websiteAnalysis = await analyzeWebsite(fullBusiness.website);
				} catch (e) {
					errors.push(`Error analyzing website for ${business.name}: ${e}`);
				}
			}

			// Create opportunity analysis
			const opportunity = analyzeBusinessOpportunity(
				fullBusiness,
				reviews,
				websiteAnalysis?.missingFeatures || []
			);

			opportunities.push(opportunity);

			// Small delay to avoid rate limiting
			await new Promise(resolve => setTimeout(resolve, 200));
		} catch (error) {
			errors.push(`Error analyzing ${business.name}: ${error}`);
		}
	}

	// Sort by opportunity score
	opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

	return { opportunities, errors };
}

// Analyze a single business by URL or name
export async function analyzeBusinessByUrl(
	websiteUrl: string,
	businessInfo?: Partial<Business>
): Promise<BusinessOpportunity | null> {
	// Analyze the website
	const websiteAnalysis = await analyzeWebsite(websiteUrl);

	if (!websiteAnalysis.accessible) {
		return null;
	}

	// Create a basic business object
	const business: Business = {
		id: `manual_${Date.now()}`,
		name: businessInfo?.name || extractDomainName(websiteUrl),
		category: businessInfo?.category || "Business",
		address: businessInfo?.address || "",
		city: businessInfo?.city || "",
		country: businessInfo?.country || "",
		website: websiteUrl,
		rating: businessInfo?.rating || 0,
		reviewCount: businessInfo?.reviewCount || 0,
		source: "manual",
		sourceId: websiteUrl,
		scrapedAt: new Date().toISOString(),
	};

	// No reviews for manual analysis
	const reviews: Review[] = [];

	return analyzeBusinessOpportunity(business, reviews, websiteAnalysis.missingFeatures);
}

// Extract domain name from URL for business name fallback
function extractDomainName(url: string): string {
	try {
		const hostname = new URL(url).hostname;
		return hostname
			.replace(/^www\./, "")
			.split(".")[0]
			.replace(/-/g, " ")
			.replace(/\b\w/g, c => c.toUpperCase());
	} catch {
		return "Unknown Business";
	}
}

// Curated Opportunity Management
export async function addCuratedOpportunity(
	companyId: string,
	opportunity: BusinessOpportunity,
	status: CuratedOpportunity["status"] = "pending"
): Promise<CuratedOpportunity> {
	const curated: CuratedOpportunity = {
		id: `co_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		companyId,
		opportunity,
		status,
		addedAt: new Date().toISOString(),
	};

	curatedOpportunities.set(curated.id, curated);
	return curated;
}

export async function getCuratedOpportunities(
	companyId: string,
	status?: CuratedOpportunity["status"]
): Promise<CuratedOpportunity[]> {
	let results = Array.from(curatedOpportunities.values())
		.filter(co => co.companyId === companyId);

	if (status) {
		results = results.filter(co => co.status === status);
	}

	return results.sort((a, b) => 
		new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
	);
}

export async function updateCuratedOpportunity(
	id: string,
	updates: Partial<Pick<CuratedOpportunity, "status" | "notes" | "customPitch">>
): Promise<CuratedOpportunity | null> {
	const existing = curatedOpportunities.get(id);
	if (!existing) return null;

	const updated: CuratedOpportunity = {
		...existing,
		...updates,
		updatedAt: new Date().toISOString(),
	};

	curatedOpportunities.set(id, updated);
	return updated;
}

export async function deleteCuratedOpportunity(id: string): Promise<boolean> {
	return curatedOpportunities.delete(id);
}

// Quick opportunity check for a business
export async function quickOpportunityCheck(
	businessName: string,
	location: string
): Promise<{
	found: boolean;
	business?: Business;
	quickScore?: number;
	topIssues?: string[];
	error?: string;
}> {
	const googleScraper = getGooglePlacesScraper();

	if (!googleScraper.isConfigured()) {
		return { found: false, error: "Google Places API not configured" };
	}

	// Search for the specific business
	const searchResult = await googleScraper.searchBusinesses({
		query: businessName,
		location,
	});

	if (searchResult.error || searchResult.businesses.length === 0) {
		return { found: false, error: searchResult.error || "Business not found" };
	}

	const business = searchResult.businesses[0];

	// Quick scoring based on rating and review count
	let quickScore = 0;
	const topIssues: string[] = [];

	// Lower rating = more opportunity
	if (business.rating < 3.5) {
		quickScore += 30;
		topIssues.push("Low rating indicates customer issues");
	} else if (business.rating < 4.0) {
		quickScore += 15;
		topIssues.push("Room for improvement in customer satisfaction");
	}

	// Higher review count = more potential
	if (business.reviewCount >= 100) {
		quickScore += 20;
		topIssues.push("High visibility business with many customers");
	} else if (business.reviewCount >= 50) {
		quickScore += 10;
	}

	// No website = big opportunity
	if (!business.website) {
		quickScore += 30;
		topIssues.push("No website detected");
	}

	return {
		found: true,
		business,
		quickScore,
		topIssues,
	};
}

