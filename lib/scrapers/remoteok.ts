// RemoteOK Scraper - They have a public JSON API!

import type { Scraper, SearchOptions } from "./base";
import { generateGigId, isInLanguage } from "./base";
import type { ScrapedGig, ScrapeResult } from "./types";

interface RemoteOKJob {
	id: string;
	slug: string;
	company: string;
	position: string;
	description: string;
	salary_min?: number;
	salary_max?: number;
	tags: string[];
	url: string;
	date: string;
	location?: string;
}

export class RemoteOKScraper implements Scraper {
	source = "remoteok" as const;
	private baseUrl = "https://remoteok.com/api";

	async search(query: string, options?: SearchOptions): Promise<ScrapeResult> {
		try {
			// RemoteOK has a public API
			const response = await fetch(`${this.baseUrl}?tag=${encodeURIComponent(query)}`, {
				headers: {
					"User-Agent": "BountyBoard/1.0",
				},
			});

			if (!response.ok) {
				throw new Error(`RemoteOK API error: ${response.status}`);
			}

			const data: RemoteOKJob[] = await response.json();
			
			// First item is usually metadata, skip it
			const jobs = Array.isArray(data) ? data.slice(1) : [];

			let gigs: ScrapedGig[] = jobs.map((job) => ({
				id: generateGigId("remoteok", job.id || job.slug),
				source: "remoteok",
				sourceUrl: job.url || `https://remoteok.com/remote-jobs/${job.slug}`,
				title: job.position,
				description: this.cleanDescription(job.description || ""),
				budget: job.salary_min || job.salary_max ? {
					min: job.salary_min,
					max: job.salary_max,
					type: "fixed" as const,
					currency: "USD",
				} : undefined,
				skills: job.tags || [],
				postedAt: job.date,
				clientInfo: {
					name: job.company,
					location: job.location || "Remote",
				},
				scrapedAt: new Date().toISOString(),
			}));

			// Filter by language if specified
			if (options?.language) {
				gigs = gigs.filter((gig) => 
					isInLanguage(`${gig.title} ${gig.description}`, options.language!)
				);
			}

			// Apply filters
			if (options?.limit) {
				gigs = gigs.slice(0, options.limit);
			}

			if (options?.minBudget) {
				gigs = gigs.filter((g) => !g.budget || (g.budget.min && g.budget.min >= options.minBudget!));
			}

			return {
				source: "remoteok",
				success: true,
				gigs,
				scrapedAt: new Date().toISOString(),
			};
		} catch (error) {
			return {
				source: "remoteok",
				success: false,
				gigs: [],
				error: error instanceof Error ? error.message : "Unknown error",
				scrapedAt: new Date().toISOString(),
			};
		}
	}

	private cleanDescription(html: string): string {
		// Basic HTML stripping
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

