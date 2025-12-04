// Scraper Manager - coordinates all scrapers

import type { Scraper, SearchOptions } from "./base";
import type { GigSource, ScrapedGig, ScrapeResult, CuratedGig, SearchQuery } from "./types";
import { RemoteOKScraper } from "./remoteok";
import { MockScraper, searchAllMock } from "./mock";

// Export types
export * from "./types";
export * from "./base";

// Available scrapers
const scrapers: Map<GigSource, Scraper> = new Map([
	["remoteok", new RemoteOKScraper()],
	// Add more scrapers here as they're implemented
]);

// In-memory stores (replace with database in production)
const searchQueries: Map<string, SearchQuery> = new Map();
const curatedGigs: Map<string, CuratedGig> = new Map();
const scrapedGigsCache: Map<string, ScrapedGig[]> = new Map();

// Search for gigs across multiple sources
export async function searchGigs(
	query: string,
	sources: GigSource[] = ["remoteok"],
	options?: SearchOptions
): Promise<ScrapeResult[]> {
	// For demo/testing, use mock data if no real scrapers available
	const useMock = process.env.USE_MOCK_SCRAPERS === "true" || sources.length === 0;
	
	if (useMock) {
		return searchAllMock(query, options);
	}

	const results: ScrapeResult[] = [];

	for (const source of sources) {
		const scraper = scrapers.get(source);
		if (scraper) {
			try {
				const result = await scraper.search(query, options);
				results.push(result);
			} catch (error) {
				results.push({
					source,
					success: false,
					gigs: [],
					error: error instanceof Error ? error.message : "Unknown error",
					scrapedAt: new Date().toISOString(),
				});
			}
		} else {
			// Use mock for unsupported sources
			const mockScraper = new MockScraper(source);
			const result = await mockScraper.search(query, options);
			results.push(result);
		}
	}

	return results;
}

// Save a search query for a company
export async function saveSearchQuery(
	companyId: string,
	query: string,
	sources: GigSource[]
): Promise<SearchQuery> {
	const searchQuery: SearchQuery = {
		id: `sq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		companyId,
		query,
		sources,
		createdAt: new Date().toISOString(),
	};
	searchQueries.set(searchQuery.id, searchQuery);
	return searchQuery;
}

// Get search queries for a company
export async function getSearchQueries(companyId: string): Promise<SearchQuery[]> {
	return Array.from(searchQueries.values()).filter((sq) => sq.companyId === companyId);
}

// Curated Gigs Management
export async function addCuratedGig(
	companyId: string,
	gig: ScrapedGig,
	status: CuratedGig["status"] = "pending"
): Promise<CuratedGig> {
	const curatedGig: CuratedGig = {
		id: `cg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		companyId,
		gig,
		status,
		addedAt: new Date().toISOString(),
	};
	curatedGigs.set(curatedGig.id, curatedGig);
	return curatedGig;
}

export async function getCuratedGigs(
	companyId: string,
	status?: CuratedGig["status"]
): Promise<CuratedGig[]> {
	let gigs = Array.from(curatedGigs.values()).filter((cg) => cg.companyId === companyId);
	if (status) {
		gigs = gigs.filter((cg) => cg.status === status);
	}
	return gigs.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export async function updateCuratedGig(
	id: string,
	updates: Partial<Pick<CuratedGig, "status" | "notes" | "customReward">>
): Promise<CuratedGig | null> {
	const existing = curatedGigs.get(id);
	if (!existing) return null;

	const updated: CuratedGig = {
		...existing,
		...updates,
		approvedAt: updates.status === "approved" ? new Date().toISOString() : existing.approvedAt,
	};
	curatedGigs.set(id, updated);
	return updated;
}

export async function deleteCuratedGig(id: string): Promise<boolean> {
	return curatedGigs.delete(id);
}

// Get approved gigs for members to see
export async function getApprovedGigs(companyId: string): Promise<CuratedGig[]> {
	return getCuratedGigs(companyId, "approved");
}

// Cache scraped results
export function cacheScrapedGigs(companyId: string, gigs: ScrapedGig[]): void {
	scrapedGigsCache.set(companyId, gigs);
}

export function getCachedGigs(companyId: string): ScrapedGig[] | undefined {
	return scrapedGigsCache.get(companyId);
}

