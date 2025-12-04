// Arbeitnow Scraper - Free public API for job listings

import type { Scraper, SearchOptions } from "./base";
import { generateGigId, isInLanguage } from "./base";
import type { ScrapedGig, ScrapeResult } from "./types";

interface ArbeitnowJob {
	slug: string;
	company_name: string;
	title: string;
	description: string;
	remote: boolean;
	url: string;
	tags: string[];
	job_types: string[];
	location: string;
	created_at: number; // Unix timestamp
}

interface ArbeitnowResponse {
	data: ArbeitnowJob[];
	links: {
		next?: string;
	};
	meta: {
		current_page: number;
		last_page: number;
		total: number;
	};
}

export class ArbeitnowScraper implements Scraper {
	source = "arbeitnow" as const;
	private baseUrl = "https://www.arbeitnow.com/api/job-board-api";

	async search(query: string, options?: SearchOptions): Promise<ScrapeResult> {
		try {
			// Arbeitnow API supports search via query parameter
			const url = new URL(this.baseUrl);
			if (query) {
				url.searchParams.set("search", query);
			}

			const response = await fetch(url.toString(), {
				headers: {
					"Accept": "application/json",
					"User-Agent": "BountyBoard/1.0",
				},
			});

			if (!response.ok) {
				throw new Error(`Arbeitnow API error: ${response.status}`);
			}

			const data: ArbeitnowResponse = await response.json();

			let gigs: ScrapedGig[] = data.data.map((job) => ({
				id: generateGigId("arbeitnow", job.slug),
				source: "arbeitnow" as const,
				sourceUrl: job.url,
				title: job.title,
				description: this.cleanDescription(job.description),
				skills: job.tags || [],
				postedAt: new Date(job.created_at * 1000).toISOString(),
				clientInfo: {
					name: job.company_name,
					location: job.location || (job.remote ? "Remote" : "Unknown"),
				},
				scrapedAt: new Date().toISOString(),
			}));

			// Filter by language if specified
			if (options?.language) {
				gigs = gigs.filter((gig) => 
					isInLanguage(`${gig.title} ${gig.description}`, options.language!)
				);
			}

			// Apply limit
			if (options?.limit) {
				gigs = gigs.slice(0, options.limit);
			}

			return {
				source: "arbeitnow",
				success: true,
				gigs,
				scrapedAt: new Date().toISOString(),
			};
		} catch (error) {
			return {
				source: "arbeitnow",
				success: false,
				gigs: [],
				error: error instanceof Error ? error.message : "Unknown error",
				scrapedAt: new Date().toISOString(),
			};
		}
	}

	private cleanDescription(html: string): string {
		return html
			.replace(/<[^>]*>/g, " ")
			.replace(/&nbsp;/g, " ")
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 500);
	}
}

