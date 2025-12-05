// Scraper Manager - coordinates all scrapers

import type { Scraper, SearchOptions } from "./base";
import type { GigSource, ScrapedGig, ScrapeResult, CuratedGig, SearchQuery } from "./types";
import { RemoteOKScraper } from "./remoteok";
import { ArbeitnowScraper } from "./arbeitnow";
import { HimalayasScraper } from "./himalayas";
import { JSearchScraper } from "./jsearch";
import { BountyBoardScraper } from "./bountyboard";

// Database imports (used when POSTGRES_URL is available)
import {
	getCuratedGigsFromDB,
	addCuratedGigToDB,
	updateCuratedGigInDB,
	deleteCuratedGigFromDB,
	getApprovedGigsFromDB,
} from "../db";

// Export types
export * from "./types";
export * from "./base";

// Check if database is configured
const useDatabase = !!process.env.POSTGRES_URL;

// Available scrapers - ALL REAL, NO MOCKS
const scrapers = new Map<GigSource, Scraper>();
// Free public APIs
scrapers.set("remoteok", new RemoteOKScraper());
scrapers.set("arbeitnow", new ArbeitnowScraper());
scrapers.set("himalayas", new HimalayasScraper());
// JSearch aggregator (requires RAPIDAPI_KEY for Indeed/LinkedIn)
scrapers.set("indeed", new JSearchScraper("indeed"));
scrapers.set("linkedin", new JSearchScraper("linkedin"));
// BountyBoard - AI-generated service opportunities
scrapers.set("bountyboard", new BountyBoardScraper());

// Default sources to search (free APIs + BountyBoard opportunities)
const DEFAULT_SOURCES: GigSource[] = ["remoteok", "arbeitnow", "himalayas", "bountyboard"];

// In-memory stores (fallback when no database)
const searchQueries: Map<string, SearchQuery> = new Map();
const curatedGigs: Map<string, CuratedGig> = new Map();
const scrapedGigsCache: Map<string, ScrapedGig[]> = new Map();

// Search for gigs across multiple sources
export async function searchGigs(
	query: string,
	sources: GigSource[] = DEFAULT_SOURCES,
	options?: SearchOptions
): Promise<ScrapeResult[]> {
	const results: ScrapeResult[] = [];

	// Search all requested sources in parallel
	const searchPromises = sources.map(async (source) => {
		const scraper = scrapers.get(source);
		if (scraper) {
			try {
				return await scraper.search(query, options);
			} catch (error) {
				return {
					source,
					success: false,
					gigs: [],
					error: error instanceof Error ? error.message : "Unknown error",
					scrapedAt: new Date().toISOString(),
				} as ScrapeResult;
			}
		} else {
			// Source not supported
			return {
				source,
				success: false,
				gigs: [],
				error: `Scraper for ${source} is not implemented. Available: ${Array.from(scrapers.keys()).join(", ")}`,
				scrapedAt: new Date().toISOString(),
			} as ScrapeResult;
		}
	});

	const searchResults = await Promise.all(searchPromises);
	results.push(...searchResults);

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
	status: CuratedGig["status"] = "pending",
	aiSummary?: string
): Promise<CuratedGig | null> {
	// Use database if available
	if (useDatabase) {
		return addCuratedGigToDB(companyId, gig, status, aiSummary);
	}

	// Fallback to in-memory
	const curatedGig: CuratedGig = {
		id: `cg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		companyId,
		gig,
		status,
		aiSummary,
		addedAt: new Date().toISOString(),
	};
	curatedGigs.set(curatedGig.id, curatedGig);
	return curatedGig;
}

export async function getCuratedGigs(
	companyId: string,
	status?: CuratedGig["status"]
): Promise<CuratedGig[]> {
	// Use database if available
	if (useDatabase) {
		return getCuratedGigsFromDB(companyId, status);
	}

	// Fallback to in-memory
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
	// Use database if available
	if (useDatabase) {
		const success = await updateCuratedGigInDB(id, updates);
		return success ? { id, ...updates } as CuratedGig : null;
	}

	// Fallback to in-memory
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
	// Use database if available
	if (useDatabase) {
		return deleteCuratedGigFromDB(id);
	}

	// Fallback to in-memory
	return curatedGigs.delete(id);
}

// Get approved gigs for members to see
export async function getApprovedGigs(companyId: string): Promise<CuratedGig[]> {
	// Use database if available
	if (useDatabase) {
		return getApprovedGigsFromDB(companyId);
	}

	// Fallback to in-memory
	return getCuratedGigs(companyId, "approved");
}

// Cache scraped results
export function cacheScrapedGigs(companyId: string, gigs: ScrapedGig[]): void {
	scrapedGigsCache.set(companyId, gigs);
}

export function getCachedGigs(companyId: string): ScrapedGig[] | undefined {
	return scrapedGigsCache.get(companyId);
}

