"use client";

import { useState, useEffect, useCallback } from "react";

interface OnboardingStep {
	title: string;
	description: string;
	targetSelector?: string; // CSS selector for element to highlight
	position?: "top" | "bottom" | "left" | "right" | "center";
	action?: () => void; // Action to perform when entering this step
}

// Actions that can be performed during onboarding
const openAdvancedSearch = () => {
	const advancedBtn = document.querySelector("[data-onboarding='advanced-search']") as HTMLButtonElement;
	const advancedPanel = document.querySelector("[data-onboarding='advanced-panel']");
	
	// Only click if the panel isn't already open
	if (advancedBtn && !advancedPanel) {
		advancedBtn.click();
	}
};

const closeAdvancedSearch = () => {
	const advancedBtn = document.querySelector("[data-onboarding='advanced-search']") as HTMLButtonElement;
	const advancedPanel = document.querySelector("[data-onboarding='advanced-panel']");
	
	// Only click if the panel is open
	if (advancedBtn && advancedPanel) {
		advancedBtn.click();
	}
};

const ADMIN_STEPS: OnboardingStep[] = [
	{
		title: "Welcome to Bounty Board",
		description:
			"Your command center for curating freelance opportunities for your community. Let's walk through the key features.",
		position: "center",
		action: closeAdvancedSearch, // Ensure advanced search is closed at start
	},
	{
		title: "Search for Gigs",
		description:
			"Type a service or skill (like 'web design' or 'SEO') and hit Search to find opportunities across multiple freelance platforms.",
		targetSelector: "[data-onboarding='search-input']",
		position: "bottom",
	},
	{
		title: "Advanced Search Options",
		description:
			"Click here to access location filters and toggle different job sources. Let's open it to see what's inside.",
		targetSelector: "[data-onboarding='advanced-search']",
		position: "bottom",
	},
	{
		title: "AI Curated Results",
		description:
			"This is the magic! When enabled, AI Curated searches for local businesses in your area and uses AI to explain exactly how your community's services could help them. These are outreach opportunities, not job postings.",
		targetSelector: "[data-onboarding='ai-curated-toggle']",
		position: "bottom",
		action: openAdvancedSearch, // Open advanced search to show the toggle
	},
	{
		title: "Job Sources",
		description:
			"Toggle these to search different freelance platforms like RemoteOK, Arbeitnow, and Himalayas. Mix and match to find the best opportunities.",
		targetSelector: "[data-onboarding='source-toggles']",
		position: "bottom",
	},
	{
		title: "Find Gigs Tab",
		description:
			"This is where you search for new opportunities. Results from various platforms will appear here after searching.",
		targetSelector: "[data-onboarding='tab-find']",
		position: "bottom",
		action: closeAdvancedSearch, // Close advanced search for cleaner view
	},
	{
		title: "Board Tab",
		description:
			"Approved gigs appear here and are visible to your community members. This is what your members will see.",
		targetSelector: "[data-onboarding='tab-board']",
		position: "bottom",
	},
	{
		title: "Saved Tab",
		description:
			"Gigs you save for later go here. Review them when you're ready and add the best ones to your Board.",
		targetSelector: "[data-onboarding='tab-saved']",
		position: "bottom",
	},
	{
		title: "You're Ready",
		description:
			"Start by searching for a service your community offers. Click the 'Guide' button in the header anytime to see this guide again.",
		position: "center",
	},
];

const MEMBER_STEPS: OnboardingStep[] = [
	{
		title: "Welcome to Bounty Board",
		description:
			"Your community leaders have curated freelance opportunities just for you. Let's show you how to find your next gig.",
		position: "center",
	},
	{
		title: "Search Curated Gigs",
		description:
			"Use this search bar to filter through all the curated opportunities. Search by title, skills, location, or keywords.",
		targetSelector: "[data-onboarding='member-search']",
		position: "bottom",
	},
	{
		title: "Gig Cards",
		description:
			"Each card shows a curated opportunity with details about the project, required skills, and budget. Look for the source tag to see where it came from.",
		targetSelector: "[data-onboarding='gig-card']",
		position: "top",
	},
	{
		title: "AI Curated Opportunities",
		description:
			"Gigs with the AI Curated tag are special! These are local businesses that could use your services. The pink box explains exactly how you can help them.",
		targetSelector: "[data-onboarding='ai-curated']",
		position: "top",
	},
	{
		title: "Apply for Gigs",
		description:
			"Found something interesting? Click 'Apply Now' to go directly to the original posting and submit your application. Good luck!",
		targetSelector: "[data-onboarding='apply-button']",
		position: "top",
	},
];

interface OnboardingProps {
	variant: "admin" | "member";
	storageKey: string;
}

export function OnboardingModal({ variant, storageKey }: OnboardingProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

	const steps = variant === "admin" ? ADMIN_STEPS : MEMBER_STEPS;
	const step = steps[currentStep];

	// Show onboarding only on first visit
	useEffect(() => {
		const hasSeenOnboarding = localStorage.getItem(storageKey);
		if (!hasSeenOnboarding) {
			setIsOpen(true);
			setCurrentStep(0);
		}
	}, [storageKey]);

	// Execute action when step changes
	useEffect(() => {
		if (isOpen && step.action) {
			// Small delay to ensure DOM is ready
			const timer = setTimeout(() => {
				step.action?.();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [isOpen, currentStep, step]);

	// Find and track target element
	useEffect(() => {
		if (!isOpen || !step.targetSelector) {
			setTargetRect(null);
			return;
		}

		const updateTargetRect = () => {
			const target = document.querySelector(step.targetSelector!);
			if (target) {
				setTargetRect(target.getBoundingClientRect());
			} else {
				setTargetRect(null);
			}
		};

		// Delay to allow for DOM updates after actions
		const timer = setTimeout(updateTargetRect, 150);
		
		window.addEventListener("resize", updateTargetRect);
		window.addEventListener("scroll", updateTargetRect);

		return () => {
			clearTimeout(timer);
			window.removeEventListener("resize", updateTargetRect);
			window.removeEventListener("scroll", updateTargetRect);
		};
	}, [isOpen, step.targetSelector, currentStep]);

	const handleClose = useCallback(() => {
		// Close advanced search if open when closing onboarding
		closeAdvancedSearch();
		localStorage.setItem(storageKey, "true");
		setIsOpen(false);
		setCurrentStep(0);
	}, [storageKey]);

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

	const handleStepClick = (index: number) => {
		setCurrentStep(index);
	};

	if (!isOpen) return null;

	const isLastStep = currentStep === steps.length - 1;
	const isFirstStep = currentStep === 0;
	const isCentered = step.position === "center" || !targetRect;

	// Calculate info box position based on target element
	const getInfoBoxStyle = (): React.CSSProperties => {
		if (isCentered) {
			return {
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
			};
		}

		const padding = 16;
		const boxWidth = 380;
		const boxHeight = 200; // approximate

		let top = 0;
		let left = 0;

		switch (step.position) {
			case "bottom":
				top = targetRect!.bottom + padding;
				left = targetRect!.left + targetRect!.width / 2 - boxWidth / 2;
				break;
			case "top":
				top = targetRect!.top - boxHeight - padding;
				left = targetRect!.left + targetRect!.width / 2 - boxWidth / 2;
				break;
			case "left":
				top = targetRect!.top + targetRect!.height / 2 - boxHeight / 2;
				left = targetRect!.left - boxWidth - padding;
				break;
			case "right":
				top = targetRect!.top + targetRect!.height / 2 - boxHeight / 2;
				left = targetRect!.right + padding;
				break;
		}

		// Keep within viewport
		left = Math.max(padding, Math.min(left, window.innerWidth - boxWidth - padding));
		top = Math.max(padding, Math.min(top, window.innerHeight - boxHeight - padding));

		return {
			position: "fixed",
			top: `${top}px`,
			left: `${left}px`,
		};
	};

	return (
		<div className="fixed inset-0 z-[100]">
			{/* Backdrop with spotlight cutout */}
			<svg className="absolute inset-0 w-full h-full">
				<defs>
					<mask id="spotlight-mask">
						<rect width="100%" height="100%" fill="white" />
						{targetRect && (
							<rect
								x={targetRect.left - 8}
								y={targetRect.top - 8}
								width={targetRect.width + 16}
								height={targetRect.height + 16}
								rx="12"
								fill="black"
							/>
						)}
					</mask>
				</defs>
				<rect
					width="100%"
					height="100%"
					fill="rgba(0, 0, 0, 0.85)"
					mask="url(#spotlight-mask)"
				/>
			</svg>

			{/* Spotlight border glow */}
			{targetRect && (
				<div
					className="absolute border-2 border-amber-400 rounded-xl pointer-events-none"
					style={{
						left: targetRect.left - 8,
						top: targetRect.top - 8,
						width: targetRect.width + 16,
						height: targetRect.height + 16,
						boxShadow: "0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)",
					}}
				/>
			)}

			{/* Info Box */}
			<div
				style={getInfoBoxStyle()}
				className="w-[380px] bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
			>
				{/* Progress bar */}
				<div className="h-1 bg-white/5">
					<div
						className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
						style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
					/>
				</div>

				{/* Content */}
				<div className="p-6">
					{/* Step indicator dots */}
					<div className="flex items-center justify-center gap-1.5 mb-4">
						{steps.map((_, index) => (
							<button
								key={index}
								onClick={() => handleStepClick(index)}
								className={`h-1.5 rounded-full transition-all ${
									index === currentStep
										? "w-6 bg-amber-400"
										: index < currentStep
											? "w-1.5 bg-amber-400/50"
											: "w-1.5 bg-white/20"
								}`}
							/>
						))}
					</div>

					{/* Title */}
					<h2 className="text-lg font-bold text-white mb-3">
						{step.title}
					</h2>

					{/* Description */}
					<p className="text-white/60 text-sm leading-relaxed mb-5">
						{step.description}
					</p>

					{/* Navigation */}
					<div className="flex items-center justify-between">
						<button
							onClick={handleClose}
							className="text-white/40 hover:text-white/60 text-sm transition-colors"
						>
							Skip tour
						</button>

						<div className="flex items-center gap-2">
							{!isFirstStep && (
								<button
									onClick={handlePrev}
									className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all"
								>
									Back
								</button>
							)}
							<button
								onClick={handleNext}
								className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all"
							>
								{isLastStep ? "Get Started" : "Next"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Header button component to re-open onboarding (for use in page headers)
export function OnboardingGuideButton({ variant, storageKey }: OnboardingProps) {
	const [showModal, setShowModal] = useState(false);

	return (
		<>
			<button
				onClick={() => setShowModal(true)}
				className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-all"
				title="Show guide"
			>
				<svg
					className="w-4 h-4"
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
				Guide
			</button>
			{showModal && (
				<OnboardingModalManual
					variant={variant}
					storageKey={storageKey}
					onClose={() => setShowModal(false)}
				/>
			)}
		</>
	);
}

// Manual trigger version
function OnboardingModalManual({
	variant,
	storageKey,
	onClose,
}: OnboardingProps & { onClose: () => void }) {
	const [currentStep, setCurrentStep] = useState(0);
	const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

	const steps = variant === "admin" ? ADMIN_STEPS : MEMBER_STEPS;
	const step = steps[currentStep];

	// Execute action when step changes
	useEffect(() => {
		if (step.action) {
			const timer = setTimeout(() => {
				step.action?.();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [currentStep, step]);

	// Find and track target element
	useEffect(() => {
		if (!step.targetSelector) {
			setTargetRect(null);
			return;
		}

		const updateTargetRect = () => {
			const target = document.querySelector(step.targetSelector!);
			if (target) {
				setTargetRect(target.getBoundingClientRect());
			} else {
				setTargetRect(null);
			}
		};

		const timer = setTimeout(updateTargetRect, 150);
		window.addEventListener("resize", updateTargetRect);
		window.addEventListener("scroll", updateTargetRect);

		return () => {
			clearTimeout(timer);
			window.removeEventListener("resize", updateTargetRect);
			window.removeEventListener("scroll", updateTargetRect);
		};
	}, [step.targetSelector, currentStep]);

	const handleClose = useCallback(() => {
		closeAdvancedSearch();
		localStorage.setItem(storageKey, "true");
		setCurrentStep(0);
		onClose();
	}, [storageKey, onClose]);

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

	const handleStepClick = (index: number) => {
		setCurrentStep(index);
	};

	const isLastStep = currentStep === steps.length - 1;
	const isFirstStep = currentStep === 0;
	const isCentered = step.position === "center" || !targetRect;

	const getInfoBoxStyle = (): React.CSSProperties => {
		if (isCentered) {
			return {
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
			};
		}

		const padding = 16;
		const boxWidth = 380;
		const boxHeight = 200;

		let top = 0;
		let left = 0;

		switch (step.position) {
			case "bottom":
				top = targetRect!.bottom + padding;
				left = targetRect!.left + targetRect!.width / 2 - boxWidth / 2;
				break;
			case "top":
				top = targetRect!.top - boxHeight - padding;
				left = targetRect!.left + targetRect!.width / 2 - boxWidth / 2;
				break;
			case "left":
				top = targetRect!.top + targetRect!.height / 2 - boxHeight / 2;
				left = targetRect!.left - boxWidth - padding;
				break;
			case "right":
				top = targetRect!.top + targetRect!.height / 2 - boxHeight / 2;
				left = targetRect!.right + padding;
				break;
		}

		left = Math.max(padding, Math.min(left, window.innerWidth - boxWidth - padding));
		top = Math.max(padding, Math.min(top, window.innerHeight - boxHeight - padding));

		return {
			position: "fixed",
			top: `${top}px`,
			left: `${left}px`,
		};
	};

	return (
		<div className="fixed inset-0 z-[100]">
			<svg className="absolute inset-0 w-full h-full">
				<defs>
					<mask id="spotlight-mask-manual">
						<rect width="100%" height="100%" fill="white" />
						{targetRect && (
							<rect
								x={targetRect.left - 8}
								y={targetRect.top - 8}
								width={targetRect.width + 16}
								height={targetRect.height + 16}
								rx="12"
								fill="black"
							/>
						)}
					</mask>
				</defs>
				<rect
					width="100%"
					height="100%"
					fill="rgba(0, 0, 0, 0.85)"
					mask="url(#spotlight-mask-manual)"
				/>
			</svg>

			{targetRect && (
				<div
					className="absolute border-2 border-amber-400 rounded-xl pointer-events-none"
					style={{
						left: targetRect.left - 8,
						top: targetRect.top - 8,
						width: targetRect.width + 16,
						height: targetRect.height + 16,
						boxShadow: "0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)",
					}}
				/>
			)}

			<div
				style={getInfoBoxStyle()}
				className="w-[380px] bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
			>
				<div className="h-1 bg-white/5">
					<div
						className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
						style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
					/>
				</div>

				<div className="p-6">
					<div className="flex items-center justify-center gap-1.5 mb-4">
						{steps.map((_, index) => (
							<button
								key={index}
								onClick={() => handleStepClick(index)}
								className={`h-1.5 rounded-full transition-all ${
									index === currentStep
										? "w-6 bg-amber-400"
										: index < currentStep
											? "w-1.5 bg-amber-400/50"
											: "w-1.5 bg-white/20"
								}`}
							/>
						))}
					</div>

					<h2 className="text-lg font-bold text-white mb-3">{step.title}</h2>

					<p className="text-white/60 text-sm leading-relaxed mb-5">
						{step.description}
					</p>

					<div className="flex items-center justify-between">
						<button
							onClick={handleClose}
							className="text-white/40 hover:text-white/60 text-sm transition-colors"
						>
							Close
						</button>

						<div className="flex items-center gap-2">
							{!isFirstStep && (
								<button
									onClick={handlePrev}
									className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all"
								>
									Back
								</button>
							)}
							<button
								onClick={handleNext}
								className="px-4 py-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-xl text-sm font-medium transition-all"
							>
								{isLastStep ? "Done" : "Next"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
