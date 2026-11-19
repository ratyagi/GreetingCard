# Digital Christmas Card — PRD

## Original Problem
A single animated digital Christmas card for the user's sister: a tiny typewriter zooms ~10%, a
flower sways then turns into the user's card graphic, the card opens, and the message types out.
Refresh to replay. Smooth transitions, modern UI/UX.

## Stack
Front-end only. React 19 + framer-motion 11 + Tailwind. No backend / no DB / no integrations used.

## Assets (user-provided)
- /app/frontend/src/assets/typewriter_art.png — typewriter-with-flowers artwork (opening scene)
- /app/frontend/src/assets/couple_art.jpg — couple-on-sofa illustration (the card graphic / cover)
  NOTE: source files arrived name-swapped; corrected on disk.

## Experience (ChristmasCard.jsx choreography)
1. Tiny typewriter fades in
2. Zooms ~10%
3. A flower sways with a warm glow
4. Crossfades/scales into the closed card (couple graphic as cover: "For You / Merry Christmas / open me")
5. Card rests a beat, then opens (left-hinge rotateY)
6. Message types out letter-by-letter (Special Elite), blinking caret
7. "Watch it again" replay button + "refresh" hint

## Palette & Type
Cream off-white bg, holly-red + white accents, soft red/white falling snow.
Playfair Display (headings), Cormorant Garamond (accents), Special Elite (typed letter).

## Message (editable in ChristmasCard.jsx: GREETING / BODY / SIGNOFF)
Dear Dr. Tyagi, / Merriest Christmas to my Goollak... fuck you <3 / with love, the smarter Tyagi sister

## Implemented (2026-11-19)
- v1: auto-play typewriter→card sequence (replaced).
- v2 (current) — click-driven, New Yorker Christmas theme:
  - Stamped kraft ENVELOPE (typewriter art as perforated postage stamp, wax seal w/ snowflake,
    "to my dearest sister" handwriting, "THE NEW YORKER · HOLIDAY ISSUE" label). Tap to open.
  - Flap opens, folded landscape card slides out.
  - FOLDED CARD = New Yorker "cover": couple cartoon + "The New Yorker" masthead + dateline +
    the illustration's own italic caption. Card only opens on user action ("lift the card open").
  - Opens BOTTOM-TO-UP (top-hinged flap lifts). Inside-top shows "Season's Greetings" motif;
    lower panel is an editorial spread (masthead dateline, rules, "Merry Christmas" heading,
    the typewriter message typing out letter-by-letter, folio).
  - "Seal it up again" replay + refresh. Soft red/white snow on cream throughout.
- Fonts: Playfair Display (masthead/Irvin-style), EB Garamond (captions/small-caps),
  Special Elite (typewriter letter), Cormorant Garamond (handwriting).
- Verified via screenshots: envelope, folded cover, opened spread, replay.

## Backlog
- P1: In-app message editor (currently edited in code constants)
- P2: Optional typewriter "ding" sound on open; shareable link/personalization
