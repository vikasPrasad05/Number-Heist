import type { NextRequest } from 'next/server';
import * as Ably from 'ably';

export async function GET(req: NextRequest) {
    if (!process.env.ABLY_API_KEY) {
        return new Response('Missing ABLY_API_KEY', { status: 500 });
    }

    const client = new Ably.Rest(process.env.ABLY_API_KEY);
    const tokenParams = {
        clientId: req.nextUrl.searchParams.get('clientId') || 'anonymous',
    };

    try {
        const tokenRequestData = await client.auth.createTokenRequest(tokenParams);
        return Response.json(tokenRequestData);
    } catch (err) {
        return new Response(JSON.stringify(err), { status: 500 });
    }
}
