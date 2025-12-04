// Mock scraper for testing and demo purposes
// Returns realistic-looking fake gig data

import type { ExternalGig } from "../types";
import { BaseScraper, type ScraperOptions, type ScraperResult, COMMON_SKILLS } from "./base";

const MOCK_GIGS_DATA = [
	{
		title: "Build a React Dashboard for SaaS Platform",
		description: "We need an experienced React developer to build a modern analytics dashboard. The dashboard should include charts, data tables, user management, and real-time updates. Must be responsive and follow our existing design system.",
		budget: "$2,000 - $4,000",
		budgetType: "fixed" as const,
		skills: ["React", "TypeScript", "Tailwind", "REST API", "Charts"],
		clientRating: 4.8,
		clientJobs: 23,
	},
	{
		title: "WordPress E-commerce Site Customization",
		description: "Looking for a WordPress expert to customize our WooCommerce store. Need custom product pages, checkout flow optimization, and integration with our inventory system. Experience with Elementor is a plus.",
		budget: "$50/hr",
		budgetType: "hourly" as const,
		skills: ["WordPress", "WooCommerce", "PHP", "CSS", "Elementor"],
		clientRating: 4.5,
		clientJobs: 12,
	},
	{
		title: "Mobile App UI/UX Design",
		description: "Design a complete UI/UX for a fitness tracking mobile app. Need wireframes, high-fidelity mockups, and a clickable prototype. The app will have workout tracking, nutrition logging, and social features.",
		budget: "$1,500 - $2,500",
		budgetType: "fixed" as const,
		skills: ["Figma", "UI/UX", "Mobile Design", "Prototyping"],
		clientRating: 5.0,
		clientJobs: 8,
	},
	{
		title: "Python Data Scraping Script",
		description: "Need a Python script to scrape product data from multiple e-commerce websites. Should handle pagination, rate limiting, and export to CSV/JSON. Must include error handling and logging.",
		budget: "$300 - $500",
		budgetType: "fixed" as const,
		skills: ["Python", "Web Scraping", "BeautifulSoup", "Selenium"],
		clientRating: 4.2,
		clientJobs: 45,
	},
	{
		title: "SEO Content Writer for Tech Blog",
		description: "Looking for a technical content writer to produce 10 SEO-optimized blog posts about cloud computing and DevOps. Each article should be 1500-2000 words with original research and insights.",
		budget: "$100/article",
		budgetType: "fixed" as const,
		skills: ["SEO", "Technical Writing", "Content Marketing", "AWS", "DevOps"],
		clientRating: 4.9,
		clientJobs: 67,
	},
	{
		title: "Node.js API Development",
		description: "Build a RESTful API for our mobile app backend. Includes user authentication, payment processing with Stripe, push notifications, and integration with third-party services. Must include comprehensive tests.",
		budget: "$75/hr",
		budgetType: "hourly" as const,
		skills: ["Node.js", "Express", "PostgreSQL", "REST API", "Stripe", "Jest"],
		clientRating: 4.7,
		clientJobs: 31,
	},
	{
		title: "Logo and Brand Identity Design",
		description: "Create a complete brand identity for a new fintech startup. Deliverables include logo (multiple formats), color palette, typography guidelines, and basic brand guidelines document.",
		budget: "$800 - $1,200",
		budgetType: "fixed" as const,
		skills: ["Logo Design", "Branding", "Illustrator", "Figma"],
		clientRating: 4.6,
		clientJobs: 19,
	},
	{
		title: "Shopify Store Setup and Migration",
		description: "Migrate our existing WooCommerce store to Shopify. Need to transfer products, customer data, and order history. Also need custom theme modifications and app integrations.",
		budget: "$1,000 - $2,000",
		budgetType: "fixed" as const,
		skills: ["Shopify", "E-commerce", "Liquid", "Data Migration"],
		clientRating: 4.4,
		clientJobs: 28,
	},
	{
		title: "Social Media Marketing Campaign",
		description: "Run a 3-month social media campaign for our B2B software product. Includes content creation, scheduling, community management, and monthly analytics reports. Platforms: LinkedIn, Twitter, Instagram.",
		budget: "$2,500/month",
		budgetType: "fixed" as const,
		skills: ["Social Media", "Content Marketing", "Analytics", "Copywriting"],
		clientRating: 4.8,
		clientJobs: 15,
	},
	{
		title: "Vue.js Frontend Developer",
		description: "Join our team for a 3-month project to rebuild our customer portal in Vue 3. Must have experience with Composition API, Pinia, and TypeScript. Remote work, 30-40 hours per week.",
		budget: "$60/hr",
		budgetType: "hourly" as const,
		skills: ["Vue.js", "TypeScript", "Pinia", "CSS", "REST API"],
		clientRating: 4.9,
		clientJobs: 52,
	},
];

export class MockScraper extends BaseScraper {
	source = "upwork" as const; // Pretend to be Upwork for demo
	name = "Mock Scraper (Demo)";

	async scrape(query: string, options?: ScraperOptions): Promise<ScraperResult> {
		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

		const maxResults = options?.maxResults || 10;
		const queryLower = query.toLowerCase();

		// Filter gigs that match the query
		let matchingGigs = MOCK_GIGS_DATA.filter((gig) => {
			const searchText = `${gig.title} ${gig.description} ${gig.skills.join(" ")}`.toLowerCase();
			
			// Check if any word in the query matches
			const queryWords = queryLower.split(/\s+/);
			return queryWords.some((word) => searchText.includes(word));
		});

		// If no matches, return some random gigs
		if (matchingGigs.length === 0) {
			matchingGigs = MOCK_GIGS_DATA.slice(0, 3);
		}

		// Limit results
		matchingGigs = matchingGigs.slice(0, maxResults);

		// Convert to ExternalGig format
		const gigs: ExternalGig[] = matchingGigs.map((gig, index) => ({
			id: this.generateGigId(),
			source: this.source,
			sourceId: `mock_${Date.now()}_${index}`,
			sourceUrl: `https://www.upwork.com/jobs/~mock${Date.now()}${index}`,
			title: gig.title,
			description: gig.description,
			budget: gig.budget,
			budgetType: gig.budgetType,
			skills: gig.skills,
			postedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
			clientInfo: {
				rating: gig.clientRating,
				jobsPosted: gig.clientJobs,
			},
			scrapedAt: new Date().toISOString(),
		}));

		return { gigs };
	}
}

// Export a singleton instance
export const mockScraper = new MockScraper();

