# Waymark M2: open issues

The slides follow the prototype video for now. This list covers what still conflicts, what is unconfirmed, and what was filled in without team input. Page numbers refer to `slides.pdf` (39 pages): pages 1–9 are the team's `front.typ`, and pages 10–39 are sections 3–5. The prototype screens on pages 15–32 are Discord and web-app designs exported from the Design canvas (`assets/screens/ui/`).

## 1. Design decisions that differ from the video

| # | Topic | Video / prototype shows | Discussed instead | Slides now | To decide |
|---|---|---|---|---|---|
| 1 | Who sets the read scope | Mia picks "From now on" or "Include earlier messages" when she invites Waymark | The whole group agrees on a scope when Waymark joins | Video version (p. 12, 17–18, 31, 38) | Keep one-person choice, or switch to group agreement and update section 3 and the prototype |
| 2 | When Waymark replies | Once active, it answers change requests without an @mention (Mia's "Start day 3 at 11:00…") and replies to most messages Mia sends | Silent collection; replies and pop-up options only when someone @mentions it | "Silent except link cards; replies when invited or asked for a change" (p. 16, 28, 34, 37) | Decided: collection stays silent, and parsing a shared link into a card is the one exception. The video still differs |
| 3 | "Seen" mark for silent collection | Not shown | A read mark, similar to Instagram's, while Waymark collects | Not on slides | Discord bots cannot show a read mark. Show a "collecting" status in the app, or skip it |
| 4 | Platform | Narration: "not yet connected to LINE" | Feedback: a bot in LINE or Discord, not a standalone app | p. 3 says "Discord or LINE"; p. 15–32 and 35–36 show and explain Discord; p. 36 and 38 mention LINE as a later platform | Decided: both are named, the demo and the technical details use Discord |
| 5 | Looks like a standalone app | The prototype has its own branded sidebar ("My groups", "My account") | Waymark is a bot inside an existing group chat | Slides show a Discord channel and the web app (p. 15–32); the last page links to the design | Done. The old standalone prototype link was replaced |
| 6 | Optional subgroups | Not in the video or the prototype | p. 8: preferences split members into a museum group and a food group, who meet for dinner | Sections 4–5 do not mention it | Keep it as a future feature (add to "Later" on p. 38), or drop p. 8. Splitting and merging a day is now shown on p. 26 |

## 2. Gaps between sections 1–2 and the rest

- **The product name.** The cover says "Travel Planning in Group Chats", and pages 1–9 call it "the AI assistant". "Waymark" now appears as the bot in the cover illustration and in the section 3 flow diagram on p. 11. Name it in section 2 as well.
- **Target users** (required in section 1) are not stated on a slide. The notes say the M1 interviews were with six students and young adults. Say it aloud, or add a line to p. 3 or 4.
- **PoC focus** (required in section 2) is left out (the comment in `front.typ` says "PoC is omitted"). Say it at the section 3 divider (p. 10): one Osaka scenario, a clickable prototype, sample logic in place of the AI.
- **Example trip.** Sections 1–2 now use the same Osaka trip and the same four people (Mia, Alex, Ben, Yuki) as section 3. If the Tokyo illustration is preferred, revert `visuals.typ` and `front.typ`.
- **The explicit invitation.** Sections 1–2 never mention it: p. 7 says "AI captures chat context", and p. 9 shows the AI proposing after a new message. Section 3 starts with an explicit @Waymark invitation and a scope choice. The p. 10 teaser ("From an explicit invitation…") bridges the two; mention it when speaking.

## 3. Technical problems the design must solve

- **LINE cannot read old messages.** A LINE bot only receives messages sent after it joins the group, so "Include earlier messages" cannot work there. Options: ask a member to upload LINE's chat export, or drop the option. Listed as a platform limit on p. 38. Discord bots can read history with permission.
- **Instagram reels.** Link previews often give only a title and thumbnail. Audio transcription (Whisper) needs the video file itself, so a member may have to upload the video or a screen recording.
- **Prototype UI that a chat bot cannot show directly.**
  - Scope choice, Apply / Keep original and Confirm become buttons on Waymark's message (LINE Quick Reply or Flex buttons; Discord buttons).
  - Clarify and preference forms, the itinerary panel with reordering, and the calendar download move to a web page opened from the chat (LINE LIFF; Discord pop-up forms or a link).
  - "Bot menu → Save and finish": LINE's rich menu does not appear in group chats (verify), so use a button on Waymark's message or a typed command.
- **LINE vs Discord.** Discord bots can read a channel's earlier messages (with permission), so "Include earlier messages" works there; LINE bots cannot. LINE may fit the target users better, so it stays on the "Later" list.
- **Confirmation rules.** "1 of 4 confirmed" is shown, but nothing says what group agreement means. Must all members confirm? What happens when the plan is saved with confirmations still pending?
- **Prototype text glitches (visible in screenshots).** Apostrophes render with a gap ("Let’ s"), and afternoon times are cut off in the time fields ("04:00 F"). Fix in the prototype if there is time.

## 4. Content to confirm or fill in

- **Submission file name** needs the group number: `GROUP_N_MILESTONE_2.pdf`.
- **Models (p. 36):** Claude Haiku 5.5 for silent reading, Claude Opus 5.5 for drafting and revising. If the $100 credits are tied to another provider, swap these two rows.
- **Cost estimate (p. 36):** "about $2 per trip" assumes 300 messages, 20 screenshots, 10 reels, 3 drafts and 10 revisions, at list prices without caching.
- **Next steps (p. 38):** "about 20 consented group chats" and "3–5 friend groups" are placeholder numbers.
- **Recommendations** (suggesting places nobody mentioned) are listed as "Later" (p. 38). Confirm this is a to-do, not part of the PoC.

## 5. Presentation risks

- **Language.** The video's narration and subtitles are in Chinese, and the presentation must be in English. Narrate it live in English, or re-record it.
- **Time.** Sections 1–2 take 9 pages for about 3 minutes. Section 3 has 4 flow slides plus 19 detail slides for about 5 minutes; if the video is played, show the detail slides only as backup. The whole talk must stay under 12 minutes (5% penalty past 13.5).

## 6. Files regenerated here (replace them if the originals turn up)

- `assets/screens/ui/*.png`: Discord and web-app screens exported from the Design canvas (27 Oct). They replace the old `assets/screens/*.jpg` screenshots of the standalone prototype, which the slides no longer use.
- `assets/user-flow-en-*.svg`: the user flow redrawn in English from the original flow image. The labels are a translation of a low-resolution image, so check them against the original Chinese flow.
- `assets/icons/`: from `assets.zip`.
- `front.typ`: the team's original. It runs its own `#show: setup` and `#set document`, which still compiles inside `slides.typ`.
- `fonts/`: static Fraunces, Newsreader and IBM Plex Mono. The Fraunces files were renamed internally to "Fraunces" so they match `theme.typ` (allowed by the font license). Build with:

```sh
typst compile --font-path fonts slides.typ slides.pdf
```
