// External Gig Types

export interface ExternalGig {
	id: string;
	source: GigSource;
	sourceId: string; // Original ID from the platform
	sourceUrl: string; // Direct link to the gig
	title: string;
	description: string;
	budget?: string; // e.g., "$500-1000", "Hourly: $50/hr"
	budgetType?: "fixed" | "hourly" | "unknown";
	skills: string[];
	postedAt?: string; // ISO date
	deadline?: string;
	clientInfo?: {
		name?: string;
		rating?: number;
		jobsPosted?: number;
		location?: string;
	};
	scrapedAt: string; // When we scraped this
}

export type GigSource =
	| "upwork"
	| "freelancer"
	| "fiverr"
	| "toptal"
	| "guru"
	| "peopleperhour"
	| "remoteok"
	| "weworkremotely"
	| "linkedin"
	| "indeed"
	| "manual"; // For manually added gigs

export interface CuratedGig extends ExternalGig {
	companyId: string;
	curatedAt: string;
	curatedBy: string; // userId
	status: "visible" | "hidden" | "featured";
	notes?: string; // Admin notes about the gig
	customReward?: string; // Override/additional reward from community
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
	isActive: boolean;
	lastRun?: string;
	createdAt: string;
}

export interface ScrapeResult {
	query: SearchQuery;
	gigs: ExternalGig[];
	scrapedAt: string;
	errors?: { source: GigSource; error: string }[];
}

// Source display info - using hex colors for inline styles (Tailwind purges dynamic classes)
export const GIG_SOURCE_INFO: Record<
	GigSource,
	{ name: string; color: string; baseUrl: string }
> = {
	upwork: {
		name: "Upwork",
		color: "#16a34a", // green-600
		baseUrl: "https://www.upwork.com",
	},
	freelancer: {
		name: "Freelancer",
		color: "#2563eb", // blue-600
		baseUrl: "https://www.freelancer.com",
	},
	fiverr: {
		name: "Fiverr",
		color: "#10b981", // emerald-500
		baseUrl: "https://www.fiverr.com",
	},
	toptal: {
		name: "Toptal",
		color: "#4f46e5", // indigo-600
		baseUrl: "https://www.toptal.com",
	},
	guru: {
		name: "Guru",
		color: "#0284c7", // sky-600
		baseUrl: "https://www.guru.com",
	},
	peopleperhour: {
		name: "PeoplePerHour",
		color: "#f97316", // orange-500
		baseUrl: "https://www.peopleperhour.com",
	},
	remoteok: {
		name: "RemoteOK",
		color: "#7c3aed", // violet-600
		baseUrl: "https://remoteok.com",
	},
	weworkremotely: {
		name: "We Work Remotely",
		color: "#ca8a04", // yellow-600
		baseUrl: "https://weworkremotely.com",
	},
	linkedin: {
		name: "LinkedIn",
		color: "#1d4ed8", // blue-700
		baseUrl: "https://www.linkedin.com/jobs",
	},
	indeed: {
		name: "Indeed",
		color: "#9333ea", // purple-600
		baseUrl: "https://www.indeed.com",
	},
	manual: {
		name: "Manual",
		color: "#4b5563", // gray-600
		baseUrl: "",
	},
};

