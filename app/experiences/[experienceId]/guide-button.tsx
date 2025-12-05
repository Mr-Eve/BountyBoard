"use client";

import { OnboardingGuideButton } from "@/app/components/onboarding-modal";

export function MemberGuideButton() {
	return (
		<OnboardingGuideButton 
			variant="member" 
			storageKey="bountyboard-member-onboarding" 
		/>
	);
}

