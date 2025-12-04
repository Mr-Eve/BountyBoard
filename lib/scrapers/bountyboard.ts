// BountyBoard Scraper - Finds REAL businesses lacking services you can offer
// Uses Google Places API to find businesses, analyzes their websites for missing features

import type { Scraper, SearchOptions } from "./base";
import { generateGigId } from "./base";
import type { ScrapedGig, ScrapeResult } from "./types";
import { getGooglePlacesScraper } from "../opportunities/scrapers/google-places";
import { analyzeWebsite } from "../opportunities/website-analyzer";
import { analyzeReviews, generateServiceSuggestions } from "../opportunities/analyzer";
import type { Business, Review, MissingFeature, ServiceSuggestion } from "../opportunities/types";

// Map service keywords to business types to search for
const SERVICE_TO_BUSINESS_SEARCH: Record<string, string[]> = {
	// Web development
	"web": ["salon", "restaurant", "dentist", "gym", "spa"],
	"website": ["salon", "restaurant", "dentist", "lawyer", "plumber"],
	"design": ["restaurant", "boutique", "salon", "bakery", "cafe"],
	
	// SEO/Marketing
	"seo": ["restaurant", "dentist", "lawyer", "plumber", "contractor"],
	"marketing": ["restaurant", "gym", "salon", "retail"],
	"social": ["restaurant", "cafe", "boutique", "salon", "bakery"],
	
	// Booking systems
	"booking": ["salon", "spa", "dentist", "doctor", "fitness"],
	"schedule": ["salon", "consultant", "therapist", "tutor"],
	"appointment": ["dentist", "doctor", "salon", "spa", "clinic"],
	
	// Automation
	"chatbot": ["restaurant", "hotel", "ecommerce"],
	"automation": ["real estate", "insurance", "agency"],
	"crm": ["real estate", "insurance", "consultant"],
	"email": ["retail", "restaurant", "service"],
	
	// E-commerce
	"ecommerce": ["boutique", "retail", "bakery", "artisan"],
	"store": ["boutique", "retail", "gift shop"],
	"shop": ["boutique", "florist", "bakery"],
};

// Default location if none provided (can be overridden)
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
				// Return helpful message about needing API key
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

			// Determine what business types to search for based on query
			const businessTypes = this.getBusinessTypesForQuery(query.toLowerCase());
			const location = (options as SearchOptionsWithLocation)?.location || DEFAULT_LOCATION;

			// Search for businesses of each type
			for (const businessType of businessTypes.slice(0, 3)) { // Limit to 3 types
				try {
					const searchResult = await googleScraper.searchBusinesses({
						query: businessType,
						location,
						minReviews: 5, // Only businesses with some reviews
					});

					if (searchResult.error) {
						errors.push(searchResult.error);
						continue;
					}

					// Analyze each business (limit to 3 per type for performance)
					for (const business of searchResult.businesses.slice(0, 3)) {
						try {
							const opportunity = await this.analyzeBusinessOpportunity(
								business,
								googleScraper,
								query
							);
							
							if (opportunity) {
								gigs.push(opportunity);
							}

							// Small delay to avoid rate limiting
							await new Promise(resolve => setTimeout(resolve, 100));
						} catch (e) {
							// Skip this business on error
							console.error(`Error analyzing ${business.name}:`, e);
						}
					}
				} catch (e) {
					errors.push(`Error searching for ${businessType}: ${e}`);
				}
			}

			// Apply limit
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

	// Get business types to search based on query keywords
	private getBusinessTypesForQuery(query: string): string[] {
		const matchedTypes = new Set<string>();

		for (const [keyword, types] of Object.entries(SERVICE_TO_BUSINESS_SEARCH)) {
			if (query.includes(keyword)) {
				types.forEach(t => matchedTypes.add(t));
			}
		}

		// Default types if no matches
		if (matchedTypes.size === 0) {
			return ["salon", "restaurant", "dentist"];
		}

		return Array.from(matchedTypes);
	}

	// Analyze a business and create an opportunity gig if there are issues
	private async analyzeBusinessOpportunity(
		business: Business,
		googleScraper: ReturnType<typeof getGooglePlacesScraper>,
		serviceQuery: string
	): Promise<ScrapedGig | null> {
		// Get detailed business info including reviews
		const details = await googleScraper.getBusinessDetails(business.sourceId);
		
		if (!details.business) return null;

		const fullBusiness = details.business;
		const reviews = details.reviews;

		// Analyze website if available
		let missingFeatures: MissingFeature[] = [];
		if (fullBusiness.website) {
			try {
				const websiteAnalysis = await analyzeWebsite(fullBusiness.website);
				missingFeatures = websiteAnalysis.missingFeatures.filter(f => f.confidence > 0.6);
			} catch {
				// Website analysis failed, continue without it
			}
		} else {
			// No website is a big opportunity!
			missingFeatures = [{
				feature: "online_booking",
				confidence: 1,
				searchedFor: ["website"],
				recommendation: "Business has no website - huge opportunity for web development",
			}];
		}

		// Analyze reviews for pain points
		const painPoints = analyzeReviews(reviews);

		// Generate service suggestions
		const suggestions = generateServiceSuggestions(painPoints, missingFeatures);

		// Only create opportunity if there are real issues to solve
		if (suggestions.length === 0 && missingFeatures.length === 0 && painPoints.length === 0) {
			return null;
		}

		// Find the most relevant suggestion based on search query
		const relevantSuggestion = this.findRelevantSuggestion(suggestions, serviceQuery);
		
		// Build the opportunity description
		const description = this.buildOpportunityDescription(
			fullBusiness,
			relevantSuggestion,
			painPoints,
			missingFeatures,
			reviews.length
		);

		// Determine estimated value
		const estimatedValue = relevantSuggestion?.service.estimatedValue || "$500 - $2,000";

		return {
			id: generateGigId("bountyboard", `${fullBusiness.id}_${Date.now()}`),
			source: "bountyboard",
			sourceUrl: fullBusiness.website || `https://www.google.com/maps/place/?q=place_id:${fullBusiness.sourceId}`,
			title: this.buildOpportunityTitle(fullBusiness, relevantSuggestion, missingFeatures),
			description,
			budget: this.parseEstimatedValue(estimatedValue),
			skills: relevantSuggestion?.service.keywords || this.getSkillsFromFeatures(missingFeatures),
			postedAt: new Date().toISOString(),
			clientInfo: {
				name: fullBusiness.name,
				rating: fullBusiness.rating,
				jobsPosted: fullBusiness.reviewCount,
				location: `${fullBusiness.city}${fullBusiness.phone ? ` | ${fullBusiness.phone}` : ""}`,
			},
			scrapedAt: new Date().toISOString(),
		};
	}

	// Find the most relevant service suggestion based on search query
	private findRelevantSuggestion(
		suggestions: ServiceSuggestion[],
		query: string
	): ServiceSuggestion | undefined {
		const queryLower = query.toLowerCase();
		
		// Try to find a suggestion that matches the query
		for (const suggestion of suggestions) {
			const keywords = suggestion.service.keywords.map(k => k.toLowerCase());
			if (keywords.some(k => queryLower.includes(k) || k.includes(queryLower))) {
				return suggestion;
			}
		}

		// Return highest relevance suggestion
		return suggestions[0];
	}

	// Build a descriptive title for the opportunity
	private buildOpportunityTitle(
		business: Business,
		suggestion: ServiceSuggestion | undefined,
		missingFeatures: MissingFeature[]
	): string {
		if (!business.website) {
			return `${business.name} needs a website - ${business.category} in ${business.city}`;
		}

		if (suggestion) {
			return `${business.name} needs ${suggestion.service.name} - ${business.category}`;
		}

		if (missingFeatures.length > 0) {
			const feature = this.formatFeatureName(missingFeatures[0].feature);
			return `${business.name} missing ${feature} - ${business.category}`;
		}

		return `Service opportunity at ${business.name} - ${business.category}`;
	}

	// Build detailed description with contact info and pain points
	private buildOpportunityDescription(
		business: Business,
		suggestion: ServiceSuggestion | undefined,
		painPoints: ReturnType<typeof analyzeReviews>,
		missingFeatures: MissingFeature[],
		reviewCount: number
	): string {
		const parts: string[] = [];

		// Business info with contact
		parts.push(`**${business.name}** - ${business.category} in ${business.city}`);
		
		if (business.phone) {
			parts.push(`Contact: ${business.phone}`);
		}
		if (business.website) {
			parts.push(`Website: ${business.website}`);
		}
		parts.push(`Rating: ${business.rating}/5 (${reviewCount} reviews)`);
		parts.push("");

		// What they need
		if (suggestion) {
			parts.push(`**Opportunity:** ${suggestion.service.description}`);
			parts.push(`**Estimated Value:** ${suggestion.service.estimatedValue}`);
			parts.push("");
		}

		// Missing features
		if (missingFeatures.length > 0) {
			parts.push("**Missing from website:**");
			missingFeatures.slice(0, 4).forEach(f => {
				parts.push(`- ${this.formatFeatureName(f.feature)}: ${f.recommendation}`);
			});
			parts.push("");
		}

		// Pain points from reviews
		if (painPoints.length > 0) {
			parts.push("**Issues mentioned in reviews:**");
			painPoints.slice(0, 3).forEach(pp => {
				const example = pp.examplePhrases[0] || "";
				parts.push(`- ${this.formatPainPoint(pp.category)} (${pp.count}x): "${example.slice(0, 80)}..."`);
			});
		}

		return parts.join("\n");
	}

	// Format feature type to readable name
	private formatFeatureName(feature: string): string {
		const names: Record<string, string> = {
			online_booking: "Online Booking",
			contact_form: "Contact Form",
			live_chat: "Live Chat",
			newsletter_signup: "Newsletter Signup",
			gift_cards: "Gift Cards",
			online_ordering: "Online Ordering",
			pricing_page: "Pricing Page",
			faq_page: "FAQ Page",
			testimonials: "Testimonials",
			ssl_certificate: "SSL Certificate",
			mobile_responsive: "Mobile Responsive",
			social_integration: "Social Media Links",
			google_analytics: "Analytics",
			schema_markup: "SEO Schema",
			blog: "Blog",
		};
		return names[feature] || feature.replace(/_/g, " ");
	}

	// Format pain point category to readable name
	private formatPainPoint(category: string): string {
		const names: Record<string, string> = {
			booking_issues: "Booking problems",
			website_problems: "Website issues",
			slow_response: "Slow response",
			communication: "Communication",
			online_presence: "Hard to find online",
			pricing_clarity: "Unclear pricing",
			payment_options: "Payment issues",
			customer_service: "Service complaints",
			wait_times: "Long wait times",
		};
		return names[category] || category.replace(/_/g, " ");
	}

	// Get skills from missing features
	private getSkillsFromFeatures(features: MissingFeature[]): string[] {
		const skillMap: Record<string, string[]> = {
			online_booking: ["Booking Systems", "Web Development"],
			contact_form: ["Web Development", "Forms"],
			live_chat: ["Chatbots", "Customer Service"],
			newsletter_signup: ["Email Marketing", "Mailchimp"],
			online_ordering: ["E-commerce", "Web Development"],
			pricing_page: ["Copywriting", "Web Design"],
			ssl_certificate: ["Web Security", "DevOps"],
			mobile_responsive: ["Responsive Design", "CSS"],
			social_integration: ["Social Media", "Web Development"],
			google_analytics: ["Analytics", "SEO"],
			blog: ["Content Writing", "SEO"],
		};

		const skills = new Set<string>();
		for (const feature of features) {
			const featureSkills = skillMap[feature.feature] || ["Web Development"];
			featureSkills.forEach(s => skills.add(s));
		}
		return Array.from(skills).slice(0, 5);
	}

	private parseEstimatedValue(value: string): ScrapedGig["budget"] {
		const match = value.match(/\$([0-9,]+)\s*-?\s*\$?([0-9,]+)?/);
		if (match) {
			const min = parseInt(match[1].replace(/,/g, ""), 10);
			const max = match[2] ? parseInt(match[2].replace(/,/g, ""), 10) : min;
			const isRecurring = value.includes("/month");
			return {
				min,
				max,
				type: isRecurring ? "hourly" : "fixed",
				currency: "USD",
			};
		}
		return undefined;
	}
}

// Extended search options with location
interface SearchOptionsWithLocation extends SearchOptions {
	location?: string;
}
