// Scraper Types

export interface ScrapedGig {
	id: string;
	source: GigSource;
	sourceUrl: string;
	title: string;
	description: string;
	budget?: {
		min?: number;
		max?: number;
		type: "fixed" | "hourly" | "unknown";
		currency: string;
	};
	skills: string[];
	postedAt?: string;
	deadline?: string;
	clientInfo?: {
		name?: string;
		rating?: number;
		jobsPosted?: number;
		location?: string;
	};
	scrapedAt: string;
}

export type GigSource =
	| "upwork"
	| "freelancer"
	| "fiverr"
	| "toptal"
	| "indeed"
	| "linkedin"
	| "remoteok"
	| "weworkremotely"
	| "manual";

export interface ScraperConfig {
	source: GigSource;
	name: string;
	icon: string;
	enabled: boolean;
	rateLimit: number; // requests per minute
}

export interface SearchQuery {
	id: string;
	companyId: string;
	query: string;
	sources: GigSource[];
	filters?: {
		minBudget?: number;
		maxBudget?: number;
		skills?: string[];
		postedWithin?: number; // days
	};
	createdAt: string;
	lastRun?: string;
}

export interface CuratedGig {
	id: string;
	companyId: string;
	gig: ScrapedGig;
	status: "pending" | "approved" | "rejected" | "hidden";
	notes?: string; // Leader's notes for members
	customReward?: string; // Override the budget display
	addedAt: string;
	approvedAt?: string;
}

// Scraper result
export interface ScrapeResult {
	source: GigSource;
	success: boolean;
	gigs: ScrapedGig[];
	error?: string;
	scrapedAt: string;
}

// Source display info
export const SOURCE_INFO: Record<GigSource, { name: string; icon: string; color: string }> = {
	upwork: { name: "Upwork", icon: "💼", color: "bg-green-500" },
	freelancer: { name: "Freelancer", icon: "🌐", color: "bg-blue-500" },
	fiverr: { name: "Fiverr", icon: "🎯", color: "bg-emerald-500" },
	toptal: { name: "Toptal", icon: "⭐", color: "bg-indigo-500" },
	indeed: { name: "Indeed", icon: "📋", color: "bg-purple-500" },
	linkedin: { name: "LinkedIn", icon: "💎", color: "bg-sky-500" },
	remoteok: { name: "RemoteOK", icon: "🌍", color: "bg-rose-500" },
	weworkremotely: { name: "We Work Remotely", icon: "🏠", color: "bg-amber-500" },
	manual: { name: "Manual", icon: "✏️", color: "bg-gray-500" },
};

