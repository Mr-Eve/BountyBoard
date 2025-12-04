// Review Pain Point Analyzer
// Analyzes business reviews to detect pain points and service opportunities

import {
	type Review,
	type PainPoint,
	type PainPointCategory,
	type ServiceSuggestion,
	type BusinessOpportunity,
	type Business,
	type MissingFeature,
	PAIN_POINT_KEYWORDS,
	PAIN_POINT_SERVICE_MAP,
	SERVICE_CATALOG,
} from "./types";

// Analyze reviews to extract pain points
export function analyzeReviews(reviews: Review[]): PainPoint[] {
	const painPointMap = new Map<PainPointCategory, {
		keywords: Set<string>;
		reviewIds: Set<string>;
		examples: string[];
		recentCount: number;
	}>();

	// Initialize all categories
	const categories = Object.keys(PAIN_POINT_KEYWORDS) as PainPointCategory[];
	for (const category of categories) {
		painPointMap.set(category, {
			keywords: new Set(),
			reviewIds: new Set(),
			examples: [],
			recentCount: 0,
		});
	}

	// Only analyze reviews with signal (1-3 stars, or 4-5 with issues mentioned)
	const signalReviews = reviews.filter((review) => {
		// Low ratings have signal
		if (review.rating <= 3) return true;
		// High ratings with negative keywords also have signal
		if (review.rating >= 4) {
			const text = review.text.toLowerCase();
			return text.includes("but") || text.includes("however") || 
				   text.includes("only issue") || text.includes("wish") ||
				   text.includes("could be better") || text.includes("improve");
		}
		return false;
	});

	// Analyze each review
	for (const review of signalReviews) {
		const textLower = review.text.toLowerCase();
		const isRecent = isRecentReview(review.date);

		// Check each pain point category
		for (const [category, keywords] of Object.entries(PAIN_POINT_KEYWORDS)) {
			const cat = category as PainPointCategory;
			const data = painPointMap.get(cat)!;

			for (const keyword of keywords) {
				if (textLower.includes(keyword)) {
					data.keywords.add(keyword);
					data.reviewIds.add(review.id);
					if (isRecent) data.recentCount++;

					// Extract example phrase (context around the keyword)
					if (data.examples.length < 3) {
						const example = extractExamplePhrase(review.text, keyword);
						if (example && !data.examples.includes(example)) {
							data.examples.push(example);
						}
					}
				}
			}
		}
	}

	// Convert to PainPoint array and calculate severity
	const painPoints: PainPoint[] = [];

	for (const [category, data] of painPointMap) {
		if (data.reviewIds.size > 0) {
			const severity = calculateSeverity(
				data.reviewIds.size,
				data.recentCount,
				reviews.length
			);

			painPoints.push({
				category,
				keywords: Array.from(data.keywords),
				reviewIds: Array.from(data.reviewIds),
				severity,
				examplePhrases: data.examples,
				count: data.reviewIds.size,
			});
		}
	}

	// Sort by severity
	return painPoints.sort((a, b) => b.severity - a.severity);
}

// Check if a review is recent (within 6 months)
function isRecentReview(dateStr: string): boolean {
	const reviewDate = new Date(dateStr);
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
	return reviewDate > sixMonthsAgo;
}

// Calculate severity score (1-10)
function calculateSeverity(
	totalMentions: number,
	recentMentions: number,
	totalReviews: number
): number {
	// Base score from mention frequency
	const frequencyRatio = totalMentions / Math.max(totalReviews, 1);
	let score = Math.min(frequencyRatio * 20, 5); // Max 5 from frequency

	// Bonus for recent mentions (recency matters)
	const recencyBonus = Math.min(recentMentions * 0.5, 3); // Max 3 from recency
	score += recencyBonus;

	// Bonus for absolute count (more mentions = more serious)
	if (totalMentions >= 10) score += 2;
	else if (totalMentions >= 5) score += 1;

	return Math.min(Math.round(score * 10) / 10, 10);
}

// Extract a paraphrased example phrase around a keyword
function extractExamplePhrase(text: string, keyword: string): string | null {
	const lowerText = text.toLowerCase();
	const index = lowerText.indexOf(keyword);
	if (index === -1) return null;

	// Get surrounding context (up to 100 chars before and after)
	const start = Math.max(0, index - 50);
	const end = Math.min(text.length, index + keyword.length + 50);
	
	let phrase = text.slice(start, end).trim();
	
	// Clean up - find sentence boundaries
	if (start > 0) phrase = "..." + phrase;
	if (end < text.length) phrase = phrase + "...";

	// Paraphrase slightly (remove specific names, etc.)
	phrase = phrase
		.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[name]") // Names
		.replace(/\$\d+(\.\d{2})?/g, "[amount]") // Money
		.slice(0, 150);

	return phrase;
}

// Generate service suggestions based on pain points and missing features
export function generateServiceSuggestions(
	painPoints: PainPoint[],
	missingFeatures: MissingFeature[]
): ServiceSuggestion[] {
	const suggestions: ServiceSuggestion[] = [];

	for (const service of SERVICE_CATALOG) {
		let relevanceScore = 0;
		let painPointCount = 0;
		let missingFeatureMatch = false;
		const reviewExamples: string[] = [];

		// Check pain point matches
		for (const painPoint of painPoints) {
			if (service.relatedPainPoints.includes(painPoint.category)) {
				relevanceScore += painPoint.severity * 5;
				painPointCount += painPoint.count;
				reviewExamples.push(...painPoint.examplePhrases.slice(0, 2));
			}
		}

		// Check missing feature matches
		for (const missing of missingFeatures) {
			// Map feature types to service keywords
			const featureServiceMap: Record<string, string[]> = {
				online_booking: ["booking", "appointments", "scheduling"],
				contact_form: ["contact", "communication"],
				live_chat: ["chat", "support", "instant"],
				newsletter_signup: ["email", "newsletter", "marketing"],
				gift_cards: ["gift", "voucher"],
				online_ordering: ["order", "commerce", "cart"],
				pricing_page: ["pricing", "prices"],
				faq_page: ["faq", "support"],
				testimonials: ["reviews", "testimonials"],
				social_integration: ["social", "facebook", "instagram"],
				blog: ["content", "blog"],
			};

			const featureKeywords = featureServiceMap[missing.feature] || [];
			const hasMatch = service.keywords.some(k => 
				featureKeywords.some(fk => k.includes(fk) || fk.includes(k))
			);

			if (hasMatch && missing.confidence > 0.7) {
				relevanceScore += 20;
				missingFeatureMatch = true;
			}
		}

		// Only suggest if there's some relevance
		if (relevanceScore > 10) {
			const pitchSummary = generatePitchSummary(
				service,
				painPointCount,
				missingFeatureMatch,
				reviewExamples
			);

			suggestions.push({
				service,
				relevanceScore: Math.min(relevanceScore, 100),
				evidence: {
					painPointCount,
					missingFeatureMatch,
					reviewExamples: reviewExamples.slice(0, 3),
				},
				pitchSummary,
			});
		}
	}

	// Sort by relevance
	return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// Generate a pitch summary for a service suggestion
function generatePitchSummary(
	service: typeof SERVICE_CATALOG[0],
	painPointCount: number,
	missingFeatureMatch: boolean,
	examples: string[]
): string {
	const parts: string[] = [];

	if (painPointCount > 0) {
		parts.push(`${painPointCount} customer${painPointCount > 1 ? "s" : ""} mentioned related issues`);
	}

	if (missingFeatureMatch) {
		parts.push("this feature appears to be missing from their website");
	}

	if (examples.length > 0) {
		parts.push(`customers say things like "${examples[0].slice(0, 80)}..."`);
	}

	const evidence = parts.length > 0 ? ` (${parts.join("; ")})` : "";

	return `${service.name}: ${service.description}${evidence}. Estimated value: ${service.estimatedValue}.`;
}

// Calculate overall opportunity score for a business
export function calculateOpportunityScore(
	painPoints: PainPoint[],
	missingFeatures: MissingFeature[],
	business: Business
): { score: number; priority: "high" | "medium" | "low" } {
	let score = 0;

	// Pain point contribution (max 50 points)
	const painPointScore = painPoints.reduce((sum, pp) => sum + pp.severity, 0);
	score += Math.min(painPointScore * 3, 50);

	// Missing features contribution (max 30 points)
	const missingScore = missingFeatures
		.filter(mf => mf.confidence > 0.7)
		.length * 5;
	score += Math.min(missingScore, 30);

	// Business profile contribution (max 20 points)
	// Higher review count = more potential customers = better opportunity
	if (business.reviewCount >= 100) score += 10;
	else if (business.reviewCount >= 50) score += 7;
	else if (business.reviewCount >= 20) score += 5;

	// Lower rating = more room for improvement
	if (business.rating < 3.5) score += 10;
	else if (business.rating < 4.0) score += 5;

	// Determine priority
	let priority: "high" | "medium" | "low";
	if (score >= 70) priority = "high";
	else if (score >= 40) priority = "medium";
	else priority = "low";

	return { score: Math.min(score, 100), priority };
}

// Create a complete business opportunity analysis
export function analyzeBusinessOpportunity(
	business: Business,
	reviews: Review[],
	missingFeatures: MissingFeature[]
): BusinessOpportunity {
	const painPoints = analyzeReviews(reviews);
	const suggestedServices = generateServiceSuggestions(painPoints, missingFeatures);
	const { score, priority } = calculateOpportunityScore(painPoints, missingFeatures, business);

	return {
		id: `opp_${business.id}_${Date.now()}`,
		business,
		reviews,
		painPoints,
		missingFeatures,
		suggestedServices,
		opportunityScore: score,
		priorityLevel: priority,
		analyzedAt: new Date().toISOString(),
	};
}

// Sentiment analysis helper (simple rule-based for now)
export function analyzeSentiment(text: string): "positive" | "negative" | "neutral" | "mixed" {
	const lowerText = text.toLowerCase();
	
	const positiveWords = [
		"great", "excellent", "amazing", "wonderful", "fantastic", "love",
		"best", "perfect", "awesome", "outstanding", "recommend", "friendly",
	];
	
	const negativeWords = [
		"bad", "terrible", "awful", "horrible", "worst", "hate", "never",
		"disappointed", "poor", "rude", "slow", "wait", "problem", "issue",
	];

	const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
	const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

	if (positiveCount > 0 && negativeCount > 0) return "mixed";
	if (positiveCount > negativeCount) return "positive";
	if (negativeCount > positiveCount) return "negative";
	return "neutral";
}

