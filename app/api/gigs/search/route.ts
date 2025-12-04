import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { searchGigs, type GigSource } from "@/lib/scrapers";

export async function POST(request: NextRequest) {
	try {
		// Verify user is authenticated
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { query, sources, companyId, options, language } = body as {
			query: string;
			sources?: GigSource[];
			companyId: string;
			options?: {
				limit?: number;
				minBudget?: number;
				maxBudget?: number;
			};
			language?: string;
		};

		if (!query || !companyId) {
			return NextResponse.json(
				{ error: "Missing required fields: query, companyId" },
				{ status: 400 }
			);
		}

		// Search for gigs - default to free API sources + BountyBoard opportunities
		// Default to English if no language specified
		const results = await searchGigs(
			query,
			sources || ["remoteok", "arbeitnow", "himalayas", "bountyboard"],
			{
				limit: options?.limit || 20,
				minBudget: options?.minBudget,
				maxBudget: options?.maxBudget,
				language: language || "en",
			}
		);

		// Flatten all gigs from all sources
		const allGigs = results.flatMap((r) => r.gigs);
		const errors = results.filter((r) => !r.success).map((r) => ({ source: r.source, error: r.error }));

		return NextResponse.json({
			success: true,
			gigs: allGigs,
			totalCount: allGigs.length,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("Search error:", error);
		return NextResponse.json(
			{ error: "Failed to search gigs" },
			{ status: 500 }
		);
	}
}

