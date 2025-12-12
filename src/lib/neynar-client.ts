import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
    console.warn("NEYNAR_API_KEY is not set. Neynar features will be disabled or fail.");
}

const config = new Configuration({
    apiKey: process.env.NEYNAR_API_KEY || "temp-key", // Prevent build crash
});

export const neynarClient = new NeynarAPIClient(config);
