// Simple in-memory bounty store
// TODO: Replace with a real database (Supabase, Prisma, etc.)

import type { Bounty, BountySubmission } from "./types";

// In-memory storage (resets on server restart)
// In production, use a database!
const bounties: Map<string, Bounty> = new Map();
const submissions: Map<string, BountySubmission> = new Map();

// Helper to generate IDs
function generateId(): string {
	return `bounty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Bounty CRUD operations
export async function getBountiesByCompany(companyId: string): Promise<Bounty[]> {
	const companyBounties = Array.from(bounties.values()).filter(
		(b) => b.companyId === companyId
	);
	return companyBounties.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);
}

export async function getBountyById(id: string): Promise<Bounty | null> {
	return bounties.get(id) || null;
}

export async function createBounty(
	data: Omit<Bounty, "id" | "createdAt" | "updatedAt">
): Promise<Bounty> {
	const now = new Date().toISOString();
	const bounty: Bounty = {
		...data,
		id: generateId(),
		createdAt: now,
		updatedAt: now,
	};
	bounties.set(bounty.id, bounty);
	return bounty;
}

export async function updateBounty(
	id: string,
	data: Partial<Omit<Bounty, "id" | "companyId" | "createdAt">>
): Promise<Bounty | null> {
	const existing = bounties.get(id);
	if (!existing) return null;

	const updated: Bounty = {
		...existing,
		...data,
		updatedAt: new Date().toISOString(),
	};
	bounties.set(id, updated);
	return updated;
}

export async function deleteBounty(id: string): Promise<boolean> {
	return bounties.delete(id);
}

// Submission operations
export async function getSubmissionsByBounty(
	bountyId: string
): Promise<BountySubmission[]> {
	return Array.from(submissions.values()).filter(
		(s) => s.bountyId === bountyId
	);
}

export async function createSubmission(
	data: Omit<BountySubmission, "id" | "createdAt" | "status">
): Promise<BountySubmission> {
	const submission: BountySubmission = {
		...data,
		id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		status: "pending",
		createdAt: new Date().toISOString(),
	};
	submissions.set(submission.id, submission);
	return submission;
}

// Seed some demo data for testing
export function seedDemoData(companyId: string): void {
	if (bounties.size > 0) return; // Already seeded

	const demoBounties: Omit<Bounty, "id" | "createdAt" | "updatedAt">[] = [
		{
			companyId,
			title: "Build a Discord Bot Integration",
			description:
				"We need a Discord bot that syncs member roles with our Whop memberships. Should handle new member onboarding and role assignment automatically.",
			reward: "$750",
			category: "development",
			status: "open",
			deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
			requirements: [
				"Experience with Discord.js",
				"Familiarity with Whop API",
				"Clean, documented code",
			],
		},
		{
			companyId,
			title: "Design New Community Logo",
			description:
				"Looking for a fresh, modern logo that represents our trading community. Should work well at small sizes and in both light/dark modes.",
			reward: "$300",
			category: "design",
			status: "open",
			requirements: [
				"Deliver in SVG and PNG formats",
				"Include 3 initial concepts",
				"2 rounds of revisions included",
			],
		},
		{
			companyId,
			title: "Write 5 Educational Blog Posts",
			description:
				"Create beginner-friendly content about crypto trading basics. Each post should be 1000-1500 words with original insights.",
			reward: "$500",
			category: "content",
			status: "in_progress",
			requirements: [
				"SEO optimized",
				"Original research/insights",
				"Include relevant charts/images",
			],
		},
		{
			companyId,
			title: "Moderate Discord for 1 Month",
			description:
				"Help keep our community safe and engaged. Handle support tickets, enforce rules, and welcome new members.",
			reward: "Free Premium Membership",
			category: "community",
			status: "open",
			deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			requirements: [
				"Available 2+ hours daily",
				"Previous moderation experience",
				"Excellent communication skills",
			],
		},
	];

	demoBounties.forEach((data) => {
		const now = new Date().toISOString();
		const bounty: Bounty = {
			...data,
			id: generateId(),
			createdAt: now,
			updatedAt: now,
		};
		bounties.set(bounty.id, bounty);
	});
}

