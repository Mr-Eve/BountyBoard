import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// Run database migrations
export async function POST() {
	const results: string[] = [];
	
	try {
		// Migration 1: Change gig_deadline from TIMESTAMP to VARCHAR to support service queries
		// Need to use USING clause to cast existing data
		try {
			await sql`
				ALTER TABLE curated_gigs 
				ALTER COLUMN gig_deadline TYPE VARCHAR(255) 
				USING gig_deadline::VARCHAR(255)
			`;
			results.push("✓ gig_deadline column converted to VARCHAR(255)");
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes("already") || msg.includes("character varying")) {
				results.push("✓ gig_deadline already VARCHAR (no change needed)");
			} else {
				results.push(`✗ gig_deadline migration failed: ${msg}`);
			}
		}

		// Migration 2: Ensure all required columns exist
		try {
			// Check if table exists first
			const tableCheck = await sql`
				SELECT EXISTS (
					SELECT FROM information_schema.tables 
					WHERE table_name = 'curated_gigs'
				)
			`;
			
			if (!tableCheck.rows[0].exists) {
				// Create the table if it doesn't exist
				await sql`
					CREATE TABLE curated_gigs (
						id VARCHAR(64) PRIMARY KEY,
						company_id VARCHAR(64) NOT NULL,
						status VARCHAR(20) NOT NULL DEFAULT 'pending',
						notes TEXT,
						custom_reward VARCHAR(255),
						added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
						approved_at TIMESTAMP WITH TIME ZONE,
						gig_source VARCHAR(32) NOT NULL,
						gig_source_url TEXT NOT NULL,
						gig_title VARCHAR(500) NOT NULL,
						gig_description TEXT,
						gig_budget_min INTEGER,
						gig_budget_max INTEGER,
						gig_budget_type VARCHAR(20),
						gig_budget_currency VARCHAR(10) DEFAULT 'USD',
						gig_skills TEXT[],
						gig_posted_at TIMESTAMP WITH TIME ZONE,
						gig_deadline VARCHAR(255),
						gig_client_name VARCHAR(255),
						gig_client_rating DECIMAL(3,2),
						gig_client_jobs_posted INTEGER,
						gig_client_location VARCHAR(255),
						gig_scraped_at TIMESTAMP WITH TIME ZONE,
						created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
						updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
					)
				`;
				results.push("✓ Created curated_gigs table");
			} else {
				results.push("✓ curated_gigs table exists");
			}
		} catch (e) {
			results.push(`Table check/create: ${e instanceof Error ? e.message : String(e)}`);
		}

		return NextResponse.json({ 
			success: true, 
			message: "Migration completed",
			results
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error("Migration error:", error);
		return NextResponse.json(
			{ error: errorMessage, results },
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

