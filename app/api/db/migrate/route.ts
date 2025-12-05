import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// Run database migrations
export async function POST() {
	try {
		// Migration: Change gig_deadline from TIMESTAMP to VARCHAR to support service queries
		await sql`
			ALTER TABLE curated_gigs 
			ALTER COLUMN gig_deadline TYPE VARCHAR(255)
		`;

		return NextResponse.json({ 
			success: true, 
			message: "Migration completed: gig_deadline column updated to VARCHAR" 
		});
	} catch (error) {
		// Column might already be VARCHAR or table doesn't exist
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		
		// If the error is about type already being correct, that's fine
		if (errorMessage.includes("already") || errorMessage.includes("cannot alter")) {
			return NextResponse.json({ 
				success: true, 
				message: "Migration not needed or already applied" 
			});
		}

		console.error("Migration error:", error);
		return NextResponse.json(
			{ error: errorMessage },
			{ status: 500 }
		);
	}
}

// GET to check migration status
export async function GET() {
	try {
		// Check the column type
		const result = await sql`
			SELECT column_name, data_type 
			FROM information_schema.columns 
			WHERE table_name = 'curated_gigs' AND column_name = 'gig_deadline'
		`;

		if (result.rows.length === 0) {
			return NextResponse.json({ 
				status: "table_missing",
				message: "curated_gigs table or gig_deadline column not found" 
			});
		}

		const dataType = result.rows[0].data_type;
		return NextResponse.json({ 
			status: dataType === "character varying" ? "migrated" : "needs_migration",
			currentType: dataType,
			message: dataType === "character varying" 
				? "Column is already VARCHAR" 
				: "Column needs migration from TIMESTAMP to VARCHAR"
		});
	} catch (error) {
		console.error("Migration check error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 }
		);
	}
}

