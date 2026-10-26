import { createContactHandler } from '../../../lib/contact';

export const runtime = 'nodejs';

export const POST = createContactHandler({
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.CONTACT_FROM_EMAIL,
    to: process.env.CONTACT_TO_EMAIL,
});
