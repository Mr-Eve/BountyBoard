// Bounty Board Types

export interface Bounty {
	id: string;
	companyId: string;
	title: string;
	description: string;
	reward: string; // e.g., "$500", "3 ETH", "Free membership"
	category: BountyCategory;
	status: BountyStatus;
	deadline?: string; // ISO date string
	requirements?: string[];
	contactInfo?: string;
	createdAt: string;
	updatedAt: string;
}

export type BountyCategory =
	| "development"
	| "design"
	| "marketing"
	| "content"
	| "community"
	| "other";

export type BountyStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface BountySubmission {
	id: string;
	bountyId: string;
	userId: string;
	userName: string;
	message: string;
	status: "pending" | "accepted" | "rejected";
	createdAt: string;
}

// Category display info
export const CATEGORY_INFO: Record<
	BountyCategory,
	{ label: string; emoji: string; color: string }
> = {
	development: { label: "Development", emoji: "💻", color: "bg-blue-500" },
	design: { label: "Design", emoji: "🎨", color: "bg-pink-500" },
	marketing: { label: "Marketing", emoji: "📣", color: "bg-orange-500" },
	content: { label: "Content", emoji: "✍️", color: "bg-purple-500" },
	community: { label: "Community", emoji: "👥", color: "bg-green-500" },
	other: { label: "Other", emoji: "📦", color: "bg-gray-500" },
};

export const STATUS_INFO: Record<
	BountyStatus,
	{ label: string; color: string }
> = {
	open: { label: "Open", color: "bg-emerald-500" },
	in_progress: { label: "In Progress", color: "bg-amber-500" },
	completed: { label: "Completed", color: "bg-blue-500" },
	cancelled: { label: "Cancelled", color: "bg-gray-500" },
};

