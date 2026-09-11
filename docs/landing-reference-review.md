# CREAI+IT landing: reference study and implementation

Reviewed in the browser on September 11, 2026. Reference: [Solfa Studio](https://teamsolfa.com/).

## The first impression

Solfa’s home is an immersive, almost-black composition built around a single viewport. The central sentence stays small and calm while tilted portfolio rectangles and circular channel portraits surround it. Their gentle movement gives the scene energy without making the headline compete with a large animation. Scrolling the observed desktop home did not reveal a conventional sequence of marketing sections.

The navigation is deliberately spare: a condensed studio wordmark and production descriptor on the left, four destinations on the right. White identifies the active destination; muted grey keeps the others available without equal visual weight. There is little conventional interface chrome. The studio’s actual work supplies most of the color and evidence.

The useful principle is an immediate relationship between identity and proof. Solfa can let recognizable work do the explaining. CREAI+IT needs to explain an unfamiliar learning experience, so its landing needs a short narrative beneath the opening rather than relying entirely on floating pictures.

## The bottom-right character, interaction by interaction

The small glossy black character has bright eyes and tiny legs. It remains present across the home, work, and contact pages. Clicking it opens a compact light speech bubble beside the character, with a small SOLFA label and a close control. The bubble contrasts strongly with the dark page while leaving the main content visible.

The observed opening briefly displays typing dots, then a casual greeting. Five preset questions give visitors a way to start without composing a message. Selecting one replaces the response and removes that question from the remaining choices. No free-text input or human handoff appeared in the inspected flow.

| Question category | Observed answer and destination | Experience provided |
| --- | --- | --- |
| What the studio does | Explains video production, owned channels, and work for brands | Introduces the business in conversational language |
| Audience reach | Presents an aggregate view-count claim with a comparison and typographic emphasis | Adds compact proof for visitors evaluating scale |
| See the work | Provides a direct link to the work page | Turns curiosity into a concrete next action |
| Rental studio | Explains the separate studio offering and links to its external website | Helps visitors distinguish two different services |
| Contact | Supplies the production inquiry email | Answers a practical question without a page search |

Its personality comes from the face, small format, and conversational asides. The strongest UX contribution is recognition: visitors choose a relevant question instead of deciding what to type. This is a guided FAQ experience in the observed interface; the browser behavior alone does not establish an AI backend or live operator.

## Work and contact pages

The [work page](https://teamsolfa.com/work) keeps the dark visual language, with faint atmospheric lighting behind the content. A left category rail distinguishes original, brand, and planning work and shows category counts. Within the main area, pill-shaped channel filters combine small icons with labels. Selection changes the displayed work and gives the active pill a clearer fill.

Large, rounded thumbnails dominate the three-column grid. Opening a thumbnail produces a large dark video overlay with a close button and an embedded player. I tested filtering, opening, and closing; the embedded player initially appeared blank/loading, so actual playback was not verified. The character remained visible above the overlay, a layering choice that can compete with the primary task.

The [contact page](https://teamsolfa.com/contact) is especially restrained: two centered inquiry paths, separated by a thin vertical rule, with an email link for production and an external recruitment destination. It removes the portfolio browsing effort at the moment the visitor wants to act. No message was sent and external recruitment/rental journeys were not followed.

Reference observations cover its desktop interface. A narrow viewport override did not apply to the reference tab, so its mobile behavior is not claimed as verified.

## What this becomes for CREAI+IT

The opening uses midnight navy, oversized Korean typography, and blue-to-cyan accents drawn from the existing CREAI+IT logo. The original symbol appears in the header, hero, and footer. Floating notes and conversation cards suggest the things people actually do in the study; the custom SVG illustrations and guide character use the same cool palette. The logo file is copied unchanged from `ai-spark-instagram-ads/brand-assets/creaiit-symbol.png` in the parent workspace; its transparent padding is handled with CSS in the navigation. The design borrows no Solfa artwork.

The central promise is “AI, 이제 나의 방식으로.” The explanation immediately connects that promise to shared learning, trying things, discussing obstacles, and developing judgment. The page then answers the questions a new visitor needs resolved:

1. **Why this study?** Good AI use begins with deciding the desired result and what to verify.
2. **What will I do?** Three working tabs follow a question through individual exploration, discussion, and a reusable record.
3. **What stays afterward?** A readable report example shows discoveries, proposals, next actions, and expandable supporting dialogue. It is explicitly an example, not a public member record.
4. **How is it organized?** Six people, four meetings, two hours, with the agreed 0기 schedule, location, and total fee. Future recruitment is described as forthcoming; existing members can enter their study.

The guide answers four study-specific questions and links to the relevant section or member entry. It is a local, deterministic interface with immediate answers, not a simulated live conversation. Its close button, Escape handling, focus return, and announced answer updates make it usable beyond pointer input.

The study tabs also support arrow keys, Home, and End. Motion respects reduced-motion preferences. The public landing and SVG assets are accessible without authentication; existing study interfaces remain under `/routes` with their access controls.

## Validation

- Production build completed successfully; all 49 existing tests passed.
- All four SVGs parsed successfully and returned HTTP 200 anonymously with SVG content types.
- Browser checks covered all four guide answers, navigation to the report section, closing and Escape focus return, tab selection and keyboard movement, and opening report evidence.
- At a 390 × 844 viewport, document width remained 390 and the open guide stayed inside the viewport. Desktop layout was also checked at 1440 × 900, and the page was visually reviewed in the actual local preview panel.
- `git diff --check` passed. No deployment or Git push was performed for this landing change.
