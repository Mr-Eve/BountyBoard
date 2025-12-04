// JSearch Scraper - RapidAPI aggregator for Indeed, LinkedIn, Glassdoor, etc.
// Requires RAPIDAPI_KEY environment variable
// Free tier: 500 requests/month

import type { Scraper, SearchOptions } from "./base";
import { generateGigId } from "./base";
import type { ScrapedGig, ScrapeResult, GigSource } from "./types";

interface JSearchJob {
	job_id: string;
	employer_name: string;
	employer_logo?: string;
	employer_website?: string;
	job_employment_type: string;
	job_title: string;
	job_apply_link: string;
	job_description: string;
	job_is_remote: boolean;
	job_posted_at_datetime_utc?: string;
	job_city?: string;
	job_state?: string;
	job_country?: string;
	job_min_salary?: number;
	job_max_salary?: number;
	job_salary_currency?: string;
	job_salary_period?: string;
	job_required_skills?: string[];
	job_highlights?: {
		Qualifications?: string[];
		Responsibilities?: string[];
		Benefits?: string[];
	};
	job_publisher?: string; // Indeed, LinkedIn, etc.
}

interface JSearchResponse {
	status: string;
	request_id: string;
	data: JSearchJob[];
}

export class JSearchScraper implements Scraper {
	source: GigSource;
	private baseUrl = "https://jsearch.p.rapidapi.com/search";
	private apiKey: string | undefined;

	constructor(source: GigSource = "indeed") {
		this.source = source;
		this.apiKey = process.env.RAPIDAPI_KEY;
	}

	async search(query: string, options?: SearchOptions): Promise<ScrapeResult> {
		// Check for API key
		if (!this.apiKey) {
			return {
				source: this.source,
				success: false,
				gigs: [],
				error: "RAPIDAPI_KEY environment variable not set. Get a free key at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch",
				scrapedAt: new Date().toISOString(),
			};
		}

		try {
			const url = new URL(this.baseUrl);
			url.searchParams.set("query", `${query} remote`);
			url.searchParams.set("page", "1");
			url.searchParams.set("num_pages", "1");
			url.searchParams.set("remote_jobs_only", "true");

			const response = await fetch(url.toString(), {
				headers: {
					"X-RapidAPI-Key": this.apiKey,
					"X-RapidAPI-Host": "jsearch.p.rapidapi.com",
				},
			});

			if (!response.ok) {
				if (response.status === 429) {
					throw new Error("Rate limit exceeded. JSearch free tier allows 500 requests/month.");
				}
				throw new Error(`JSearch API error: ${response.status}`);
			}

			const data: JSearchResponse = await response.json();

			if (data.status !== "OK" || !data.data) {
				throw new Error("Invalid response from JSearch API");
			}

			let gigs: ScrapedGig[] = data.data.map((job) => {
				// Determine source based on publisher
				const jobSource = this.mapPublisherToSource(job.job_publisher);

				return {
					id: generateGigId(jobSource, job.job_id),
					source: jobSource,
					sourceUrl: job.job_apply_link,
					title: job.job_title,
					description: this.cleanDescription(job.job_description),
					budget: job.job_min_salary || job.job_max_salary ? {
						min: job.job_min_salary,
						max: job.job_max_salary,
						type: job.job_salary_period === "HOUR" ? "hourly" as const : "fixed" as const,
						currency: job.job_salary_currency || "USD",
					} : undefined,
					skills: job.job_required_skills || this.extractSkillsFromHighlights(job.job_highlights),
					postedAt: job.job_posted_at_datetime_utc,
					clientInfo: {
						name: job.employer_name,
						location: this.formatLocation(job),
					},
					scrapedAt: new Date().toISOString(),
				};
			});

			// Filter by requested source if specific
			if (this.source !== "indeed") {
				gigs = gigs.filter(g => g.source === this.source);
			}

			// Apply limit
			if (options?.limit) {
				gigs = gigs.slice(0, options.limit);
			}

			return {
				source: this.source,
				success: true,
				gigs,
				scrapedAt: new Date().toISOString(),
			};
		} catch (error) {
			return {
				source: this.source,
				success: false,
				gigs: [],
				error: error instanceof Error ? error.message : "Unknown error",
				scrapedAt: new Date().toISOString(),
			};
		}
	}

	private mapPublisherToSource(publisher?: string): GigSource {
		if (!publisher) return "indeed";
		const pub = publisher.toLowerCase();
		if (pub.includes("linkedin")) return "linkedin";
		if (pub.includes("indeed")) return "indeed";
		if (pub.includes("glassdoor")) return "indeed"; // Map to indeed as fallback
		return "indeed";
	}

	private cleanDescription(text: string): string {
		return text
			.replace(/<[^>]*>/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 500);
	}

	private extractSkillsFromHighlights(highlights?: JSearchJob["job_highlights"]): string[] {
		if (!highlights?.Qualifications) return [];
		// Extract potential skills from qualifications
		const skills: string[] = [];
		const skillKeywords = ["experience with", "knowledge of", "proficient in", "skilled in", "familiar with"];
		
		for (const qual of highlights.Qualifications.slice(0, 5)) {
			// Just use the first few words as a "skill"
			const words = qual.split(" ").slice(0, 4).join(" ");
			if (words.length > 3 && words.length < 50) {
				skills.push(words);
			}
		}
		return skills.slice(0, 5);
	}

	private formatLocation(job: JSearchJob): string {
		if (job.job_is_remote) return "Remote";
		const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
		return parts.join(", ") || "Unknown";
	}
}

