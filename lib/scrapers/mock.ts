// Mock Scraper for testing and demo purposes

import type { Scraper, SearchOptions } from "./base";
import { generateGigId } from "./base";
import type { GigSource, ScrapedGig, ScrapeResult } from "./types";

// Mock data that looks realistic
const MOCK_GIGS: Omit<ScrapedGig, "id" | "scrapedAt">[] = [
	{
		source: "upwork",
		sourceUrl: "https://upwork.com/jobs/~example1",
		title: "Full Stack Developer for SaaS Dashboard",
		description: "Looking for an experienced full-stack developer to build a modern analytics dashboard. Must have experience with React, Node.js, and PostgreSQL. The project involves creating interactive charts, user authentication, and API integrations.",
		budget: { min: 2000, max: 5000, type: "fixed", currency: "USD" },
		skills: ["React", "Node.js", "PostgreSQL", "TypeScript", "REST APIs"],
		postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		clientInfo: { name: "TechStartup Inc", rating: 4.8, jobsPosted: 23, location: "United States" },
	},
	{
		source: "upwork",
		sourceUrl: "https://upwork.com/jobs/~example2",
		title: "Mobile App UI/UX Designer",
		description: "Need a talented designer to create beautiful, intuitive interfaces for our iOS and Android fitness app. Should be proficient in Figma and have a strong portfolio of mobile designs.",
		budget: { min: 50, max: 80, type: "hourly", currency: "USD" },
		skills: ["Figma", "UI Design", "UX Design", "Mobile Design", "Prototyping"],
		postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
		clientInfo: { name: "FitLife Apps", rating: 4.9, jobsPosted: 45, location: "Canada" },
	},
	{
		source: "freelancer",
		sourceUrl: "https://freelancer.com/projects/example3",
		title: "WordPress E-commerce Site Development",
		description: "Build a complete e-commerce website using WordPress and WooCommerce. Need product catalog, payment integration (Stripe), and shipping calculator. Must be mobile responsive.",
		budget: { min: 800, max: 1500, type: "fixed", currency: "USD" },
		skills: ["WordPress", "WooCommerce", "PHP", "CSS", "Stripe"],
		postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
		clientInfo: { name: "BoutiqueShop", rating: 4.5, jobsPosted: 12, location: "United Kingdom" },
	},
	{
		source: "freelancer",
		sourceUrl: "https://freelancer.com/projects/example4",
		title: "Python Data Analysis Script",
		description: "Create a Python script to analyze sales data from CSV files and generate automated reports. Should include data visualization with matplotlib/seaborn and export to PDF.",
		budget: { min: 300, max: 600, type: "fixed", currency: "USD" },
		skills: ["Python", "Pandas", "Data Analysis", "Matplotlib", "Automation"],
		postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
		clientInfo: { name: "DataDriven Co", rating: 4.7, jobsPosted: 8, location: "Australia" },
	},
	{
		source: "linkedin",
		sourceUrl: "https://linkedin.com/jobs/view/example5",
		title: "Contract Technical Writer - API Documentation",
		description: "Seeking a technical writer to create comprehensive API documentation for our developer platform. Must understand REST APIs and have experience with documentation tools like Swagger/OpenAPI.",
		budget: { min: 40, max: 60, type: "hourly", currency: "USD" },
		skills: ["Technical Writing", "API Documentation", "Swagger", "Markdown", "Developer Tools"],
		postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
		clientInfo: { name: "DevTools Platform", location: "Remote" },
	},
	{
		source: "indeed",
		sourceUrl: "https://indeed.com/viewjob?jk=example6",
		title: "Freelance Video Editor for YouTube Channel",
		description: "Looking for a skilled video editor to edit weekly YouTube videos. Content is tech reviews and tutorials. Must be proficient in Premiere Pro or DaVinci Resolve. Fast turnaround required.",
		budget: { min: 100, max: 200, type: "fixed", currency: "USD" },
		skills: ["Video Editing", "Premiere Pro", "DaVinci Resolve", "YouTube", "Motion Graphics"],
		postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
		clientInfo: { name: "TechReviewer", rating: 4.6, jobsPosted: 34, location: "United States" },
	},
	{
		source: "weworkremotely",
		sourceUrl: "https://weworkremotely.com/jobs/example7",
		title: "DevOps Engineer - AWS Infrastructure",
		description: "Set up and maintain AWS infrastructure including EC2, RDS, Lambda, and CloudFront. Implement CI/CD pipelines with GitHub Actions. Terraform experience required.",
		budget: { min: 5000, max: 8000, type: "fixed", currency: "USD" },
		skills: ["AWS", "Terraform", "Docker", "CI/CD", "GitHub Actions", "Linux"],
		postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
		clientInfo: { name: "CloudScale", location: "Remote - Worldwide" },
	},
	{
		source: "upwork",
		sourceUrl: "https://upwork.com/jobs/~example8",
		title: "Social Media Marketing Manager",
		description: "Manage social media presence across Instagram, Twitter, and TikTok for a growing DTC brand. Create content calendar, engage with community, and run paid ad campaigns.",
		budget: { min: 1500, max: 2500, type: "fixed", currency: "USD" },
		skills: ["Social Media Marketing", "Content Creation", "Instagram", "TikTok", "Paid Ads"],
		postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
		clientInfo: { name: "TrendyBrand", rating: 4.4, jobsPosted: 19, location: "United States" },
	},
];

export class MockScraper implements Scraper {
	source: GigSource;

	constructor(source: GigSource = "upwork") {
		this.source = source;
	}

	async search(query: string, options?: SearchOptions): Promise<ScrapeResult> {
		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

		const queryLower = query.toLowerCase();
		
		// Filter mock gigs by query (search in title, description, skills)
		let gigs = MOCK_GIGS.filter((gig) => {
			const searchText = `${gig.title} ${gig.description} ${gig.skills.join(" ")}`.toLowerCase();
			return searchText.includes(queryLower) || queryLower.split(" ").some(word => searchText.includes(word));
		});

		// Filter by source if not searching all
		if (this.source !== "upwork") {
			gigs = gigs.filter((g) => g.source === this.source);
		}

		// Apply budget filters
		if (options?.minBudget) {
			gigs = gigs.filter((g) => g.budget && g.budget.min && g.budget.min >= options.minBudget!);
		}
		if (options?.maxBudget) {
			gigs = gigs.filter((g) => g.budget && g.budget.max && g.budget.max <= options.maxBudget!);
		}

		// Apply limit
		if (options?.limit) {
			gigs = gigs.slice(0, options.limit);
		}

		// Add IDs and timestamps
		const scrapedGigs: ScrapedGig[] = gigs.map((gig, index) => ({
			...gig,
			id: generateGigId(gig.source, `mock_${index}_${Date.now()}`),
			scrapedAt: new Date().toISOString(),
		}));

		return {
			source: this.source,
			success: true,
			gigs: scrapedGigs,
			scrapedAt: new Date().toISOString(),
		};
	}
}

// Search all sources with mock data
export async function searchAllMock(query: string, options?: SearchOptions): Promise<ScrapeResult[]> {
	const scraper = new MockScraper("upwork");
	const result = await scraper.search(query, options);
	
	// Return all mock gigs regardless of source for demo
	return [{
		...result,
		gigs: MOCK_GIGS.map((gig, index) => ({
			...gig,
			id: generateGigId(gig.source, `mock_${index}_${Date.now()}`),
			scrapedAt: new Date().toISOString(),
		})).filter((gig) => {
			const searchText = `${gig.title} ${gig.description} ${gig.skills.join(" ")}`.toLowerCase();
			const queryLower = query.toLowerCase();
			return searchText.includes(queryLower) || queryLower.split(" ").some(word => searchText.includes(word));
		}),
	}];
}

