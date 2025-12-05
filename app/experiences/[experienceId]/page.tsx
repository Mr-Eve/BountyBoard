import { headers } from "next/headers";
import Image from "next/image";
import { whopsdk } from "@/lib/whop-sdk";
import { getApprovedGigs } from "@/lib/scrapers";
import { MemberBoard } from "./member-board";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	// Verify user is logged in
	const { userId } = await whopsdk.verifyUserToken(await headers());
	const [experience, user] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
	]);

	// Get the company ID from the experience
	const companyId =
		typeof experience.company === "string"
			? experience.company
			: experience.company.id;

	// Get approved gigs for members
	const gigs = await getApprovedGigs(companyId);

	const displayName = user.name || `@${user.username}`;

	return (
		<div className="min-h-screen bg-[#0a0a0b]">
			{/* Hero Header */}
			<header className="relative overflow-hidden border-b border-white/10">
				<div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent" />
				<div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

				<div className="relative max-w-6xl mx-auto px-6 py-12">
					<div className="flex items-center gap-4 mb-4">
						<Image
							src="/BountyBoardIcon.png"
							alt="Bounty Board"
							width={56}
							height={56}
							className="rounded-2xl shadow-xl shadow-amber-500/30"
						/>
						<div>
							<h1 className="text-3xl font-bold text-white">Bounty Board</h1>
							<p className="text-white/50">Welcome back, {displayName}</p>
						</div>
					</div>

					<p className="text-white/70 text-lg max-w-2xl mb-6">
						Hand-picked freelance opportunities curated just for this community.
						Find your next gig and start earning.
					</p>

					<div className="flex items-center gap-6">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
							<span className="text-white/70">
								<strong className="text-white">{gigs.length}</strong> curated
								opportunities
							</span>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto px-6 py-8">
				<MemberBoard gigs={gigs} />
			</main>
		</div>
	);
}
