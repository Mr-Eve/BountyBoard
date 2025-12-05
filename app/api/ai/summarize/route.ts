import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
	try {
		const { businessName, businessCategory, serviceQuery, description, reviews } = await request.json();

		if (!businessName || !serviceQuery) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const prompt = `You are a business consultant helping freelancers identify opportunities. 

A freelancer is searching for "${serviceQuery}" services they can offer.

Here's a potential client:
- Business Name: ${businessName}
- Business Type: ${businessCategory || "Unknown"}
${description ? `- Description: ${description}` : ""}
${reviews ? `- Customer Reviews Summary: ${reviews}` : ""}

Write a 2-3 sentence pitch explaining SPECIFICALLY how this business could benefit from ${serviceQuery} services. Be concrete and actionable - mention specific things they could implement and the expected business impact. Don't be generic.

Examples of good specificity:
- "Their menu photos look amateur - professional food photography could increase online orders by 30%"
- "They have no online booking - customers calling during busy hours are likely hanging up and going elsewhere"
- "Their website doesn't show up for 'dentist near me' searches - local SEO could bring 50+ new patients monthly"

Keep it concise and compelling. This is an outreach opportunity for the freelancer.`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 200,
			temperature: 0.7,
		});

		const summary = completion.choices[0]?.message?.content || "Unable to generate summary.";

		return NextResponse.json({ summary });
	} catch (error) {
		console.error("AI summarize error:", error);
		return NextResponse.json(
			{ error: "Failed to generate summary" },
			{ status: 500 }
		);
	}
}

