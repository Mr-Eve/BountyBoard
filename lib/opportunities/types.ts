// Business Opportunity Discovery Types
// Analyzes businesses to find potential service opportunities

export interface Business {
	id: string;
	name: string;
	category: string;
	subcategories?: string[];
	address: string;
	city: string;
	state?: string;
	country: string;
	phone?: string;
	website?: string;
	email?: string;
	socialLinks?: {
		facebook?: string;
		instagram?: string;
		twitter?: string;
		linkedin?: string;
	};
	rating: number;
	reviewCount: number;
	priceLevel?: number; // 1-4 ($-$$$$)
	hours?: BusinessHours[];
	source: BusinessSource;
	sourceId: string;
	scrapedAt: string;
}

export interface BusinessHours {
	day: string;
	open: string;
	close: string;
}

export type BusinessSource = 
	| "google_places"
	| "yelp"
	| "tripadvisor"
	| "manual";

export interface Review {
	id: string;
	businessId: string;
	authorName: string;
	rating: number; // 1-5
	text: string;
	date: string;
	source: BusinessSource;
	language?: string;
}

// Pain points detected from reviews
export interface PainPoint {
	category: PainPointCategory;
	keywords: string[];
	reviewIds: string[];
	severity: number; // 1-10 based on frequency and recency
	examplePhrases: string[]; // Paraphrased examples
	count: number;
}

export type PainPointCategory =
	| "booking_issues"
	| "website_problems"
	| "slow_response"
	| "communication"
	| "online_presence"
	| "pricing_clarity"
	| "payment_options"
	| "customer_service"
	| "wait_times"
	| "accessibility"
	| "information_missing"
	| "social_media"
	| "mobile_experience"
	| "other";

// Services that could be offered based on pain points
export interface ServiceOpportunity {
	id: string;
	name: string;
	description: string;
	relatedPainPoints: PainPointCategory[];
	keywords: string[];
	estimatedValue: string; // e.g., "$500-2000"
	difficulty: "easy" | "medium" | "hard";
	timeEstimate: string; // e.g., "1-2 weeks"
}

// Missing features detected on business website
export interface MissingFeature {
	feature: FeatureType;
	confidence: number; // 0-1
	searchedFor: string[]; // Keywords/patterns we looked for
	recommendation: string;
}

export type FeatureType =
	| "online_booking"
	| "contact_form"
	| "live_chat"
	| "newsletter_signup"
	| "gift_cards"
	| "online_ordering"
	| "pricing_page"
	| "faq_page"
	| "testimonials"
	| "ssl_certificate"
	| "mobile_responsive"
	| "social_integration"
	| "google_analytics"
	| "schema_markup"
	| "sitemap"
	| "blog";

// Combined opportunity analysis for a business
export interface BusinessOpportunity {
	id: string;
	business: Business;
	reviews: Review[];
	painPoints: PainPoint[];
	missingFeatures: MissingFeature[];
	suggestedServices: ServiceSuggestion[];
	opportunityScore: number; // 0-100
	priorityLevel: "high" | "medium" | "low";
	notes?: string;
	analyzedAt: string;
}

export interface ServiceSuggestion {
	service: ServiceOpportunity;
	relevanceScore: number; // 0-100
	evidence: {
		painPointCount: number;
		missingFeatureMatch: boolean;
		reviewExamples: string[];
	};
	pitchSummary: string; // Auto-generated pitch summary
}

// Search parameters for finding businesses
export interface BusinessSearchParams {
	query: string; // e.g., "salons", "restaurants", "dentists"
	location: string; // City or area
	radius?: number; // In meters
	minRating?: number;
	maxRating?: number;
	minReviews?: number;
	category?: string;
}

// Curated opportunity for the board
export interface CuratedOpportunity {
	id: string;
	companyId: string;
	opportunity: BusinessOpportunity;
	status: "pending" | "approved" | "rejected" | "contacted" | "converted";
	notes?: string;
	customPitch?: string;
	addedAt: string;
	updatedAt?: string;
}

// Pain point to service mapping
export const PAIN_POINT_SERVICE_MAP: Record<PainPointCategory, string[]> = {
	booking_issues: [
		"Online booking system",
		"Appointment scheduling software",
		"Calendar integration",
	],
	website_problems: [
		"Website redesign",
		"Website maintenance",
		"Performance optimization",
	],
	slow_response: [
		"CRM setup",
		"Autoresponder system",
		"WhatsApp/SMS automation",
		"Chatbot implementation",
	],
	communication: [
		"Email automation",
		"Customer communication platform",
		"Multi-channel messaging",
	],
	online_presence: [
		"Local SEO optimization",
		"Google Business Profile setup",
		"Directory listings management",
	],
	pricing_clarity: [
		"Pricing page design",
		"Service menu creation",
		"Quote calculator tool",
	],
	payment_options: [
		"Online payment integration",
		"Invoice system",
		"Payment plan setup",
	],
	customer_service: [
		"Customer service training",
		"Help desk software",
		"FAQ system",
	],
	wait_times: [
		"Queue management system",
		"Real-time wait time display",
		"Appointment reminders",
	],
	accessibility: [
		"ADA compliance audit",
		"Accessibility improvements",
		"Multi-language support",
	],
	information_missing: [
		"Content writing",
		"Information architecture",
		"Website content update",
	],
	social_media: [
		"Social media management",
		"Content creation",
		"Social media advertising",
	],
	mobile_experience: [
		"Mobile app development",
		"Mobile-responsive redesign",
		"PWA development",
	],
	other: [
		"Business consultation",
		"Custom solution",
	],
};

// Keywords that indicate each pain point category
export const PAIN_POINT_KEYWORDS: Record<PainPointCategory, string[]> = {
	booking_issues: [
		"hard to book", "can't book", "couldn't book", "no online booking",
		"phone always busy", "never answer", "had to call multiple times",
		"booking system", "appointment", "schedule", "reservation",
		"couldn't get through", "no availability online", "book online",
	],
	website_problems: [
		"website down", "website broken", "website doesn't work", "bad website",
		"confusing website", "outdated website", "can't find", "hard to navigate",
		"website crashed", "slow website", "website error", "404",
	],
	slow_response: [
		"never replied", "no response", "slow response", "took days",
		"didn't respond", "waiting for reply", "no callback", "ignored",
		"left on read", "never got back", "slow to respond", "unresponsive",
	],
	communication: [
		"poor communication", "miscommunication", "didn't inform",
		"no updates", "kept in dark", "didn't tell", "lack of communication",
		"couldn't reach", "hard to contact", "no confirmation",
	],
	online_presence: [
		"couldn't find online", "no google", "hard to find", "not on maps",
		"wrong address online", "wrong hours", "outdated info", "no website",
		"can't find them", "not listed", "old information",
	],
	pricing_clarity: [
		"hidden fees", "surprise charges", "no prices listed", "unclear pricing",
		"didn't know cost", "price confusion", "unexpected bill", "overcharged",
		"no menu prices", "price not shown", "couldn't find prices",
	],
	payment_options: [
		"cash only", "no card", "couldn't pay online", "no payment options",
		"payment issues", "card declined", "no invoice", "payment difficult",
	],
	customer_service: [
		"rude staff", "unhelpful", "bad service", "poor service", "terrible service",
		"unprofessional", "didn't care", "ignored us", "bad attitude",
		"unfriendly", "disrespectful", "dismissive",
	],
	wait_times: [
		"long wait", "waited forever", "took too long", "slow service",
		"waited hours", "delayed", "kept waiting", "wait time", "queue",
	],
	accessibility: [
		"not accessible", "wheelchair", "disabled", "accessibility",
		"couldn't access", "no ramp", "stairs only", "hard to enter",
	],
	information_missing: [
		"no information", "couldn't find info", "missing details",
		"no description", "unclear services", "what do they offer",
		"no menu", "no service list",
	],
	social_media: [
		"no social media", "inactive facebook", "no instagram", "old posts",
		"don't respond on social", "no facebook page", "social media dead",
	],
	mobile_experience: [
		"mobile site", "phone browser", "mobile app", "can't use on phone",
		"not mobile friendly", "broken on mobile", "app crashes",
	],
	other: [],
};

// Feature detection patterns for website analysis
export const FEATURE_DETECTION_PATTERNS: Record<FeatureType, {
	keywords: string[];
	scripts?: string[];
	elements?: string[];
}> = {
	online_booking: {
		keywords: ["book now", "schedule appointment", "book online", "reserve", "appointments", "booking"],
		scripts: ["calendly", "acuity", "booksy", "vagaro", "square appointments", "setmore"],
		elements: ["booking-widget", "appointment-form"],
	},
	contact_form: {
		keywords: ["contact us", "get in touch", "send message", "inquiry"],
		elements: ["contact-form", "form[action*='contact']", "input[name='email']"],
	},
	live_chat: {
		keywords: ["live chat", "chat with us", "chat now"],
		scripts: ["intercom", "drift", "zendesk", "crisp", "tawk", "livechat", "hubspot"],
	},
	newsletter_signup: {
		keywords: ["subscribe", "newsletter", "stay updated", "join our list", "email list"],
		scripts: ["mailchimp", "convertkit", "klaviyo", "constant contact"],
	},
	gift_cards: {
		keywords: ["gift card", "gift certificate", "voucher", "buy a gift", "gift shop"],
	},
	online_ordering: {
		keywords: ["order online", "delivery", "pickup", "add to cart", "checkout"],
		scripts: ["shopify", "woocommerce", "squarespace commerce", "doordash", "ubereats", "grubhub"],
	},
	pricing_page: {
		keywords: ["pricing", "prices", "rates", "cost", "fees", "menu prices", "service prices"],
	},
	faq_page: {
		keywords: ["faq", "frequently asked", "common questions", "help center", "support"],
	},
	testimonials: {
		keywords: ["testimonials", "reviews", "what our customers say", "client feedback", "success stories"],
	},
	ssl_certificate: {
		keywords: [], // Detected via URL scheme
	},
	mobile_responsive: {
		keywords: [], // Detected via viewport meta tag
	},
	social_integration: {
		keywords: ["follow us", "connect with us"],
		scripts: ["facebook.com", "instagram.com", "twitter.com", "linkedin.com"],
		elements: ["social-links", "social-icons"],
	},
	google_analytics: {
		scripts: ["google-analytics", "gtag", "googletagmanager"],
	},
	schema_markup: {
		keywords: [], // Detected via JSON-LD or microdata
	},
	sitemap: {
		keywords: [], // Detected via /sitemap.xml
	},
	blog: {
		keywords: ["blog", "news", "articles", "latest posts", "insights"],
	},
};

// Service opportunities catalog
export const SERVICE_CATALOG: ServiceOpportunity[] = [
	{
		id: "online_booking_system",
		name: "Online Booking System",
		description: "Implement a modern online booking system to let customers schedule appointments 24/7",
		relatedPainPoints: ["booking_issues", "slow_response", "wait_times"],
		keywords: ["booking", "appointments", "scheduling", "calendar"],
		estimatedValue: "$500-2000",
		difficulty: "easy",
		timeEstimate: "1-2 weeks",
	},
	{
		id: "website_redesign",
		name: "Website Redesign",
		description: "Modern, mobile-responsive website redesign with clear navigation and information",
		relatedPainPoints: ["website_problems", "information_missing", "mobile_experience", "pricing_clarity"],
		keywords: ["website", "design", "responsive", "modern"],
		estimatedValue: "$2000-10000",
		difficulty: "medium",
		timeEstimate: "4-8 weeks",
	},
	{
		id: "local_seo",
		name: "Local SEO Optimization",
		description: "Improve local search visibility, Google Business Profile, and directory listings",
		relatedPainPoints: ["online_presence", "information_missing"],
		keywords: ["seo", "google", "local", "search", "maps"],
		estimatedValue: "$500-1500/month",
		difficulty: "medium",
		timeEstimate: "Ongoing",
	},
	{
		id: "crm_automation",
		name: "CRM & Automation Setup",
		description: "Set up customer relationship management with automated responses and follow-ups",
		relatedPainPoints: ["slow_response", "communication", "customer_service"],
		keywords: ["crm", "automation", "email", "response"],
		estimatedValue: "$1000-3000",
		difficulty: "medium",
		timeEstimate: "2-4 weeks",
	},
	{
		id: "chatbot_livechat",
		name: "Chatbot / Live Chat",
		description: "Implement AI chatbot or live chat for instant customer support",
		relatedPainPoints: ["slow_response", "communication", "customer_service"],
		keywords: ["chat", "bot", "support", "instant"],
		estimatedValue: "$500-2000",
		difficulty: "easy",
		timeEstimate: "1-2 weeks",
	},
	{
		id: "payment_integration",
		name: "Online Payment Integration",
		description: "Add online payment options including cards, invoicing, and payment plans",
		relatedPainPoints: ["payment_options", "booking_issues"],
		keywords: ["payment", "card", "invoice", "stripe"],
		estimatedValue: "$500-1500",
		difficulty: "easy",
		timeEstimate: "1 week",
	},
	{
		id: "social_media_management",
		name: "Social Media Management",
		description: "Set up and manage social media presence with regular content",
		relatedPainPoints: ["social_media", "online_presence", "communication"],
		keywords: ["social", "facebook", "instagram", "content"],
		estimatedValue: "$500-2000/month",
		difficulty: "easy",
		timeEstimate: "Ongoing",
	},
	{
		id: "review_management",
		name: "Review Management System",
		description: "Implement review collection and reputation management",
		relatedPainPoints: ["customer_service", "online_presence"],
		keywords: ["reviews", "reputation", "feedback"],
		estimatedValue: "$300-1000/month",
		difficulty: "easy",
		timeEstimate: "1 week setup",
	},
	{
		id: "email_marketing",
		name: "Email Marketing Setup",
		description: "Newsletter system with automated campaigns and customer segmentation",
		relatedPainPoints: ["communication", "social_media"],
		keywords: ["email", "newsletter", "marketing", "campaign"],
		estimatedValue: "$500-1500",
		difficulty: "easy",
		timeEstimate: "1-2 weeks",
	},
	{
		id: "mobile_app",
		name: "Mobile App Development",
		description: "Custom mobile app for bookings, orders, or customer engagement",
		relatedPainPoints: ["mobile_experience", "booking_issues", "communication"],
		keywords: ["app", "mobile", "ios", "android"],
		estimatedValue: "$5000-25000",
		difficulty: "hard",
		timeEstimate: "8-16 weeks",
	},
];

