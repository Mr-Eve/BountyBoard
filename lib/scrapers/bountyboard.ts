// BountyBoard Scraper - Generates service opportunities from business analysis
// These are AI-discovered jobs based on business pain points and missing features

import type { Scraper, SearchOptions } from "./base";
import { generateGigId } from "./base";
import type { ScrapedGig, ScrapeResult } from "./types";
import { 
	analyzeBusinessByUrl,
	type BusinessOpportunity,
	type ServiceSuggestion,
} from "../opportunities";

// Service keywords to business type mapping for search
const SERVICE_TO_BUSINESS_MAP: Record<string, string[]> = {
	// Web development related
	"web": ["restaurants", "salons", "dentists", "lawyers", "gyms"],
	"website": ["restaurants", "salons", "dentists", "lawyers", "gyms"],
	"developer": ["small businesses", "startups", "agencies"],
	"design": ["restaurants", "boutiques", "salons", "photographers"],
	
	// Marketing related
	"seo": ["restaurants", "dentists", "lawyers", "plumbers", "contractors"],
	"marketing": ["restaurants", "gyms", "salons", "retail stores"],
	"social media": ["restaurants", "cafes", "boutiques", "salons"],
	
	// Booking/scheduling
	"booking": ["salons", "spas", "dentists", "doctors", "fitness studios"],
	"scheduling": ["salons", "consultants", "therapists", "tutors"],
	"appointment": ["dentists", "doctors", "salons", "spas"],
	
	// Communication
	"chatbot": ["ecommerce", "restaurants", "hotels", "customer service"],
	"automation": ["small businesses", "agencies", "consultants"],
	"crm": ["real estate", "insurance", "consultants", "agencies"],
	
	// E-commerce
	"ecommerce": ["boutiques", "retail", "artisans", "bakeries"],
	"online store": ["boutiques", "retail", "crafts", "food producers"],
	"payment": ["restaurants", "services", "freelancers"],
};

// Sample businesses to analyze for demo (when no Google Places API)
const DEMO_WEBSITES = [
	{ url: "https://example-salon.com", name: "Local Salon", category: "Beauty Salon" },
	{ url: "https://example-restaurant.com", name: "Local Restaurant", category: "Restaurant" },
	{ url: "https://example-dentist.com", name: "Local Dentist", category: "Dental" },
];

export class BountyBoardScraper implements Scraper {
	source = "bountyboard" as const;

	async search(query: string, options?: SearchOptions): Promise<ScrapeResult> {
		try {
			const gigs: ScrapedGig[] = [];
			const queryLower = query.toLowerCase();

			// Generate opportunity-based gigs from the query
			// These represent potential services you could offer to businesses
			const opportunities = this.generateOpportunitiesFromQuery(queryLower);

			for (const opp of opportunities) {
				const gig = this.opportunityToGig(opp);
				gigs.push(gig);
			}

			// Apply limit
			const limitedGigs = options?.limit ? gigs.slice(0, options.limit) : gigs;

			return {
				source: "bountyboard",
				success: true,
				gigs: limitedGigs,
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

	// Generate opportunities based on search query
	private generateOpportunitiesFromQuery(query: string): GeneratedOpportunity[] {
		const opportunities: GeneratedOpportunity[] = [];
		const matchedBusinessTypes = new Set<string>();

		// Find relevant business types based on query
		for (const [keyword, businessTypes] of Object.entries(SERVICE_TO_BUSINESS_MAP)) {
			if (query.includes(keyword)) {
				businessTypes.forEach(bt => matchedBusinessTypes.add(bt));
			}
		}

		// If no specific matches, use generic business types
		if (matchedBusinessTypes.size === 0) {
			matchedBusinessTypes.add("local businesses");
			matchedBusinessTypes.add("small businesses");
		}

		// Generate opportunities for each business type
		for (const businessType of matchedBusinessTypes) {
			const opps = this.generateOpportunitiesForBusinessType(query, businessType);
			opportunities.push(...opps);
		}

		return opportunities;
	}

	private generateOpportunitiesForBusinessType(query: string, businessType: string): GeneratedOpportunity[] {
		const opportunities: GeneratedOpportunity[] = [];
		const queryLower = query.toLowerCase();

		// Website/Design opportunities
		if (queryLower.includes("web") || queryLower.includes("design") || queryLower.includes("developer")) {
			opportunities.push({
				title: `Website Redesign for ${this.capitalize(businessType)}`,
				description: `Many ${businessType} have outdated websites that hurt their business. Offer modern, mobile-responsive website redesigns with clear calls-to-action, online booking integration, and SEO optimization. Common pain points include: confusing navigation, no mobile support, missing contact info, and slow load times.`,
				service: "Website Redesign",
				businessType,
				estimatedValue: "$2,000 - $10,000",
				painPoints: ["Outdated website", "Not mobile-friendly", "Hard to navigate", "Missing information"],
				skills: ["Web Development", "UI/UX Design", "SEO", "Responsive Design"],
			});
		}

		// Booking system opportunities
		if (queryLower.includes("book") || queryLower.includes("schedul") || queryLower.includes("appointment")) {
			opportunities.push({
				title: `Online Booking System for ${this.capitalize(businessType)}`,
				description: `${this.capitalize(businessType)} often lose customers because they can't book online. Implement booking systems like Calendly, Acuity, or custom solutions. Reviews frequently mention: "hard to book", "phone always busy", "couldn't schedule online". This is a quick win with recurring revenue potential.`,
				service: "Online Booking System",
				businessType,
				estimatedValue: "$500 - $2,000",
				painPoints: ["No online booking", "Phone always busy", "Hard to schedule", "Lost appointments"],
				skills: ["Booking Systems", "API Integration", "Calendar Management"],
			});
		}

		// SEO opportunities
		if (queryLower.includes("seo") || queryLower.includes("google") || queryLower.includes("search")) {
			opportunities.push({
				title: `Local SEO for ${this.capitalize(businessType)}`,
				description: `Many ${businessType} are invisible on Google. Offer Google Business Profile optimization, local citations, review management, and on-page SEO. Common complaints: "couldn't find them online", "wrong hours listed", "no website shows up". Local SEO has great recurring revenue potential.`,
				service: "Local SEO",
				businessType,
				estimatedValue: "$500 - $1,500/month",
				painPoints: ["Not found on Google", "Wrong business info online", "No reviews", "Competitors rank higher"],
				skills: ["SEO", "Google Business Profile", "Content Writing", "Analytics"],
			});
		}

		// Social media opportunities
		if (queryLower.includes("social") || queryLower.includes("marketing") || queryLower.includes("instagram") || queryLower.includes("facebook")) {
			opportunities.push({
				title: `Social Media Management for ${this.capitalize(businessType)}`,
				description: `${this.capitalize(businessType)} struggle to maintain social media presence. Offer content creation, posting schedules, engagement management, and paid advertising. Pain points include: inactive accounts, no engagement, missing platforms, inconsistent branding.`,
				service: "Social Media Management",
				businessType,
				estimatedValue: "$500 - $2,000/month",
				painPoints: ["Inactive social media", "No engagement", "Inconsistent posting", "No paid ads strategy"],
				skills: ["Social Media", "Content Creation", "Copywriting", "Paid Advertising"],
			});
		}

		// Automation/CRM opportunities
		if (queryLower.includes("automat") || queryLower.includes("crm") || queryLower.includes("email")) {
			opportunities.push({
				title: `Customer Automation for ${this.capitalize(businessType)}`,
				description: `${this.capitalize(businessType)} often have slow response times and miss follow-ups. Implement CRM systems, email automation, chatbots, and review request sequences. Reviews mention: "never replied", "slow response", "no confirmation email". High value, recurring revenue opportunity.`,
				service: "CRM & Automation",
				businessType,
				estimatedValue: "$1,000 - $3,000",
				painPoints: ["Slow response times", "Missed follow-ups", "No automated emails", "Lost leads"],
				skills: ["CRM Systems", "Email Marketing", "Automation", "Chatbots"],
			});
		}

		// E-commerce opportunities
		if (queryLower.includes("ecommerce") || queryLower.includes("store") || queryLower.includes("shop") || queryLower.includes("sell")) {
			opportunities.push({
				title: `E-commerce Setup for ${this.capitalize(businessType)}`,
				description: `Many ${businessType} want to sell online but don't know how. Offer Shopify/WooCommerce setup, product photography guidance, payment integration, and shipping setup. Pain points: "wish they sold online", "can't buy their products", "no gift cards available".`,
				service: "E-commerce Setup",
				businessType,
				estimatedValue: "$1,500 - $5,000",
				painPoints: ["No online store", "Can't buy products online", "No gift cards", "Missing payment options"],
				skills: ["E-commerce", "Shopify", "WooCommerce", "Payment Integration"],
			});
		}

		// If no specific matches, add generic opportunities
		if (opportunities.length === 0) {
			opportunities.push({
				title: `Digital Services for ${this.capitalize(businessType)}`,
				description: `${this.capitalize(businessType)} in your area likely need digital improvements. Common needs include: website updates, online booking, social media presence, and customer communication tools. Research local businesses to find specific pain points and offer targeted solutions.`,
				service: "Digital Services",
				businessType,
				estimatedValue: "$500 - $5,000",
				painPoints: ["Outdated online presence", "Manual processes", "Poor customer communication"],
				skills: ["Web Development", "Digital Marketing", "Automation"],
			});
		}

		return opportunities;
	}

	// Convert a generated opportunity to a ScrapedGig format
	private opportunityToGig(opp: GeneratedOpportunity): ScrapedGig {
		return {
			id: generateGigId("bountyboard", `${opp.service}_${opp.businessType}_${Date.now()}`),
			source: "bountyboard",
			sourceUrl: "", // No external URL - this is a generated opportunity
			title: opp.title,
			description: opp.description,
			budget: this.parseEstimatedValue(opp.estimatedValue),
			skills: opp.skills,
			postedAt: new Date().toISOString(),
			clientInfo: {
				name: `Target: ${this.capitalize(opp.businessType)}`,
				location: "Local businesses",
			},
			scrapedAt: new Date().toISOString(),
		};
	}

	private parseEstimatedValue(value: string): ScrapedGig["budget"] {
		// Parse strings like "$500 - $2,000" or "$500 - $1,500/month"
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

	private capitalize(str: string): string {
		return str.split(" ").map(word => 
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(" ");
	}
}

interface GeneratedOpportunity {
	title: string;
	description: string;
	service: string;
	businessType: string;
	estimatedValue: string;
	painPoints: string[];
	skills: string[];
}

