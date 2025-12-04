import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { runSearchQuery } from "@/lib/gigs/scrapers";
import {
	createSearchQuery,
	getSearchQueries,
	updateSearchQuery,
} from "@/lib/gigs/store";
import type { GigSource } from "@/lib/gigs/types";

// POST /api/gigs/scrape - Run a new scrape
export async function POST(request: NextRequest) {
	try {
		// Verify user is authenticated
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { companyId, query, sources, filters, saveQuery } = body;

		if (!companyId || !query || !sources || sources.length === 0) {
			return NextResponse.json(
				{ error: "Missing required fields: companyId, query, sources" },
				{ status: 400 }
			);
		}

		// Create a search query object
		const searchQuery = {
			companyId,
			query,
			sources: sources as GigSource[],
			filters,
			isActive: saveQuery || false,
		};

		// Save the query if requested
		let savedQuery = null;
		if (saveQuery) {
			savedQuery = await createSearchQuery(searchQuery);
		}

		// Run the scrape
		const result = await runSearchQuery({
			...searchQuery,
			id: savedQuery?.id || "temp",
			createdAt: new Date().toISOString(),
		});

		// Update lastRun if we saved the query
		if (savedQuery) {
			await updateSearchQuery(savedQuery.id, {
				lastRun: result.scrapedAt,
			});
		}

		return NextResponse.json({
			success: true,
			queryId: savedQuery?.id,
			gigsFound: result.gigs.length,
			gigs: result.gigs,
			errors: result.errors,
		});
	} catch (error) {
		console.error("Scrape error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Scrape failed" },
			{ status: 500 }
		);
	}
}

// GET /api/gigs/scrape?companyId=xxx - Get saved search queries
export async function GET(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get("companyId");

		if (!companyId) {
			return NextResponse.json(
				{ error: "Missing companyId" },
				{ status: 400 }
			);
		}

		const queries = await getSearchQueries(companyId);
		return NextResponse.json({ queries });
	} catch (error) {
		console.error("Get queries error:", error);
		return NextResponse.json(
			{ error: "Failed to get queries" },
			{ status: 500 }
		);
	}
}

