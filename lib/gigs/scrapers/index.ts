// Scraper manager - coordinates all scrapers

import type { ExternalGig, GigSource, SearchQuery, ScrapeResult } from "../types";
import { saveScrapedGigs } from "../store";
import { mockScraper } from "./mock";
import type { BaseScraper, ScraperOptions } from "./base";

// Registry of available scrapers
const scrapers: Map<GigSource, BaseScraper> = new Map();

// Register the mock scraper for demo/testing
// In production, you'd register real scrapers here
scrapers.set("upwork", mockScraper);

// For demo purposes, we'll use the mock scraper for all sources
// This simulates having multiple scrapers working
const DEMO_MODE = true;

export async function runScraper(
	source: GigSource,
	query: string,
	options?: ScraperOptions
): Promise<{ gigs: ExternalGig[]; error?: string }> {
	// In demo mode, use mock scraper for everything
	if (DEMO_MODE) {
		const result = await mockScraper.scrape(query, options);
		// Override the source to match what was requested
		const gigs = result.gigs.map((g) => ({
			...g,
			source,
			sourceUrl: getSourceUrl(source, g.sourceId),
		}));
		return { gigs, error: result.error };
	}

	const scraper = scrapers.get(source);
	if (!scraper) {
		return { gigs: [], error: `No scraper available for ${source}` };
	}

	try {
		return await scraper.scrape(query, options);
	} catch (error) {
		return {
			gigs: [],
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function runSearchQuery(query: SearchQuery): Promise<ScrapeResult> {
	const allGigs: ExternalGig[] = [];
	const errors: { source: GigSource; error: string }[] = [];

	// Run scrapers in parallel for each source
	const results = await Promise.all(
		query.sources.map(async (source) => {
			const result = await runScraper(source, query.query, {
				maxResults: 10,
			});
			return { source, ...result };
		})
	);

	// Collect results
	for (const result of results) {
		allGigs.push(...result.gigs);
		if (result.error) {
			errors.push({ source: result.source, error: result.error });
		}
	}

	// Apply filters if specified
	let filteredGigs = allGigs;

	if (query.filters) {
		filteredGigs = allGigs.filter((gig) => {
			// Budget filter
			if (query.filters?.minBudget || query.filters?.maxBudget) {
				const budgetNum = extractBudgetNumber(gig.budget);
				if (budgetNum !== null) {
					if (query.filters.minBudget && budgetNum < query.filters.minBudget) {
						return false;
					}
					if (query.filters.maxBudget && budgetNum > query.filters.maxBudget) {
						return false;
					}
				}
			}

			// Skills filter
			if (query.filters?.skills && query.filters.skills.length > 0) {
				const gigSkillsLower = gig.skills.map((s) => s.toLowerCase());
				const hasMatchingSkill = query.filters.skills.some((skill) =>
					gigSkillsLower.includes(skill.toLowerCase())
				);
				if (!hasMatchingSkill) return false;
			}

			// Posted within filter
			if (query.filters?.postedWithin && gig.postedAt) {
				const postedDate = new Date(gig.postedAt);
				const cutoffDate = new Date();
				cutoffDate.setDate(cutoffDate.getDate() - query.filters.postedWithin);
				if (postedDate < cutoffDate) return false;
			}

			return true;
		});
	}

	// Save scraped gigs to store
	await saveScrapedGigs(filteredGigs);

	return {
		query,
		gigs: filteredGigs,
		scrapedAt: new Date().toISOString(),
		errors: errors.length > 0 ? errors : undefined,
	};
}

// Helper to get a realistic-looking URL for each source
function getSourceUrl(source: GigSource, sourceId: string): string {
	const baseUrls: Record<GigSource, string> = {
		upwork: "https://www.upwork.com/jobs/~",
		freelancer: "https://www.freelancer.com/projects/",
		fiverr: "https://www.fiverr.com/gig/",
		toptal: "https://www.toptal.com/projects/",
		guru: "https://www.guru.com/jobs/",
		peopleperhour: "https://www.peopleperhour.com/job/",
		remoteok: "https://remoteok.com/jobs/",
		weworkremotely: "https://weworkremotely.com/jobs/",
		linkedin: "https://www.linkedin.com/jobs/view/",
		indeed: "https://www.indeed.com/viewjob?jk=",
		manual: "",
	};
	return `${baseUrls[source]}${sourceId}`;
}

// Helper to extract a number from budget string
function extractBudgetNumber(budget?: string): number | null {
	if (!budget) return null;
	const match = budget.match(/\$(\d+(?:,\d{3})*)/);
	if (match) {
		return parseInt(match[1].replace(/,/g, ""), 10);
	}
	return null;
}

// Get list of available sources
export function getAvailableSources(): GigSource[] {
	if (DEMO_MODE) {
		// In demo mode, pretend all sources are available
		return [
			"upwork",
			"freelancer",
			"remoteok",
			"weworkremotely",
			"linkedin",
		];
	}
	return Array.from(scrapers.keys());
}

