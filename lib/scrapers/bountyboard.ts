// BountyBoard Scraper - Finds REAL businesses that could use your services
// Uses Google Places API to find businesses, frames opportunities around YOUR service offering

import type { Scraper, SearchOptions } from "./base";
import { generateGigId } from "./base";
import type { ScrapedGig, ScrapeResult } from "./types";
import { getGooglePlacesScraper } from "../opportunities/scrapers/google-places";
import { analyzeWebsite } from "../opportunities/website-analyzer";
import { analyzeReviews } from "../opportunities/analyzer";
import type { Business, MissingFeature } from "../opportunities/types";

// Map service keywords to business types that would benefit from that service
const SERVICE_TO_BUSINESS_SEARCH: Record<string, string[]> = {
	// AI/Tech services
	"ai": ["law firm", "accounting firm", "medical practice", "real estate agency", "insurance agency"],
	"artificial intelligence": ["law firm", "accounting firm", "medical practice", "consulting firm"],
	"machine learning": ["e-commerce", "retail", "marketing agency", "financial services"],
	"chatbot": ["restaurant", "hotel", "e-commerce", "customer service", "real estate"],
	"automation": ["law firm", "accounting", "real estate", "insurance", "medical office"],
	"data": ["retail", "restaurant", "gym", "salon", "medical practice"],
	"analytics": ["e-commerce", "restaurant", "retail", "gym", "salon"],
	
	// Web development
	"web": ["salon", "restaurant", "dentist", "gym", "spa", "contractor"],
	"website": ["salon", "restaurant", "dentist", "lawyer", "plumber", "contractor"],
	"design": ["restaurant", "boutique", "salon", "bakery", "cafe", "florist"],
	"app": ["restaurant", "gym", "salon", "medical practice", "retail"],
	
	// SEO/Marketing
	"seo": ["restaurant", "dentist", "lawyer", "plumber", "contractor", "salon"],
	"marketing": ["restaurant", "gym", "salon", "retail", "spa"],
	"social": ["restaurant", "cafe", "boutique", "salon", "bakery", "gym"],
	"content": ["law firm", "medical practice", "consulting", "real estate", "financial"],
	"video": ["restaurant", "gym", "salon", "real estate", "retail"],
	
	// Booking/CRM
	"booking": ["salon", "spa", "dentist", "doctor", "fitness", "consultant"],
	"schedule": ["salon", "consultant", "therapist", "tutor", "contractor"],
	"crm": ["real estate", "insurance", "consultant", "contractor", "law firm"],
	"email": ["retail", "restaurant", "service", "gym", "salon"],
	
	// E-commerce
	"ecommerce": ["boutique", "retail", "bakery", "artisan", "florist"],
	"store": ["boutique", "retail", "gift shop", "bakery"],
	"shop": ["boutique", "florist", "bakery", "craft"],
	"payment": ["restaurant", "salon", "contractor", "consultant"],
};

// Default location if none provided
const DEFAULT_LOCATION = "United States";

export class BountyBoardScraper implements Scraper {
	source = "bountyboard" as const;

	async search(query: string, options?: SearchOptions): Promise<ScrapeResult> {
		const gigs: ScrapedGig[] = [];
		const errors: string[] = [];

		try {
			const googleScraper = getGooglePlacesScraper();
			
			// Check if Google Places API is configured
			if (!googleScraper.isConfigured()) {
				return {
					source: "bountyboard",
					success: true,
					gigs: [{
						id: generateGigId("bountyboard", "setup_required"),
						source: "bountyboard",
						sourceUrl: "https://console.cloud.google.com/apis/credentials",
						title: "Set up Google Places API to find real business opportunities",
						description: "BountyBoard Jobs finds real local businesses that need your services. To enable this feature, add your GOOGLE_PLACES_API_KEY to your environment variables. Get a free API key from Google Cloud Console and enable the Places API.",
						skills: ["Setup Required"],
						postedAt: new Date().toISOString(),
						clientInfo: {
							name: "Configuration Needed",
							location: "Add GOOGLE_PLACES_API_KEY",
						},
						scrapedAt: new Date().toISOString(),
					}],
					scrapedAt: new Date().toISOString(),
				};
			}

			// The user's service query - this is what THEY want to sell
			const serviceQuery = query.trim();
			
			// Determine what business types would benefit from this service
			const businessTypes = this.getBusinessTypesForService(serviceQuery.toLowerCase());
			const location = (options as SearchOptionsWithLocation)?.location || DEFAULT_LOCATION;

			// Search for businesses of each type
			for (const businessType of businessTypes.slice(0, 3)) {
				try {
					const searchResult = await googleScraper.searchBusinesses({
						query: businessType,
						location,
						minReviews: 5,
					});

					if (searchResult.error) {
						errors.push(searchResult.error);
						continue;
					}

					// Analyze each business (limit to 3 per type for performance)
					for (const business of searchResult.businesses.slice(0, 3)) {
						try {
							const opportunity = await this.createServiceOpportunity(
								business,
								googleScraper,
								serviceQuery // Pass the original service query
							);
							
							if (opportunity) {
								gigs.push(opportunity);
							}

							await new Promise(resolve => setTimeout(resolve, 100));
						} catch (e) {
							console.error(`Error analyzing ${business.name}:`, e);
						}
					}
				} catch (e) {
					errors.push(`Error searching for ${businessType}: ${e}`);
				}
			}

			const limitedGigs = options?.limit ? gigs.slice(0, options.limit) : gigs;

			return {
				source: "bountyboard",
				success: true,
				gigs: limitedGigs,
				error: errors.length > 0 ? errors.join("; ") : undefined,
				scrapedAt: new Date().toISOString(),
			};
		} catch (error) {
			return {
				source: "bountyboard",
				success: false,
				gigs: [],
				error: error instanceof Error ? error.message : "Unknown error",
				scrapedAt: new Date().toISOString(),
			};
		}
	}

	// Get business types that would benefit from this service
	private getBusinessTypesForService(serviceQuery: string): string[] {
		const matchedTypes = new Set<string>();

		for (const [keyword, types] of Object.entries(SERVICE_TO_BUSINESS_SEARCH)) {
			if (serviceQuery.includes(keyword)) {
				types.forEach(t => matchedTypes.add(t));
			}
		}

		// If no matches, search for businesses that match the query directly
		// This allows searching for specific business types too
		if (matchedTypes.size === 0) {
			// Use the query itself as a business type search
			return [serviceQuery, "small business", "local business"];
		}

		return Array.from(matchedTypes);
	}

	// Create an opportunity framed around the user's service offering
	private async createServiceOpportunity(
		business: Business,
		googleScraper: ReturnType<typeof getGooglePlacesScraper>,
		serviceQuery: string
	): Promise<ScrapedGig | null> {
		// Get detailed business info including reviews
		const details = await googleScraper.getBusinessDetails(business.sourceId);
		
		if (!details.business) return null;

		const fullBusiness = details.business;
		const reviews = details.reviews;

		// Analyze website for context (but not to determine the service)
		let websiteInfo = "";
		let hasWebsite = !!fullBusiness.website;
		
		if (fullBusiness.website) {
			try {
				const websiteAnalysis = await analyzeWebsite(fullBusiness.website);
				const missingCount = websiteAnalysis.missingFeatures.filter(f => f.confidence > 0.6).length;
				if (missingCount > 0) {
					websiteInfo = `Website has ${missingCount} areas for improvement.`;
				}
			} catch {
				// Website analysis failed
			}
		} else {
			websiteInfo = "No website detected.";
		}

		// Analyze reviews for pain points (for context)
		const painPoints = analyzeReviews(reviews);
		const painPointSummary = painPoints.length > 0 
			? `${painPoints.length} customer pain points identified.`
			: "";

		// Build opportunity focused on the USER'S SERVICE
		const title = this.buildServiceTitle(fullBusiness, serviceQuery);
		const description = this.buildServiceDescription(
			fullBusiness,
			serviceQuery,
			reviews.length,
			hasWebsite,
			websiteInfo,
			painPointSummary,
			painPoints
		);

		// Skills are based on the service query, not generic analysis
		const skills = this.getSkillsForService(serviceQuery);

		return {
			id: generateGigId("bountyboard", `${fullBusiness.id}_${Date.now()}`),
			source: "bountyboard",
			sourceUrl: fullBusiness.website || `https://www.google.com/maps/place/?q=place_id:${fullBusiness.sourceId}`,
			title,
			description,
			skills,
			postedAt: new Date().toISOString(),
			clientInfo: {
				name: fullBusiness.name,
				rating: fullBusiness.rating,
				jobsPosted: fullBusiness.reviewCount,
				location: `${fullBusiness.city}${fullBusiness.phone ? ` | ${fullBusiness.phone}` : ""}`,
			},
			scrapedAt: new Date().toISOString(),
			// Store the service query for the frontend AI summary
			deadline: serviceQuery, // Repurposing this field to pass the service query
		};
	}

	// Build title focused on the service being offered
	private buildServiceTitle(business: Business, serviceQuery: string): string {
		const serviceName = this.formatServiceName(serviceQuery);
		return `${business.name} - ${serviceName} Opportunity - ${business.category}`;
	}

	// Format the service query into a readable service name
	private formatServiceName(query: string): string {
		// Capitalize and clean up the query
		const formatted = query
			.split(" ")
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
		
		// Add "Services" if it's a short query
		if (query.split(" ").length <= 2 && !query.toLowerCase().includes("service")) {
			return `${formatted} Services`;
		}
		return formatted;
	}

	// Build description focused on the service opportunity
	private buildServiceDescription(
		business: Business,
		serviceQuery: string,
		reviewCount: number,
		hasWebsite: boolean,
		websiteInfo: string,
		painPointSummary: string,
		painPoints: ReturnType<typeof analyzeReviews>
	): string {
		const parts: string[] = [];
		const serviceName = this.formatServiceName(serviceQuery);

		// Business info
		parts.push(`**${business.name}** - ${business.category} in ${business.city}`);
		if (business.phone) {
			parts.push(`Contact: ${business.phone}`);
		}
		if (business.website) {
			parts.push(`Website: ${business.website}`);
		}
		parts.push(`Rating: ${business.rating}/5 (${reviewCount} reviews)`);
		parts.push("");

		// Service opportunity framing
		parts.push(`**${serviceName} Opportunity:**`);
		parts.push(`This ${business.category.toLowerCase()} could benefit from ${serviceQuery.toLowerCase()} services.`);
		parts.push("");

		// Why this business is a good prospect
		parts.push("**Why this is a good prospect:**");
		
		if (!hasWebsite) {
			parts.push("- No website detected - may need digital presence help");
		} else if (websiteInfo) {
			parts.push(`- ${websiteInfo}`);
		}
		
		if (reviewCount > 20) {
			parts.push(`- Established business with ${reviewCount} reviews`);
		}
		
		if (business.rating < 4.5 && business.rating >= 3.5) {
			parts.push("- Room for improvement in customer satisfaction");
		}

		if (painPointSummary) {
			parts.push(`- ${painPointSummary}`);
		}

		// Show specific pain points if relevant
		if (painPoints.length > 0) {
			parts.push("");
			parts.push("**Customer feedback themes:**");
			painPoints.slice(0, 3).forEach(pp => {
				const example = pp.examplePhrases[0] || "";
				if (example) {
					parts.push(`- "${example.slice(0, 100)}..."`);
				}
			});
		}

		return parts.join("\n");
	}

	// Get skills based on the service query
	private getSkillsForService(serviceQuery: string): string[] {
		const queryLower = serviceQuery.toLowerCase();
		const skills: string[] = [];

		// AI/ML related
		if (queryLower.includes("ai") || queryLower.includes("artificial intelligence")) {
			skills.push("AI Development", "Machine Learning", "Python", "Data Analysis");
		}
		if (queryLower.includes("chatbot") || queryLower.includes("bot")) {
			skills.push("Chatbot Development", "NLP", "Conversational AI");
		}
		if (queryLower.includes("automation")) {
			skills.push("Process Automation", "Workflow Design", "Integration");
		}
		if (queryLower.includes("data") || queryLower.includes("analytics")) {
			skills.push("Data Analytics", "Business Intelligence", "Reporting");
		}
		if (queryLower.includes("machine learning") || queryLower.includes("ml")) {
			skills.push("Machine Learning", "Python", "TensorFlow", "Data Science");
		}

		// Web related
		if (queryLower.includes("web") || queryLower.includes("website")) {
			skills.push("Web Development", "HTML/CSS", "JavaScript", "Responsive Design");
		}
		if (queryLower.includes("design")) {
			skills.push("UI/UX Design", "Graphic Design", "Branding");
		}
		if (queryLower.includes("app")) {
			skills.push("App Development", "Mobile Development", "React Native");
		}

		// Marketing related
		if (queryLower.includes("seo")) {
			skills.push("SEO", "Content Strategy", "Google Analytics", "Keyword Research");
		}
		if (queryLower.includes("marketing")) {
			skills.push("Digital Marketing", "Content Marketing", "Strategy");
		}
		if (queryLower.includes("social")) {
			skills.push("Social Media Marketing", "Content Creation", "Community Management");
		}
		if (queryLower.includes("content")) {
			skills.push("Content Writing", "Copywriting", "Content Strategy");
		}
		if (queryLower.includes("video")) {
			skills.push("Video Production", "Video Editing", "Motion Graphics");
		}

		// Business services
		if (queryLower.includes("crm")) {
			skills.push("CRM Implementation", "Salesforce", "HubSpot");
		}
		if (queryLower.includes("email")) {
			skills.push("Email Marketing", "Mailchimp", "Campaign Management");
		}
		if (queryLower.includes("booking") || queryLower.includes("schedule")) {
			skills.push("Booking Systems", "Calendar Integration", "Automation");
		}

		// E-commerce
		if (queryLower.includes("ecommerce") || queryLower.includes("store") || queryLower.includes("shop")) {
			skills.push("E-commerce", "Shopify", "WooCommerce", "Payment Integration");
		}

		// If no specific skills matched, use the query itself
		if (skills.length === 0) {
			skills.push(this.formatServiceName(serviceQuery));
		}

		return skills.slice(0, 5);
	}
}

// Extended search options with location
interface SearchOptionsWithLocation extends SearchOptions {
	location?: string;
}
