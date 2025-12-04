// Himalayas Scraper - Free public API for remote job listings

import type { Scraper, SearchOptions } from "./base";
import { generateGigId } from "./base";
import type { ScrapedGig, ScrapeResult } from "./types";

interface HimalayasJob {
	id: string;
	title: string;
	excerpt: string;
	companyName: string;
	companyLogo?: string;
	locationRestrictions?: string[];
	pubDate: string;
	applicationLink: string;
	seniority?: string;
	categories?: string[];
	minSalary?: number;
	maxSalary?: number;
	salaryCurrency?: string;
}

interface HimalayasResponse {
	jobs: HimalayasJob[];
	offset: number;
	limit: number;
	total: number;
}

export class HimalayasScraper implements Scraper {
	source = "himalayas" as const;
	private baseUrl = "https://himalayas.app/jobs/api";

	async search(query: string, options?: SearchOptions): Promise<ScrapeResult> {
		try {
			const url = new URL(this.baseUrl);
			url.searchParams.set("limit", String(options?.limit || 50));
			
			const response = await fetch(url.toString(), {
				headers: {
					"Accept": "application/json",
					"User-Agent": "BountyBoard/1.0",
				},
			});

			if (!response.ok) {
				throw new Error(`Himalayas API error: ${response.status}`);
			}

			const data: HimalayasResponse = await response.json();
			const queryLower = query.toLowerCase();

			// Filter by search query (title, company, categories)
			let filteredJobs = data.jobs.filter((job) => {
				const searchText = `${job.title} ${job.companyName} ${job.excerpt} ${(job.categories || []).join(" ")}`.toLowerCase();
				return queryLower.split(" ").some(word => searchText.includes(word));
			});

			let gigs: ScrapedGig[] = filteredJobs.map((job) => ({
				id: generateGigId("himalayas", job.id),
				source: "himalayas" as const,
				sourceUrl: job.applicationLink,
				title: job.title,
				description: job.excerpt,
				budget: job.minSalary || job.maxSalary ? {
					min: job.minSalary,
					max: job.maxSalary,
					type: "fixed" as const,
					currency: job.salaryCurrency || "USD",
				} : undefined,
				skills: job.categories || [],
				postedAt: job.pubDate,
				clientInfo: {
					name: job.companyName,
					location: job.locationRestrictions?.join(", ") || "Remote Worldwide",
				},
				scrapedAt: new Date().toISOString(),
			}));

			// Apply limit
			if (options?.limit) {
				gigs = gigs.slice(0, options.limit);
			}

			return {
				source: "himalayas",
				success: true,
				gigs,
				scrapedAt: new Date().toISOString(),
			};
		} catch (error) {
			return {
				source: "himalayas",
				success: false,
				gigs: [],
				error: error instanceof Error ? error.message : "Unknown error",
				scrapedAt: new Date().toISOString(),
			};
		}
	}
}

