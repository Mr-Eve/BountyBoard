// Base scraper interface and utilities

import type { ExternalGig, GigSource, SearchQuery } from "../types";

export interface ScraperOptions {
	maxResults?: number;
	timeout?: number;
}

export interface ScraperResult {
	gigs: ExternalGig[];
	error?: string;
}

export abstract class BaseScraper {
	abstract source: GigSource;
	abstract name: string;

	abstract scrape(
		query: string,
		options?: ScraperOptions
	): Promise<ScraperResult>;

	protected generateGigId(): string {
		return `gig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	protected cleanText(text: string): string {
		return text
			.replace(/\s+/g, " ")
			.replace(/[\n\r\t]/g, " ")
			.trim();
	}

	protected extractBudget(text: string): {
		budget?: string;
		budgetType?: "fixed" | "hourly" | "unknown";
	} {
		// Try to extract budget from text
		const hourlyMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/\s*hr|per\s*hour|hourly)/i);
		if (hourlyMatch) {
			return { budget: `$${hourlyMatch[1]}/hr`, budgetType: "hourly" };
		}

		const rangeMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
		if (rangeMatch) {
			return { budget: `$${rangeMatch[1]} - $${rangeMatch[2]}`, budgetType: "fixed" };
		}

		const fixedMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
		if (fixedMatch) {
			return { budget: `$${fixedMatch[1]}`, budgetType: "fixed" };
		}

		return { budgetType: "unknown" };
	}

	protected extractSkills(text: string, knownSkills: string[]): string[] {
		const lowerText = text.toLowerCase();
		return knownSkills.filter((skill) =>
			lowerText.includes(skill.toLowerCase())
		);
	}
}

// Common skills to look for
export const COMMON_SKILLS = [
	// Development
	"JavaScript", "TypeScript", "Python", "React", "Node.js", "Vue.js", "Angular",
	"PHP", "Ruby", "Java", "C#", ".NET", "Go", "Rust", "Swift", "Kotlin",
	"HTML", "CSS", "Tailwind", "Next.js", "Django", "Flask", "Laravel",
	"PostgreSQL", "MySQL", "MongoDB", "Redis", "GraphQL", "REST API",
	"AWS", "Azure", "GCP", "Docker", "Kubernetes", "DevOps", "CI/CD",
	
	// Design
	"Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator", "UI/UX",
	"Web Design", "Mobile Design", "Logo Design", "Branding", "3D Design",
	
	// Marketing
	"SEO", "SEM", "Google Ads", "Facebook Ads", "Social Media", "Content Marketing",
	"Email Marketing", "Copywriting", "Analytics", "Growth Hacking",
	
	// Other
	"WordPress", "Shopify", "Webflow", "Data Entry", "Virtual Assistant",
	"Project Management", "Agile", "Scrum", "Technical Writing",
];

