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
	| "arbeitnow"
	| "himalayas"
	| "bountyboard"
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

// Source display info - using hex colors for inline styles (Tailwind purges dynamic classes)
export const SOURCE_INFO: Record<GigSource, { name: string; color: string }> = {
	upwork: { name: "Upwork", color: "#22c55e" }, // green-500
	freelancer: { name: "Freelancer", color: "#3b82f6" }, // blue-500
	fiverr: { name: "Fiverr", color: "#10b981" }, // emerald-500
	toptal: { name: "Toptal", color: "#6366f1" }, // indigo-500
	indeed: { name: "Indeed", color: "#a855f7" }, // purple-500
	linkedin: { name: "LinkedIn", color: "#0ea5e9" }, // sky-500
	remoteok: { name: "RemoteOK", color: "#f43f5e" }, // rose-500
	weworkremotely: { name: "We Work Remotely", color: "#f59e0b" }, // amber-500
	arbeitnow: { name: "Arbeitnow", color: "#14b8a6" }, // teal-500
	himalayas: { name: "Himalayas", color: "#8b5cf6" }, // violet-500
	bountyboard: { name: "BountyBoard", color: "#ec4899" }, // pink-500 - AI-discovered opportunities
	manual: { name: "Manual", color: "#6b7280" }, // gray-500
};

