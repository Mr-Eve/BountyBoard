// In-memory store for gigs and search queries
// TODO: Replace with a real database in production

import type { CuratedGig, ExternalGig, SearchQuery, GigSource } from "./types";

// Storage
const searchQueries: Map<string, SearchQuery> = new Map();
const scrapedGigs: Map<string, ExternalGig> = new Map(); // keyed by source:sourceId
const curatedGigs: Map<string, CuratedGig> = new Map(); // keyed by companyId:gigId

// Helper
function generateId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Search Query Operations
export async function getSearchQueries(companyId: string): Promise<SearchQuery[]> {
	return Array.from(searchQueries.values())
		.filter((q) => q.companyId === companyId)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSearchQuery(id: string): Promise<SearchQuery | null> {
	return searchQueries.get(id) || null;
}

export async function createSearchQuery(
	data: Omit<SearchQuery, "id" | "createdAt">
): Promise<SearchQuery> {
	const query: SearchQuery = {
		...data,
		id: generateId("sq"),
		createdAt: new Date().toISOString(),
	};
	searchQueries.set(query.id, query);
	return query;
}

export async function updateSearchQuery(
	id: string,
	data: Partial<Omit<SearchQuery, "id" | "companyId" | "createdAt">>
): Promise<SearchQuery | null> {
	const existing = searchQueries.get(id);
	if (!existing) return null;
	const updated = { ...existing, ...data };
	searchQueries.set(id, updated);
	return updated;
}

export async function deleteSearchQuery(id: string): Promise<boolean> {
	return searchQueries.delete(id);
}

// Scraped Gig Operations
export async function saveScrapedGigs(gigs: ExternalGig[]): Promise<void> {
	for (const gig of gigs) {
		const key = `${gig.source}:${gig.sourceId}`;
		scrapedGigs.set(key, gig);
	}
}

export async function getScrapedGig(
	source: GigSource,
	sourceId: string
): Promise<ExternalGig | null> {
	return scrapedGigs.get(`${source}:${sourceId}`) || null;
}

export async function getScrapedGigById(id: string): Promise<ExternalGig | null> {
	return scrapedGigs.get(id) || null;
}

export async function getAllScrapedGigs(): Promise<ExternalGig[]> {
	return Array.from(scrapedGigs.values());
}

// Curated Gig Operations
export async function getCuratedGigs(
	companyId: string,
	options?: { status?: CuratedGig["status"]; includeHidden?: boolean }
): Promise<CuratedGig[]> {
	let gigs = Array.from(curatedGigs.values()).filter(
		(g) => g.companyId === companyId
	);

	if (options?.status) {
		gigs = gigs.filter((g) => g.status === options.status);
	} else if (!options?.includeHidden) {
		gigs = gigs.filter((g) => g.status !== "hidden");
	}

	return gigs.sort(
		(a, b) => new Date(b.curatedAt).getTime() - new Date(a.curatedAt).getTime()
	);
}

export async function getCuratedGig(
	companyId: string,
	gigId: string
): Promise<CuratedGig | null> {
	return curatedGigs.get(`${companyId}:${gigId}`) || null;
}

export async function curateGig(
	companyId: string,
	gig: ExternalGig,
	curatedBy: string,
	options?: { status?: CuratedGig["status"]; notes?: string; customReward?: string }
): Promise<CuratedGig> {
	const curatedGig: CuratedGig = {
		...gig,
		companyId,
		curatedAt: new Date().toISOString(),
		curatedBy,
		status: options?.status || "visible",
		notes: options?.notes,
		customReward: options?.customReward,
	};
	curatedGigs.set(`${companyId}:${gig.id}`, curatedGig);
	return curatedGig;
}

export async function updateCuratedGig(
	companyId: string,
	gigId: string,
	data: Partial<Pick<CuratedGig, "status" | "notes" | "customReward">>
): Promise<CuratedGig | null> {
	const key = `${companyId}:${gigId}`;
	const existing = curatedGigs.get(key);
	if (!existing) return null;
	const updated = { ...existing, ...data };
	curatedGigs.set(key, updated);
	return updated;
}

export async function removeCuratedGig(
	companyId: string,
	gigId: string
): Promise<boolean> {
	return curatedGigs.delete(`${companyId}:${gigId}`);
}

// Get uncurated gigs (scraped but not yet curated for a company)
export async function getUncuratedGigs(companyId: string): Promise<ExternalGig[]> {
	const curated = await getCuratedGigs(companyId, { includeHidden: true });
	const curatedIds = new Set(curated.map((g) => g.id));
	
	return Array.from(scrapedGigs.values()).filter(
		(g) => !curatedIds.has(g.id)
	);
}

