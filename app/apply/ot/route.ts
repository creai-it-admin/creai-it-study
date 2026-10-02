import { DECK_CSP, downloadMedia } from '@/lib/storage';

// Publish only the reviewed Foundation OT v2 requested for the application page.
// Later admin uploads remain private until explicitly selected for publication.
const PUBLIC_OT_PATH = 'library/211cc024-1c22-4e1d-9c55-a9bd55f662a1/decks/72c9bb61-3c03-4639-bc21-85170084fbdf.html';

export async function GET() {
  try {
    const html = await downloadMedia(PUBLIC_OT_PATH);
    return new Response(html.stream(), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': DECK_CSP,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch {
    return new Response('OT 자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
