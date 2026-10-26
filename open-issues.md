# Waymark M2: open issues

The slides follow the prototype video for now. This list covers what still conflicts, what is unconfirmed, and what was filled in without team input. Page numbers refer to `slides.pdf` (33 pages): pages 1–9 are the team's `front.typ`, and pages 10–33 are sections 3–5.

## 1. Design decisions that differ from the video

| # | Topic | Video / prototype shows | Discussed instead | Slides now | To decide |
|---|---|---|---|---|---|
| 1 | Who sets the read scope | Mia picks "From now on" or "Include earlier messages" when she invites Waymark | The whole group agrees on a scope when Waymark joins | Video version (p. 12, 16–17, 31, 32) | Keep one-person choice, or switch to group agreement and update section 3 and the prototype |
| 2 | When Waymark replies | Once active, it answers change requests without an @mention (Mia's "Start day 3 at 11:00…") and replies to most messages Mia sends | Silent collection; replies and pop-up options only when someone @mentions it | Video version: "when invited, or asked for a change" (p. 29, 31) | Pick one rule. If @mention only, change the prototype and the video |
| 3 | "Seen" mark for silent collection | Not shown | A read mark, similar to Instagram's, while Waymark collects | Not on slides | Check whether LINE lets a bot show a read mark in group chats. If not, show "collecting" status in the panel |
| 4 | Platform | Narration: "not yet connected to LINE" | Feedback: a bot in LINE or Discord, not a standalone app | p. 3 says "LINE or Discord"; p. 30, 32 say LINE bot + LIFF panel (a web page inside LINE) | Say "LINE" everywhere, or "LINE (Discord later)" |
| 5 | Looks like a standalone app | The prototype has its own branded sidebar ("My groups", "My account") | Waymark is a bot inside an existing group chat | Not stated on slides | Add one line, or say aloud at the demo: "The chat window stands in for a LINE group; Waymark is a bot inside it" |
| 6 | Optional subgroups | Not in the video or the prototype | p. 8: preferences split members into a museum group and a food group, who meet for dinner | Sections 4–5 do not mention it | Keep it as a future feature (add to "Later" on p. 32), or drop p. 8 |

## 2. Gaps between sections 1–2 and the rest

- **The product name.** The cover says "Travel Planning in Group Chats", and pages 1–9 call it "the AI assistant". "Waymark" first appears in section 3: in the flow diagram on p. 11, and in a slide title on p. 16. Name it on the cover or in section 2.
- **Target users** (required in section 1) are not stated on a slide. The notes say the M1 interviews were with six students and young adults. Say it aloud, or add a line to p. 3 or 4.
- **PoC focus** (required in section 2) is left out (the comment in `front.typ` says "PoC is omitted"). Say it at the section 3 divider (p. 10): one Osaka scenario, a clickable prototype, sample logic in place of the AI.
- **Different example trips.** Sections 1–2 use Tokyo with Maya, Nina, Leo and Owen. The video and section 3 use Osaka with Mia, Alex, Ben and Yuki. This is fine if introduced as two illustrations; otherwise it may confuse the external reviewer.
- **The explicit invitation.** Sections 1–2 never mention it: p. 7 says "AI captures chat context", and p. 9 shows the AI proposing after a new message. Section 3 starts with an explicit @Waymark invitation and a scope choice. The p. 10 teaser ("From an explicit invitation…") bridges the two; mention it when speaking.

## 3. Technical problems the design must solve

- **LINE cannot read old messages.** A LINE bot only receives messages sent after it joins the group, so "Include earlier messages" cannot work as shown. Options: ask a member to upload LINE's chat export, or drop the option. Listed as a platform limit on p. 32.
- **Instagram reels.** Link previews often give only a title and thumbnail. Audio transcription (Whisper) needs the video file itself, so a member may have to upload the video or a screen recording.
- **Prototype UI that a chat bot cannot show directly.**
  - Scope choice, Apply / Keep original and Confirm become buttons on Waymark's message (LINE Quick Reply or Flex buttons; Discord buttons).
  - Clarify and preference forms, the itinerary panel with reordering, and the calendar download move to a web page opened from the chat (LINE LIFF; Discord pop-up forms or a link).
  - "Bot menu → Save and finish": LINE's rich menu does not appear in group chats (verify), so use a button on Waymark's message or a typed command.
- **LINE vs Discord.** Discord bots can read a channel's earlier messages (with permission), so "Include earlier messages" works there; LINE bots cannot. LINE fits the target users better.
- **Confirmation rules.** "1 of 4 confirmed" is shown, but nothing says what group agreement means. Must all members confirm? What happens when the plan is saved with confirmations still pending?
- **Prototype text glitches (visible in screenshots).** Apostrophes render with a gap ("Let’ s"), and afternoon times are cut off in the time fields ("04:00 F"). Fix in the prototype if there is time.

## 4. Content to confirm or fill in

- **Submission file name** needs the group number: `GROUP_N_MILESTONE_2.pdf`.
- **Models (p. 30):** Claude Haiku 5.5 for silent reading, Claude Opus 5.5 for drafting and revising. If the $100 credits are tied to another provider, swap these two rows.
- **Cost estimate (p. 30):** "about $2 per trip" assumes 300 messages, 20 screenshots, 10 reels, 3 drafts and 10 revisions, at list prices without caching.
- **Next steps (p. 32):** "about 20 consented group chats" and "3–5 friend groups" are placeholder numbers.
- **Recommendations** (suggesting places nobody mentioned) are listed as "Later" (p. 32). Confirm this is a to-do, not part of the PoC.

## 5. Presentation risks

- **Language.** The video's narration and subtitles are in Chinese, and the presentation must be in English. Narrate it live in English, or re-record it.
- **Time.** Sections 1–2 take 9 pages for about 3 minutes. Section 3 has 4 flow slides plus 13 detail slides for about 5 minutes; if the video is played, show the detail slides only as backup. The whole talk must stay under 12 minutes (5% penalty past 13.5).

## 6. Files regenerated here (replace them if the originals turn up)

- `assets/screens/*.jpg`: screenshots of the live English prototype (26 Oct), in the same states as the video.
- `assets/user-flow-en-*.svg`: the user flow redrawn in English from the original flow image. The labels are a translation of a low-resolution image, so check them against the original Chinese flow.
- `assets/icons/`: from `assets.zip`.
- `front.typ`: the team's original. It runs its own `#show: setup` and `#set document`, which still compiles inside `slides.typ`.
- `fonts/`: static Fraunces, Newsreader and IBM Plex Mono. The Fraunces files were renamed internally to "Fraunces" so they match `theme.typ` (allowed by the font license). Build with:

```sh
typst compile --font-path fonts slides.typ slides.pdf
```
