// Website Feature Detector
// Crawls business websites to detect missing features and services

import {
	type MissingFeature,
	type FeatureType,
	FEATURE_DETECTION_PATTERNS,
} from "./types";

interface WebsiteAnalysisResult {
	url: string;
	accessible: boolean;
	hasSSL: boolean;
	missingFeatures: MissingFeature[];
	detectedFeatures: FeatureType[];
	pagesTested: string[];
	errors?: string[];
	analyzedAt: string;
}

interface PageContent {
	url: string;
	title: string;
	html: string;
	text: string;
	scripts: string[];
	links: string[];
	forms: string[];
	metaTags: Record<string, string>;
}

// Main function to analyze a website for missing features
export async function analyzeWebsite(websiteUrl: string): Promise<WebsiteAnalysisResult> {
	const result: WebsiteAnalysisResult = {
		url: websiteUrl,
		accessible: false,
		hasSSL: websiteUrl.startsWith("https://"),
		missingFeatures: [],
		detectedFeatures: [],
		pagesTested: [],
		errors: [],
		analyzedAt: new Date().toISOString(),
	};

	try {
		// Normalize URL
		const baseUrl = normalizeUrl(websiteUrl);
		
		// Fetch and analyze main page
		const mainPage = await fetchPage(baseUrl);
		if (!mainPage) {
			result.errors?.push("Could not access main page");
			return result;
		}

		result.accessible = true;
		result.pagesTested.push(baseUrl);

		// Find important internal links to crawl
		const pagesToCrawl = extractImportantLinks(mainPage, baseUrl);
		
		// Crawl additional pages (limit to 5 for performance)
		const additionalPages: PageContent[] = [];
		for (const pageUrl of pagesToCrawl.slice(0, 5)) {
			const page = await fetchPage(pageUrl);
			if (page) {
				additionalPages.push(page);
				result.pagesTested.push(pageUrl);
			}
		}

		const allPages = [mainPage, ...additionalPages];

		// Analyze for each feature type
		const featureTypes = Object.keys(FEATURE_DETECTION_PATTERNS) as FeatureType[];
		
		for (const featureType of featureTypes) {
			const detection = detectFeature(featureType, allPages, baseUrl);
			
			if (detection.detected) {
				result.detectedFeatures.push(featureType);
			} else {
				result.missingFeatures.push({
					feature: featureType,
					confidence: detection.confidence,
					searchedFor: detection.searchedFor,
					recommendation: getFeatureRecommendation(featureType),
				});
			}
		}

		// Filter to only high-confidence missing features
		result.missingFeatures = result.missingFeatures.filter(mf => mf.confidence > 0.6);

	} catch (error) {
		result.errors?.push(error instanceof Error ? error.message : "Unknown error");
	}

	return result;
}

// Normalize URL to ensure consistent format
function normalizeUrl(url: string): string {
	let normalized = url.trim();
	
	// Add protocol if missing
	if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
		normalized = "https://" + normalized;
	}
	
	// Remove trailing slash
	normalized = normalized.replace(/\/$/, "");
	
	return normalized;
}

// Fetch a page and extract content
async function fetchPage(url: string): Promise<PageContent | null> {
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; BountyBoard/1.0; +https://bountyboard.app)",
				"Accept": "text/html,application/xhtml+xml",
			},
			redirect: "follow",
			signal: AbortSignal.timeout(10000), // 10 second timeout
		});

		if (!response.ok) {
			return null;
		}

		const html = await response.text();
		
		return {
			url,
			title: extractTitle(html),
			html,
			text: extractText(html),
			scripts: extractScripts(html),
			links: extractLinks(html, url),
			forms: extractForms(html),
			metaTags: extractMetaTags(html),
		};
	} catch {
		return null;
	}
}

// Extract page title
function extractTitle(html: string): string {
	const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	return match ? match[1].trim() : "";
}

// Extract visible text content
function extractText(html: string): string {
	return html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.toLowerCase()
		.trim();
}

// Extract script sources
function extractScripts(html: string): string[] {
	const scripts: string[] = [];
	const srcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
	let match;
	while ((match = srcRegex.exec(html)) !== null) {
		scripts.push(match[1].toLowerCase());
	}
	
	// Also check inline script content for known services
	const inlineRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
	while ((match = inlineRegex.exec(html)) !== null) {
		scripts.push(match[1].toLowerCase());
	}
	
	return scripts;
}

// Extract internal links
function extractLinks(html: string, baseUrl: string): string[] {
	const links: string[] = [];
	const hrefRegex = /<a[^>]+href=["']([^"']+)["']/gi;
	let match;
	
	const baseDomain = new URL(baseUrl).hostname;
	
	while ((match = hrefRegex.exec(html)) !== null) {
		const href = match[1];
		
		// Skip external links, anchors, and special protocols
		if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
			continue;
		}
		
		try {
			const fullUrl = new URL(href, baseUrl);
			if (fullUrl.hostname === baseDomain) {
				links.push(fullUrl.href);
			}
		} catch {
			// Invalid URL, skip
		}
	}
	
	return [...new Set(links)];
}

// Extract form information
function extractForms(html: string): string[] {
	const forms: string[] = [];
	const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
	let match;
	
	while ((match = formRegex.exec(html)) !== null) {
		forms.push(match[0].toLowerCase());
	}
	
	return forms;
}

// Extract meta tags
function extractMetaTags(html: string): Record<string, string> {
	const tags: Record<string, string> = {};
	const metaRegex = /<meta[^>]+>/gi;
	let match;
	
	while ((match = metaRegex.exec(html)) !== null) {
		const nameMatch = match[0].match(/name=["']([^"']+)["']/i);
		const contentMatch = match[0].match(/content=["']([^"']+)["']/i);
		
		if (nameMatch && contentMatch) {
			tags[nameMatch[1].toLowerCase()] = contentMatch[1];
		}
	}
	
	return tags;
}

// Extract important links to crawl (contact, about, services, pricing, etc.)
function extractImportantLinks(page: PageContent, baseUrl: string): string[] {
	const importantKeywords = [
		"contact", "about", "services", "pricing", "prices", "menu",
		"book", "appointment", "schedule", "faq", "help", "support",
		"blog", "news", "testimonials", "reviews",
	];
	
	return page.links.filter(link => {
		const linkLower = link.toLowerCase();
		return importantKeywords.some(keyword => linkLower.includes(keyword));
	});
}

// Detect if a feature is present
function detectFeature(
	featureType: FeatureType,
	pages: PageContent[],
	baseUrl: string
): { detected: boolean; confidence: number; searchedFor: string[] } {
	const patterns = FEATURE_DETECTION_PATTERNS[featureType];
	const searchedFor: string[] = [];
	let signals = 0;
	let totalChecks = 0;

	// Check keywords in page content
	if (patterns.keywords && patterns.keywords.length > 0) {
		searchedFor.push(...patterns.keywords.slice(0, 3));
		
		for (const page of pages) {
			for (const keyword of patterns.keywords) {
				totalChecks++;
				if (page.text.includes(keyword.toLowerCase())) {
					signals++;
				}
			}
		}
	}

	// Check for known scripts/services
	if (patterns.scripts && patterns.scripts.length > 0) {
		searchedFor.push(...patterns.scripts.slice(0, 3).map(s => `${s} script`));
		
		for (const page of pages) {
			for (const script of patterns.scripts) {
				totalChecks++;
				if (page.scripts.some(s => s.includes(script.toLowerCase()))) {
					signals += 2; // Scripts are strong signals
				}
			}
		}
	}

	// Check for specific HTML elements
	if (patterns.elements && patterns.elements.length > 0) {
		searchedFor.push(...patterns.elements.slice(0, 2).map(e => `${e} element`));
		
		for (const page of pages) {
			for (const element of patterns.elements) {
				totalChecks++;
				if (page.html.toLowerCase().includes(element.toLowerCase())) {
					signals++;
				}
			}
		}
	}

	// Special detection for certain features
	switch (featureType) {
		case "ssl_certificate":
			totalChecks = 1;
			signals = baseUrl.startsWith("https://") ? 1 : 0;
			searchedFor.push("HTTPS protocol");
			break;
			
		case "mobile_responsive":
			totalChecks = 1;
			signals = pages.some(p => 
				p.metaTags.viewport?.includes("width=device-width")
			) ? 1 : 0;
			searchedFor.push("viewport meta tag");
			break;
			
		case "schema_markup":
			totalChecks = 1;
			signals = pages.some(p => 
				p.html.includes("application/ld+json") || 
				p.html.includes("itemtype=")
			) ? 1 : 0;
			searchedFor.push("JSON-LD or microdata");
			break;
			
		case "google_analytics":
			totalChecks = 1;
			signals = pages.some(p => 
				p.scripts.some(s => 
					s.includes("google-analytics") || 
					s.includes("gtag") || 
					s.includes("googletagmanager")
				)
			) ? 1 : 0;
			searchedFor.push("GA tracking code");
			break;
	}

	// Calculate confidence that feature is MISSING
	const detectionRatio = totalChecks > 0 ? signals / totalChecks : 0;
	const detected = detectionRatio > 0.2; // At least 20% of signals found
	
	// Confidence in the "missing" assessment
	// High confidence missing = low detection ratio
	const missingConfidence = detected ? 0 : Math.min(1 - detectionRatio + 0.3, 1);

	return {
		detected,
		confidence: missingConfidence,
		searchedFor,
	};
}

// Get recommendation text for a missing feature
function getFeatureRecommendation(featureType: FeatureType): string {
	const recommendations: Record<FeatureType, string> = {
		online_booking: "Add an online booking system (Calendly, Acuity, or custom) to let customers schedule 24/7",
		contact_form: "Add a contact form to capture leads and make it easy for customers to reach out",
		live_chat: "Implement live chat or a chatbot for instant customer support",
		newsletter_signup: "Add newsletter signup to build an email list for marketing",
		gift_cards: "Offer gift cards/vouchers as an additional revenue stream",
		online_ordering: "Enable online ordering for products or services",
		pricing_page: "Create a clear pricing page to help customers make decisions",
		faq_page: "Add an FAQ page to answer common questions and reduce support load",
		testimonials: "Display customer testimonials to build trust and credibility",
		ssl_certificate: "Install an SSL certificate for security (required for SEO and trust)",
		mobile_responsive: "Make the website mobile-responsive for better user experience",
		social_integration: "Add social media links and sharing buttons",
		google_analytics: "Install Google Analytics to track website performance",
		schema_markup: "Add schema markup for better search engine visibility",
		sitemap: "Create an XML sitemap for better search engine indexing",
		blog: "Start a blog to improve SEO and provide value to customers",
	};

	return recommendations[featureType] || "Consider adding this feature to improve customer experience";
}

// Quick check if a website is accessible
export async function checkWebsiteAccessibility(url: string): Promise<{
	accessible: boolean;
	hasSSL: boolean;
	loadTime?: number;
	error?: string;
}> {
	const normalizedUrl = normalizeUrl(url);
	const startTime = Date.now();

	try {
		const response = await fetch(normalizedUrl, {
			method: "HEAD",
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; BountyBoard/1.0)",
			},
			redirect: "follow",
			signal: AbortSignal.timeout(5000),
		});

		return {
			accessible: response.ok,
			hasSSL: normalizedUrl.startsWith("https://"),
			loadTime: Date.now() - startTime,
		};
	} catch (error) {
		return {
			accessible: false,
			hasSSL: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

