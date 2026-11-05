import { createContactHandler } from '../../../lib/contact';

export const runtime = 'nodejs';

export const POST = createContactHandler({
    requireSharedLimiter: process.env.NODE_ENV === 'production',
    trustProxy: process.env.VERCEL === '1',
    redisUrl: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,
    redisToken: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN,
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.CONTACT_FROM_EMAIL,
    to: process.env.CONTACT_TO_EMAIL,
});
