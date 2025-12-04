// Base Scraper Interface

import type { GigSource, ScrapedGig, ScrapeResult } from "./types";

export interface Scraper {
	source: GigSource;
	search(query: string, options?: SearchOptions): Promise<ScrapeResult>;
}

export interface SearchOptions {
	limit?: number;
	minBudget?: number;
	maxBudget?: number;
	skills?: string[];
}

// Helper to generate unique IDs
export function generateGigId(source: GigSource, externalId: string): string {
	return `${source}_${externalId}`;
}

// Helper to format budget
export function formatBudget(budget?: ScrapedGig["budget"]): string {
	if (!budget) return "Budget not specified";
	
	const { min, max, type, currency } = budget;
	const symbol = currency === "USD" ? "$" : currency;
	
	if (type === "hourly") {
		if (min && max) return `${symbol}${min}-${symbol}${max}/hr`;
		if (min) return `${symbol}${min}+/hr`;
		if (max) return `Up to ${symbol}${max}/hr`;
	} else {
		if (min && max) return `${symbol}${min}-${symbol}${max}`;
		if (min) return `${symbol}${min}+`;
		if (max) return `Up to ${symbol}${max}`;
	}
	
	return "Budget not specified";
}

