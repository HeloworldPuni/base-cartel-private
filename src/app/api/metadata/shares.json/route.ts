import { NextResponse } from 'next/server';

export async function GET() {
    const metadata = {
        name: "Base Cartel Shares",
        description: "Official membership shares of the Base Cartel. Hold to earn yield from raids and participate in governance.",
        image: "https://www.basecartel.in/icon.png",
        external_url: "https://www.basecartel.in",
        properties: {
            type: "Membership",
            access: "DAO"
        },
        attributes: [
            {
                trait_type: "Type",
                value: "Membership"
            },
            {
                trait_type: "Utility",
                value: "Yield Bearing"
            }
        ]
    };

    return NextResponse.json(metadata);
}
