import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { discoverOpportunities, type BusinessSearchParams } from "@/lib/opportunities";

export async function POST(request: NextRequest) {
	try {
		// Verify user is authenticated
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { query, location, options } = body as {
			query: string;
			location: string;
			options?: {
				minRating?: number;
				maxRating?: number;
				minReviews?: number;
				analyzeWebsites?: boolean;
				maxResults?: number;
			};
		};

		if (!query || !location) {
			return NextResponse.json(
				{ error: "Missing required fields: query, location" },
				{ status: 400 }
			);
		}

		const searchParams: BusinessSearchParams = {
			query,
			location,
			minRating: options?.minRating,
			maxRating: options?.maxRating,
			minReviews: options?.minReviews,
		};

		const result = await discoverOpportunities(searchParams, {
			analyzeWebsites: options?.analyzeWebsites ?? true,
			maxResults: options?.maxResults || 10,
		});

		return NextResponse.json({
			success: true,
			opportunities: result.opportunities,
			totalCount: result.opportunities.length,
			errors: result.errors.length > 0 ? result.errors : undefined,
		});
	} catch (error) {
		console.error("Opportunity search error:", error);
		return NextResponse.json(
			{ error: "Failed to search for opportunities" },
			{ status: 500 }
		);
	}
}

