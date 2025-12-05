"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface OnboardingStep {
	title: string;
	description: string;
	icon: React.ReactNode;
	highlight?: string;
}

const ADMIN_STEPS: OnboardingStep[] = [
	{
		title: "Welcome to Bounty Board",
		description:
			"Your command center for curating freelance opportunities for your community. Let's walk through the key features.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
				<span className="text-3xl">🎯</span>
			</div>
		),
	},
	{
		title: "Search for Gigs",
		description:
			"Use the search bar to find freelance opportunities across multiple platforms like Upwork, Freelancer, and more. Filter by location and toggle different sources on or off.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
				<span className="text-3xl">🔍</span>
			</div>
		),
		highlight: "Find Gigs tab",
	},
	{
		title: "AI Curated Opportunities",
		description:
			"Enable \"AI Curated\" in the search to discover unique service opportunities. Our AI analyzes local businesses and suggests how your community members could help them based on their reviews and needs.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-xl shadow-pink-500/30">
				<span className="text-3xl">✦</span>
			</div>
		),
		highlight: "AI Curated toggle",
	},
	{
		title: "Save & Add to Board",
		description:
			"Found a great gig? Click \"Save\" to review it later, or \"Add to Board\" to immediately share it with your community. Saved gigs appear in the Saved tab.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
				<span className="text-3xl">📌</span>
			</div>
		),
		highlight: "Save & Add buttons",
	},
	{
		title: "Manage Your Board",
		description:
			"The Board tab shows all approved gigs visible to your members. Pin important gigs to keep them at the top, or remove outdated ones. Your members will see exactly what you curate.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
				<span className="text-3xl">📋</span>
			</div>
		),
		highlight: "Board tab",
	},
	{
		title: "You're All Set!",
		description:
			"Start searching for opportunities and build a curated board that helps your community members find their next gig. You can always access this guide from the help button.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
				<span className="text-3xl">🚀</span>
			</div>
		),
	},
];

const MEMBER_STEPS: OnboardingStep[] = [
	{
		title: "Welcome to Bounty Board",
		description:
			"Your community leaders have curated freelance opportunities just for you. Let's show you how to make the most of it.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
				<span className="text-3xl">🎯</span>
			</div>
		),
	},
	{
		title: "Browse Curated Gigs",
		description:
			"All the opportunities you see have been hand-picked by your community leaders. Each gig includes details about the project, required skills, and budget.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
				<span className="text-3xl">📋</span>
			</div>
		),
	},
	{
		title: "AI Curated Opportunities",
		description:
			"Gigs marked with ✦ AI Curated are special opportunities discovered by AI. These analyze local businesses and explain exactly how you could help them with your skills.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-xl shadow-pink-500/30">
				<span className="text-3xl">✦</span>
			</div>
		),
		highlight: "Pink summary boxes",
	},
	{
		title: "Pinned Gigs",
		description:
			"Look for gigs with a gold \"Pinned\" tag - these are highlighted by your community leaders as particularly good opportunities worth checking out first.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
				<span className="text-3xl">📌</span>
			</div>
		),
		highlight: "Pinned tag",
	},
	{
		title: "Search & Filter",
		description:
			"Use the search bar to find specific gigs by title, skills, location, or keywords. It searches through all the curated opportunities instantly.",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
				<span className="text-3xl">🔍</span>
			</div>
		),
		highlight: "Search bar",
	},
	{
		title: "Apply for Gigs",
		description:
			"Found something interesting? Click \"Apply Now\" to go directly to the original posting and submit your application. Good luck!",
		icon: (
			<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
				<span className="text-3xl">🚀</span>
			</div>
		),
	},
];

interface OnboardingModalProps {
	variant: "admin" | "member";
	storageKey: string;
}

export function OnboardingModal({ variant, storageKey }: OnboardingModalProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);

	const steps = variant === "admin" ? ADMIN_STEPS : MEMBER_STEPS;

	useEffect(() => {
		// Check if user has seen onboarding
		const hasSeenOnboarding = localStorage.getItem(storageKey);
		if (!hasSeenOnboarding) {
			setIsOpen(true);
		}
	}, [storageKey]);

	const handleClose = () => {
		localStorage.setItem(storageKey, "true");
		setIsOpen(false);
		setCurrentStep(0);
	};

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			handleClose();
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleSkip = () => {
		handleClose();
	};

	if (!isOpen) return null;

	const step = steps[currentStep];
	const isLastStep = currentStep === steps.length - 1;
	const isFirstStep = currentStep === 0;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-sm"
				onClick={handleSkip}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg bg-[#111113] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
				{/* Progress bar */}
				<div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
					<div
						className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
						style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
					/>
				</div>

				{/* Content */}
				<div className="p-8 pt-10">
					{/* Step indicator */}
					<div className="flex items-center justify-center gap-2 mb-6">
						{steps.map((_, index) => (
							<button
								key={index}
								onClick={() => setCurrentStep(index)}
								className={`w-2 h-2 rounded-full transition-all ${
									index === currentStep
										? "w-6 bg-amber-400"
										: index < currentStep
											? "bg-amber-400/50"
											: "bg-white/20"
								}`}
							/>
						))}
					</div>

					{/* Icon */}
					<div className="flex justify-center mb-6">{step.icon}</div>

					{/* Title */}
					<h2 className="text-2xl font-bold text-white text-center mb-3">
						{step.title}
					</h2>

					{/* Description */}
					<p className="text-white/60 text-center leading-relaxed mb-2">
						{step.description}
					</p>

					{/* Highlight hint */}
					{step.highlight && (
						<p className="text-amber-400/80 text-sm text-center">
							💡 Look for: {step.highlight}
						</p>
					)}
				</div>

				{/* Footer */}
				<div className="px-8 pb-8 flex items-center justify-between">
					<button
						onClick={handleSkip}
						className="px-4 py-2 text-white/50 hover:text-white/70 text-sm transition-colors"
					>
						Skip tour
					</button>

					<div className="flex items-center gap-3">
						{!isFirstStep && (
							<button
								onClick={handlePrev}
								className="px-5 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all"
							>
								Back
							</button>
						)}
						<button
							onClick={handleNext}
							className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-xl text-sm font-medium hover:from-amber-300 hover:to-orange-400 transition-all"
						>
							{isLastStep ? "Get Started" : "Next"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

// Help button component to re-open onboarding
export function OnboardingHelpButton({
	variant,
	storageKey,
}: OnboardingModalProps) {
	const [showModal, setShowModal] = useState(false);

	const handleOpen = () => {
		localStorage.removeItem(storageKey);
		setShowModal(true);
	};

	return (
		<>
			<button
				onClick={handleOpen}
				className="fixed bottom-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all shadow-lg z-40"
				title="Show guide"
			>
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</button>
			{showModal && (
				<OnboardingModalWrapper
					variant={variant}
					storageKey={storageKey}
					onClose={() => setShowModal(false)}
				/>
			)}
		</>
	);
}

// Wrapper for manually triggered modal
function OnboardingModalWrapper({
	variant,
	storageKey,
	onClose,
}: OnboardingModalProps & { onClose: () => void }) {
	const [currentStep, setCurrentStep] = useState(0);

	const steps = variant === "admin" ? ADMIN_STEPS : MEMBER_STEPS;

	const handleClose = () => {
		localStorage.setItem(storageKey, "true");
		setCurrentStep(0);
		onClose();
	};

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			handleClose();
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const step = steps[currentStep];
	const isLastStep = currentStep === steps.length - 1;
	const isFirstStep = currentStep === 0;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/80 backdrop-blur-sm"
				onClick={handleClose}
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg bg-[#111113] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
				{/* Progress bar */}
				<div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
					<div
						className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
						style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
					/>
				</div>

				{/* Content */}
				<div className="p-8 pt-10">
					{/* Step indicator */}
					<div className="flex items-center justify-center gap-2 mb-6">
						{steps.map((_, index) => (
							<button
								key={index}
								onClick={() => setCurrentStep(index)}
								className={`w-2 h-2 rounded-full transition-all ${
									index === currentStep
										? "w-6 bg-amber-400"
										: index < currentStep
											? "bg-amber-400/50"
											: "bg-white/20"
								}`}
							/>
						))}
					</div>

					{/* Icon */}
					<div className="flex justify-center mb-6">{step.icon}</div>

					{/* Title */}
					<h2 className="text-2xl font-bold text-white text-center mb-3">
						{step.title}
					</h2>

					{/* Description */}
					<p className="text-white/60 text-center leading-relaxed mb-2">
						{step.description}
					</p>

					{/* Highlight hint */}
					{step.highlight && (
						<p className="text-amber-400/80 text-sm text-center">
							💡 Look for: {step.highlight}
						</p>
					)}
				</div>

				{/* Footer */}
				<div className="px-8 pb-8 flex items-center justify-between">
					<button
						onClick={handleClose}
						className="px-4 py-2 text-white/50 hover:text-white/70 text-sm transition-colors"
					>
						Close
					</button>

					<div className="flex items-center gap-3">
						{!isFirstStep && (
							<button
								onClick={handlePrev}
								className="px-5 py-2.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all"
							>
								Back
							</button>
						)}
						<button
							onClick={handleNext}
							className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-xl text-sm font-medium hover:from-amber-300 hover:to-orange-400 transition-all"
						>
							{isLastStep ? "Done" : "Next"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

