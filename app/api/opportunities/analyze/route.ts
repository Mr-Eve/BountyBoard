import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { analyzeBusinessByUrl } from "@/lib/opportunities";

// Analyze a single business by website URL
export async function POST(request: NextRequest) {
	try {
		// Verify user is authenticated
		const { userId } = await whopsdk.verifyUserToken(await headers());
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { websiteUrl, businessInfo } = body as {
			websiteUrl: string;
			businessInfo?: {
				name?: string;
				category?: string;
				city?: string;
				country?: string;
			};
		};

		if (!websiteUrl) {
			return NextResponse.json(
				{ error: "Missing required field: websiteUrl" },
				{ status: 400 }
			);
		}

		const opportunity = await analyzeBusinessByUrl(websiteUrl, businessInfo);

		if (!opportunity) {
			return NextResponse.json(
				{ error: "Could not analyze website. It may be inaccessible." },
				{ status: 400 }
			);
		}

		return NextResponse.json({
			success: true,
			opportunity,
		});
	} catch (error) {
		console.error("Website analysis error:", error);
		return NextResponse.json(
			{ error: "Failed to analyze website" },
			{ status: 500 }
		);
	}
}

