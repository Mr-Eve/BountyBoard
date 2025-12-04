import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import {
	addCuratedOpportunity,
	getCuratedOpportunities,
	updateCuratedOpportunity,
	deleteCuratedOpportunity,
	type BusinessOpportunity,
	type CuratedOpportunity,
} from "@/lib/opportunities";

// Add a curated opportunity
export async function POST(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { companyId, opportunity, status } = body as {
			companyId: string;
			opportunity: BusinessOpportunity;
			status?: CuratedOpportunity["status"];
		};

		if (!companyId || !opportunity) {
			return NextResponse.json(
				{ error: "Missing required fields: companyId, opportunity" },
				{ status: 400 }
			);
		}

		const curated = await addCuratedOpportunity(companyId, opportunity, status);

		return NextResponse.json({
			success: true,
			curatedOpportunity: curated,
		});
	} catch (error) {
		console.error("Add curated opportunity error:", error);
		return NextResponse.json(
			{ error: "Failed to add curated opportunity" },
			{ status: 500 }
		);
	}
}

// Get curated opportunities for a company
export async function GET(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get("companyId");
		const status = searchParams.get("status") as CuratedOpportunity["status"] | null;

		if (!companyId) {
			return NextResponse.json(
				{ error: "Missing required parameter: companyId" },
				{ status: 400 }
			);
		}

		const opportunities = await getCuratedOpportunities(
			companyId,
			status || undefined
		);

		return NextResponse.json({
			success: true,
			opportunities,
			totalCount: opportunities.length,
		});
	} catch (error) {
		console.error("Get curated opportunities error:", error);
		return NextResponse.json(
			{ error: "Failed to get curated opportunities" },
			{ status: 500 }
		);
	}
}

// Update a curated opportunity
export async function PATCH(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { id, status, notes, customPitch } = body as {
			id: string;
			status?: CuratedOpportunity["status"];
			notes?: string;
			customPitch?: string;
		};

		if (!id) {
			return NextResponse.json(
				{ error: "Missing required field: id" },
				{ status: 400 }
			);
		}

		const updated = await updateCuratedOpportunity(id, { status, notes, customPitch });

		if (!updated) {
			return NextResponse.json(
				{ error: "Opportunity not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			curatedOpportunity: updated,
		});
	} catch (error) {
		console.error("Update curated opportunity error:", error);
		return NextResponse.json(
			{ error: "Failed to update curated opportunity" },
			{ status: 500 }
		);
	}
}

// Delete a curated opportunity
export async function DELETE(request: NextRequest) {
	try {
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Missing required parameter: id" },
				{ status: 400 }
			);
		}

		const deleted = await deleteCuratedOpportunity(id);

		return NextResponse.json({
			success: deleted,
		});
	} catch (error) {
		console.error("Delete curated opportunity error:", error);
		return NextResponse.json(
			{ error: "Failed to delete curated opportunity" },
			{ status: 500 }
		);
	}
}

