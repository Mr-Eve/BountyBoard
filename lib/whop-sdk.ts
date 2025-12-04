import { Whop } from "@whop/sdk";

// Lazy initialization to allow builds without credentials
let _whopsdk: Whop | null = null;

function getWhopSdk(): Whop {
	if (_whopsdk) return _whopsdk;

	const apiKey = process.env.WHOP_API_KEY;
	const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;

	if (!apiKey || apiKey === "your_whop_api_key_here") {
		throw new Error(
			"Missing WHOP_API_KEY environment variable. Get your API key from https://whop.com/dashboard/developer/"
		);
	}

	if (!appId || appId === "app_xxxxxxxxxxxxxx") {
		throw new Error(
			"Missing NEXT_PUBLIC_WHOP_APP_ID environment variable. Get your App ID from https://whop.com/dashboard/developer/"
		);
	}

	_whopsdk = new Whop({
		appID: appId,
		apiKey: apiKey,
		webhookKey: btoa(process.env.WHOP_WEBHOOK_SECRET || ""),
	});

	return _whopsdk;
}

// Export a proxy that lazily initializes the SDK
export const whopsdk = new Proxy({} as Whop, {
	get(_, prop) {
		return getWhopSdk()[prop as keyof Whop];
	},
});
