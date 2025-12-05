-- Bounty Board Database Schema

-- Curated gigs table
CREATE TABLE IF NOT EXISTS curated_gigs (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    custom_reward VARCHAR(255),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Scraped gig data (stored as JSON for flexibility)
    gig_source VARCHAR(32) NOT NULL,
    gig_source_url TEXT NOT NULL,
    gig_title VARCHAR(500) NOT NULL,
    gig_description TEXT,
    gig_budget_min INTEGER,
    gig_budget_max INTEGER,
    gig_budget_type VARCHAR(20),
    gig_budget_currency VARCHAR(10) DEFAULT 'USD',
    gig_skills TEXT[], -- Array of skills
    gig_posted_at TIMESTAMP WITH TIME ZONE,
    gig_deadline VARCHAR(255), -- Can be timestamp string or service query for AI curated
    gig_client_name VARCHAR(255),
    gig_client_rating DECIMAL(3,2),
    gig_client_jobs_posted INTEGER,
    gig_client_location VARCHAR(255),
    gig_scraped_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by company
CREATE INDEX IF NOT EXISTS idx_curated_gigs_company_id ON curated_gigs(company_id);
CREATE INDEX IF NOT EXISTS idx_curated_gigs_status ON curated_gigs(status);
CREATE INDEX IF NOT EXISTS idx_curated_gigs_company_status ON curated_gigs(company_id, status);

-- Search queries table (optional - for saved searches)
CREATE TABLE IF NOT EXISTS search_queries (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    query VARCHAR(500) NOT NULL,
    sources TEXT[], -- Array of source names
    filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_run_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_search_queries_company_id ON search_queries(company_id);

