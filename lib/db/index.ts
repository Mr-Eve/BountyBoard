import { sql } from "@vercel/postgres";
import type { ScrapedGig, CuratedGig, GigSource } from "../scrapers/types";

// Helper to generate IDs
function generateId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Convert database row to CuratedGig object
function rowToCuratedGig(row: any): CuratedGig {
	return {
		id: row.id,
		companyId: row.company_id,
		status: row.status,
		notes: row.notes,
		customReward: row.custom_reward,
		addedAt: row.added_at?.toISOString(),
		approvedAt: row.approved_at?.toISOString(),
		gig: {
			id: row.id,
			source: row.gig_source as GigSource,
			sourceUrl: row.gig_source_url,
			title: row.gig_title,
			description: row.gig_description || "",
			budget: row.gig_budget_min || row.gig_budget_max ? {
				min: row.gig_budget_min,
				max: row.gig_budget_max,
				type: row.gig_budget_type || "fixed",
				currency: row.gig_budget_currency || "USD",
			} : undefined,
			skills: row.gig_skills || [],
			postedAt: row.gig_posted_at?.toISOString(),
			deadline: row.gig_deadline?.toISOString(),
			clientInfo: row.gig_client_name ? {
				name: row.gig_client_name,
				rating: row.gig_client_rating ? parseFloat(row.gig_client_rating) : undefined,
				jobsPosted: row.gig_client_jobs_posted,
				location: row.gig_client_location,
			} : undefined,
			scrapedAt: row.gig_scraped_at?.toISOString() || row.added_at?.toISOString(),
		},
	};
}

// Get curated gigs for a company
export async function getCuratedGigsFromDB(
	companyId: string,
	status?: CuratedGig["status"]
): Promise<CuratedGig[]> {
	try {
		let result;
		if (status) {
			result = await sql`
				SELECT * FROM curated_gigs 
				WHERE company_id = ${companyId} AND status = ${status}
				ORDER BY added_at DESC
			`;
		} else {
			result = await sql`
				SELECT * FROM curated_gigs 
				WHERE company_id = ${companyId}
				ORDER BY added_at DESC
			`;
		}
		return result.rows.map(rowToCuratedGig);
	} catch (error) {
		console.error("Database error (getCuratedGigs):", error);
		return [];
	}
}

// Add a curated gig
export async function addCuratedGigToDB(
	companyId: string,
	gig: ScrapedGig,
	status: CuratedGig["status"] = "pending"
): Promise<CuratedGig | null> {
	try {
		const id = generateId("cg");
		const now = new Date().toISOString();

		// Convert skills array to PostgreSQL array format
		const skillsArray = gig.skills.length > 0 ? `{${gig.skills.map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')}}` : null;

		await sql`
			INSERT INTO curated_gigs (
				id, company_id, status, added_at,
				gig_source, gig_source_url, gig_title, gig_description,
				gig_budget_min, gig_budget_max, gig_budget_type, gig_budget_currency,
				gig_skills, gig_posted_at, gig_deadline,
				gig_client_name, gig_client_rating, gig_client_jobs_posted, gig_client_location,
				gig_scraped_at
			) VALUES (
				${id}, ${companyId}, ${status}, ${now},
				${gig.source}, ${gig.sourceUrl}, ${gig.title}, ${gig.description},
				${gig.budget?.min || null}, ${gig.budget?.max || null}, 
				${gig.budget?.type || null}, ${gig.budget?.currency || 'USD'},
				${skillsArray}, ${gig.postedAt || null}, 
				${gig.deadline || null},
				${gig.clientInfo?.name || null}, ${gig.clientInfo?.rating || null},
				${gig.clientInfo?.jobsPosted || null}, ${gig.clientInfo?.location || null},
				${gig.scrapedAt || now}
			)
		`;

		return {
			id,
			companyId,
			status,
			addedAt: now,
			gig,
		};
	} catch (error) {
		console.error("Database error (addCuratedGig):", error);
		return null;
	}
}

// Update a curated gig
export async function updateCuratedGigInDB(
	id: string,
	updates: Partial<Pick<CuratedGig, "status" | "notes" | "customReward">>
): Promise<boolean> {
	try {
		const now = new Date().toISOString();
		const approvedAt = updates.status === "approved" ? now : null;

		await sql`
			UPDATE curated_gigs 
			SET 
				status = COALESCE(${updates.status || null}, status),
				notes = COALESCE(${updates.notes || null}, notes),
				custom_reward = COALESCE(${updates.customReward || null}, custom_reward),
				approved_at = COALESCE(${approvedAt}, approved_at),
				updated_at = ${now}
			WHERE id = ${id}
		`;

		return true;
	} catch (error) {
		console.error("Database error (updateCuratedGig):", error);
		return false;
	}
}

// Delete a curated gig
export async function deleteCuratedGigFromDB(id: string): Promise<boolean> {
	try {
		await sql`DELETE FROM curated_gigs WHERE id = ${id}`;
		return true;
	} catch (error) {
		console.error("Database error (deleteCuratedGig):", error);
		return false;
	}
}

// Get approved gigs (for members)
export async function getApprovedGigsFromDB(companyId: string): Promise<CuratedGig[]> {
	return getCuratedGigsFromDB(companyId, "approved");
}

// Initialize database tables (run once)
export async function initializeDatabase(): Promise<void> {
	try {
		await sql`
			CREATE TABLE IF NOT EXISTS curated_gigs (
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
				gig_deadline TIMESTAMP WITH TIME ZONE,
				gig_client_name VARCHAR(255),
				gig_client_rating DECIMAL(3,2),
				gig_client_jobs_posted INTEGER,
				gig_client_location VARCHAR(255),
				gig_scraped_at TIMESTAMP WITH TIME ZONE,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			)
		`;

		await sql`CREATE INDEX IF NOT EXISTS idx_curated_gigs_company_id ON curated_gigs(company_id)`;
		await sql`CREATE INDEX IF NOT EXISTS idx_curated_gigs_status ON curated_gigs(status)`;

		console.log("Database initialized successfully");
	} catch (error) {
		console.error("Database initialization error:", error);
	}
}

