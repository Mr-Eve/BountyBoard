import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import {
	curateGig,
	getCuratedGigs,
	updateCuratedGig,
	removeCuratedGig,
	getScrapedGigById,
} from "@/lib/gigs/store";
import type { CuratedGig } from "@/lib/gigs/types";

// POST /api/gigs/curate - Curate a gig (add to visible list)
export async function POST(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { companyId, gigId, status, notes, customReward } = body;

		if (!companyId || !gigId) {
			return NextResponse.json(
				{ error: "Missing required fields: companyId, gigId" },
				{ status: 400 }
			);
		}

		// Get the scraped gig
		const gig = await getScrapedGigById(gigId);
		if (!gig) {
			return NextResponse.json({ error: "Gig not found" }, { status: 404 });
		}

		// Curate it
		const curatedGig = await curateGig(companyId, gig, userId, {
			status: status || "visible",
			notes,
			customReward,
		});

		return NextResponse.json({ success: true, gig: curatedGig });
	} catch (error) {
		console.error("Curate error:", error);
		return NextResponse.json(
			{ error: "Failed to curate gig" },
			{ status: 500 }
		);
	}
}

// GET /api/gigs/curate?companyId=xxx - Get curated gigs
export async function GET(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get("companyId");
		const includeHidden = searchParams.get("includeHidden") === "true";
		const status = searchParams.get("status") as CuratedGig["status"] | null;

		if (!companyId) {
			return NextResponse.json(
				{ error: "Missing companyId" },
				{ status: 400 }
			);
		}

		const gigs = await getCuratedGigs(companyId, {
			status: status || undefined,
			includeHidden,
		});

		return NextResponse.json({ gigs });
	} catch (error) {
		console.error("Get curated gigs error:", error);
		return NextResponse.json(
			{ error: "Failed to get curated gigs" },
			{ status: 500 }
		);
	}
}

// PATCH /api/gigs/curate - Update a curated gig
export async function PATCH(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { companyId, gigId, status, notes, customReward } = body;

		if (!companyId || !gigId) {
			return NextResponse.json(
				{ error: "Missing required fields: companyId, gigId" },
				{ status: 400 }
			);
		}

		const updated = await updateCuratedGig(companyId, gigId, {
			status,
			notes,
			customReward,
		});

		if (!updated) {
			return NextResponse.json(
				{ error: "Curated gig not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true, gig: updated });
	} catch (error) {
		console.error("Update curated gig error:", error);
		return NextResponse.json(
			{ error: "Failed to update curated gig" },
			{ status: 500 }
		);
	}
}

// DELETE /api/gigs/curate - Remove a curated gig
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get("companyId");
		const gigId = searchParams.get("gigId");

		if (!companyId || !gigId) {
			return NextResponse.json(
				{ error: "Missing required fields: companyId, gigId" },
				{ status: 400 }
			);
		}

		const removed = await removeCuratedGig(companyId, gigId);

		return NextResponse.json({ success: removed });
	} catch (error) {
		console.error("Remove curated gig error:", error);
		return NextResponse.json(
			{ error: "Failed to remove curated gig" },
			{ status: 500 }
		);
	}
}

