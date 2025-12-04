// Google Places Scraper
// Uses Google Places API to find businesses and their reviews
// Requires GOOGLE_PLACES_API_KEY environment variable

import type {
	Business,
	Review,
	BusinessSearchParams,
} from "../types";

interface GooglePlaceResult {
	place_id: string;
	name: string;
	formatted_address: string;
	geometry: {
		location: {
			lat: number;
			lng: number;
		};
	};
	rating?: number;
	user_ratings_total?: number;
	price_level?: number;
	types?: string[];
	opening_hours?: {
		open_now?: boolean;
		weekday_text?: string[];
	};
	photos?: Array<{
		photo_reference: string;
	}>;
}

interface GooglePlaceDetails {
	place_id: string;
	name: string;
	formatted_address: string;
	formatted_phone_number?: string;
	international_phone_number?: string;
	website?: string;
	url?: string; // Google Maps URL
	rating?: number;
	user_ratings_total?: number;
	price_level?: number;
	types?: string[];
	opening_hours?: {
		weekday_text?: string[];
		periods?: Array<{
			open: { day: number; time: string };
			close?: { day: number; time: string };
		}>;
	};
	reviews?: GoogleReview[];
	address_components?: Array<{
		long_name: string;
		short_name: string;
		types: string[];
	}>;
}

interface GoogleReview {
	author_name: string;
	rating: number;
	text: string;
	time: number; // Unix timestamp
	language?: string;
	relative_time_description?: string;
}

export class GooglePlacesScraper {
	private apiKey: string | undefined;
	private baseUrl = "https://maps.googleapis.com/maps/api/place";

	constructor() {
		this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
	}

	// Check if API is configured
	isConfigured(): boolean {
		return !!this.apiKey;
	}

	// Search for businesses
	async searchBusinesses(params: BusinessSearchParams): Promise<{
		businesses: Business[];
		error?: string;
	}> {
		if (!this.apiKey) {
			return {
				businesses: [],
				error: "GOOGLE_PLACES_API_KEY not configured. Get one at https://console.cloud.google.com/apis/credentials",
			};
		}

		try {
			// Text search for businesses
			const searchUrl = new URL(`${this.baseUrl}/textsearch/json`);
			searchUrl.searchParams.set("query", `${params.query} in ${params.location}`);
			searchUrl.searchParams.set("key", this.apiKey);
			
			if (params.radius) {
				searchUrl.searchParams.set("radius", String(params.radius));
			}

			const response = await fetch(searchUrl.toString());
			const data = await response.json();

			if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
				throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ""}`);
			}

			const results: GooglePlaceResult[] = data.results || [];

			// Convert to Business objects
			const businesses: Business[] = results.map((place) => ({
				id: `gp_${place.place_id}`,
				name: place.name,
				category: this.mapCategory(place.types || []),
				subcategories: place.types || [],
				address: place.formatted_address,
				city: this.extractCity(place.formatted_address),
				country: this.extractCountry(place.formatted_address),
				rating: place.rating || 0,
				reviewCount: place.user_ratings_total || 0,
				priceLevel: place.price_level,
				source: "google_places",
				sourceId: place.place_id,
				scrapedAt: new Date().toISOString(),
			}));

			// Filter by rating/reviews if specified
			let filtered = businesses;
			if (params.minRating) {
				filtered = filtered.filter(b => b.rating >= params.minRating!);
			}
			if (params.maxRating) {
				filtered = filtered.filter(b => b.rating <= params.maxRating!);
			}
			if (params.minReviews) {
				filtered = filtered.filter(b => b.reviewCount >= params.minReviews!);
			}

			return { businesses: filtered };
		} catch (error) {
			return {
				businesses: [],
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	// Get detailed information about a business including reviews
	async getBusinessDetails(placeId: string): Promise<{
		business: Business | null;
		reviews: Review[];
		error?: string;
	}> {
		if (!this.apiKey) {
			return {
				business: null,
				reviews: [],
				error: "GOOGLE_PLACES_API_KEY not configured",
			};
		}

		try {
			const detailsUrl = new URL(`${this.baseUrl}/details/json`);
			detailsUrl.searchParams.set("place_id", placeId);
			detailsUrl.searchParams.set("fields", [
				"place_id", "name", "formatted_address", "formatted_phone_number",
				"website", "rating", "user_ratings_total", "price_level", "types",
				"opening_hours", "reviews", "address_components", "url",
			].join(","));
			detailsUrl.searchParams.set("key", this.apiKey);
			// Request reviews in English
			detailsUrl.searchParams.set("reviews_sort", "newest");

			const response = await fetch(detailsUrl.toString());
			const data = await response.json();

			if (data.status !== "OK") {
				throw new Error(`Google Places API error: ${data.status}`);
			}

			const place: GooglePlaceDetails = data.result;

			// Extract city and country from address components
			let city = "";
			let state = "";
			let country = "";
			
			if (place.address_components) {
				for (const component of place.address_components) {
					if (component.types.includes("locality")) {
						city = component.long_name;
					}
					if (component.types.includes("administrative_area_level_1")) {
						state = component.short_name;
					}
					if (component.types.includes("country")) {
						country = component.long_name;
					}
				}
			}

			const business: Business = {
				id: `gp_${place.place_id}`,
				name: place.name,
				category: this.mapCategory(place.types || []),
				subcategories: place.types,
				address: place.formatted_address,
				city: city || this.extractCity(place.formatted_address),
				state,
				country: country || this.extractCountry(place.formatted_address),
				phone: place.formatted_phone_number,
				website: place.website,
				rating: place.rating || 0,
				reviewCount: place.user_ratings_total || 0,
				priceLevel: place.price_level,
				hours: this.parseHours(place.opening_hours?.weekday_text),
				source: "google_places",
				sourceId: place.place_id,
				scrapedAt: new Date().toISOString(),
			};

			// Convert reviews
			const reviews: Review[] = (place.reviews || []).map((review, index) => ({
				id: `gp_${place.place_id}_review_${index}`,
				businessId: business.id,
				authorName: review.author_name,
				rating: review.rating,
				text: review.text,
				date: new Date(review.time * 1000).toISOString(),
				source: "google_places",
				language: review.language,
			}));

			return { business, reviews };
		} catch (error) {
			return {
				business: null,
				reviews: [],
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	// Map Google place types to our categories
	private mapCategory(types: string[]): string {
		const categoryMap: Record<string, string> = {
			restaurant: "Restaurant",
			food: "Food & Dining",
			cafe: "Cafe",
			bar: "Bar",
			bakery: "Bakery",
			beauty_salon: "Beauty Salon",
			hair_care: "Hair Salon",
			spa: "Spa",
			gym: "Gym & Fitness",
			dentist: "Dentist",
			doctor: "Medical",
			hospital: "Medical",
			pharmacy: "Pharmacy",
			veterinary_care: "Veterinary",
			lawyer: "Legal Services",
			accounting: "Accounting",
			real_estate_agency: "Real Estate",
			car_dealer: "Auto Dealer",
			car_repair: "Auto Repair",
			car_wash: "Auto Services",
			lodging: "Hotel",
			store: "Retail",
			clothing_store: "Clothing",
			electronics_store: "Electronics",
			home_goods_store: "Home Goods",
			furniture_store: "Furniture",
			florist: "Florist",
			pet_store: "Pet Store",
			school: "Education",
			university: "Education",
		};

		for (const type of types) {
			if (categoryMap[type]) {
				return categoryMap[type];
			}
		}

		// Default based on first type
		if (types.length > 0) {
			return types[0].replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
		}

		return "Business";
	}

	// Extract city from formatted address
	private extractCity(address: string): string {
		const parts = address.split(",").map(p => p.trim());
		// City is usually the second-to-last or third-to-last part
		if (parts.length >= 3) {
			// Try to find a part that looks like a city (not a number/zip)
			for (let i = parts.length - 2; i >= 1; i--) {
				const part = parts[i];
				if (!/^\d/.test(part) && !/\d{5}/.test(part)) {
					return part.split(" ")[0]; // Take first word if it has state code
				}
			}
		}
		return parts[1] || "";
	}

	// Extract country from formatted address
	private extractCountry(address: string): string {
		const parts = address.split(",").map(p => p.trim());
		return parts[parts.length - 1] || "";
	}

	// Parse opening hours
	private parseHours(weekdayText?: string[]): Business["hours"] {
		if (!weekdayText) return undefined;

		return weekdayText.map((text) => {
			const [day, hours] = text.split(": ");
			if (hours === "Closed") {
				return { day, open: "Closed", close: "Closed" };
			}
			const [open, close] = hours.split(" – ");
			return { day, open: open || "", close: close || "" };
		});
	}
}

// Singleton instance
let googlePlacesScraper: GooglePlacesScraper | null = null;

export function getGooglePlacesScraper(): GooglePlacesScraper {
	if (!googlePlacesScraper) {
		googlePlacesScraper = new GooglePlacesScraper();
	}
	return googlePlacesScraper;
}

