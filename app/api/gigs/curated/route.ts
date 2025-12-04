import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import {
	getCuratedGigs,
	addCuratedGig,
	updateCuratedGig,
	deleteCuratedGig,
	type ScrapedGig,
	type CuratedGig,
} from "@/lib/scrapers";

// GET - Get curated gigs for a company
export async function GET(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get("companyId");
		const status = searchParams.get("status") as CuratedGig["status"] | null;

		if (!companyId) {
			return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
		}

		const gigs = await getCuratedGigs(companyId, status || undefined);

		return NextResponse.json({ success: true, gigs });
	} catch (error) {
		console.error("Get curated gigs error:", error);
		return NextResponse.json(
			{ error: "Failed to get curated gigs" },
			{ status: 500 }
		);
	}
}

// POST - Add a gig to curated list
export async function POST(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { companyId, gig, status } = body as {
			companyId: string;
			gig: ScrapedGig;
			status?: CuratedGig["status"];
		};

		if (!companyId || !gig) {
			return NextResponse.json(
				{ error: "Missing required fields: companyId, gig" },
				{ status: 400 }
			);
		}

		const curatedGig = await addCuratedGig(companyId, gig, status || "pending");

		return NextResponse.json({ success: true, curatedGig });
	} catch (error) {
		console.error("Add curated gig error:", error);
		return NextResponse.json(
			{ error: "Failed to add curated gig" },
			{ status: 500 }
		);
	}
}

// PATCH - Update a curated gig (approve, reject, add notes)
export async function PATCH(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { id, status, notes, customReward } = body as {
			id: string;
			status?: CuratedGig["status"];
			notes?: string;
			customReward?: string;
		};

		if (!id) {
			return NextResponse.json({ error: "Missing gig id" }, { status: 400 });
		}

		const updated = await updateCuratedGig(id, { status, notes, customReward });

		if (!updated) {
			return NextResponse.json({ error: "Gig not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, curatedGig: updated });
	} catch (error) {
		console.error("Update curated gig error:", error);
		return NextResponse.json(
			{ error: "Failed to update curated gig" },
			{ status: 500 }
		);
	}
}

// DELETE - Remove a curated gig
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "Missing gig id" }, { status: 400 });
		}

		const deleted = await deleteCuratedGig(id);

		if (!deleted) {
			return NextResponse.json({ error: "Gig not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete curated gig error:", error);
		return NextResponse.json(
			{ error: "Failed to delete curated gig" },
			{ status: 500 }
		);
	}
}

