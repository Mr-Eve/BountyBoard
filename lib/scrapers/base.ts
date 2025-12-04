// Base Scraper Interface

import type { GigSource, ScrapedGig, ScrapeResult } from "./types";

export interface Scraper {
	source: GigSource;
	search(query: string, options?: SearchOptions): Promise<ScrapeResult>;
}

export interface SearchOptions {
	limit?: number;
	minBudget?: number;
	maxBudget?: number;
	skills?: string[];
	language?: string; // e.g., "en", "de", "fr"
	location?: string; // For BountyBoard jobs - city/region to search
}

// Simple language detection based on character patterns
export function detectLanguage(text: string): string {
	// Check for common non-ASCII character patterns
	const germanPattern = /[äöüßÄÖÜ]|(\b(und|oder|für|mit|bei|auf|aus|nach|zur|zum|das|die|der|den|dem|ein|eine|einer|eines|ist|sind|wird|werden|hat|haben|kann|können|muss|müssen|soll|sollen|wenn|dass|weil|aber|auch|noch|schon|sehr|mehr|viel|alle|allem|allen|aller|alles)\b)/gi;
	const frenchPattern = /[àâçéèêëîïôùûüÿœæ]|(\b(et|ou|pour|avec|dans|sur|par|une|des|les|est|sont|être|avoir|faire|aller|voir|savoir|pouvoir|vouloir|devoir|falloir|comme|mais|donc|car|parce|que|qui|quoi|dont|où)\b)/gi;
	const spanishPattern = /[áéíóúñ¿¡]|(\b(y|o|para|con|en|por|una|unos|unas|los|las|del|al|es|son|ser|estar|tener|hacer|poder|decir|ir|ver|dar|saber|querer|llegar|pasar|deber|poner|parecer|quedar|creer|hablar|llevar|dejar|seguir|encontrar|llamar|venir|pensar|salir|volver|tomar|conocer|vivir|sentir|tratar|mirar|contar|empezar|esperar|buscar|existir|entrar|trabajar|escribir|perder|producir|ocurrir|entender|pedir|recibir|recordar|terminar|permitir|aparecer|conseguir|comenzar|servir|sacar|necesitar|mantener|resultar|leer|caer|cambiar|presentar|crear|abrir|considerar|oír|acabar|convertir|ganar|formar|traer|partir|morir|aceptar|realizar|suponer|comprender|lograr|explicar|preguntar|tocar|reconocer|estudiar|alcanzar|nacer|dirigir|correr|utilizar|pagar|ayudar|gustar|jugar|escuchar|cumplir|ofrecer|descubrir|levantar|intentar)\b)/gi;
	
	const germanMatches = (text.match(germanPattern) || []).length;
	const frenchMatches = (text.match(frenchPattern) || []).length;
	const spanishMatches = (text.match(spanishPattern) || []).length;
	
	// If significant non-English patterns found, return detected language
	const threshold = 3;
	if (germanMatches > threshold && germanMatches > frenchMatches && germanMatches > spanishMatches) return "de";
	if (frenchMatches > threshold && frenchMatches > germanMatches && frenchMatches > spanishMatches) return "fr";
	if (spanishMatches > threshold && spanishMatches > germanMatches && spanishMatches > frenchMatches) return "es";
	
	// Default to English
	return "en";
}

// Check if text is likely in the target language
export function isInLanguage(text: string, targetLang: string): boolean {
	const detectedLang = detectLanguage(text);
	
	// If target is English, accept English content
	if (targetLang === "en") {
		return detectedLang === "en";
	}
	
	// For other languages, accept that language or English (many jobs are posted in English)
	return detectedLang === targetLang || detectedLang === "en";
}

// Helper to generate unique IDs
export function generateGigId(source: GigSource, externalId: string): string {
	return `${source}_${externalId}`;
}

// Helper to format budget
export function formatBudget(budget?: ScrapedGig["budget"]): string {
	if (!budget) return "Budget not specified";
	
	const { min, max, type, currency } = budget;
	const symbol = currency === "USD" ? "$" : currency;
	
	if (type === "hourly") {
		if (min && max) return `${symbol}${min}-${symbol}${max}/hr`;
		if (min) return `${symbol}${min}+/hr`;
		if (max) return `Up to ${symbol}${max}/hr`;
	} else {
		if (min && max) return `${symbol}${min}-${symbol}${max}`;
		if (min) return `${symbol}${min}+`;
		if (max) return `Up to ${symbol}${max}`;
	}
	
	return "Budget not specified";
}

