# C1 provider handoff

The server injects a fetch function for each adapter. The adapters do not read environment variables or supply credentials. `model/index.ts` exports `createAnthropicModel`, `createWhisperTranscription`, and `ProviderError`. `places/index.ts` exports `createGooglePlaces` with the `searchPlaces` and `facts` methods of `MemoryPort`.

- **Model.** Use `models.extraction` for extract, ground, and summarize, and `models.planning` for draft and revise. Configure models that accept native JSON-schema output. The adapter puts the instruction in the system prompt and the supplied text and images in the user message. It parses the returned JSON as `unknown`, so C2 and D1 still own schema and source ID validation. [Claude Messages](https://platform.claude.com/docs/en/api/messages/create) and [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- **Transcription.** Pass authorized audio bytes and the original source ID, not a media URL. Media retrieval belongs to the caller. The adapter uploads multipart audio to the Whisper-compatible file transcription endpoint and preserves the source ID. Empty bytes, unsupported containers, and blank transcripts use `MEDIA_UNAVAILABLE` with different reasons. The model remains configurable. [File transcription](https://developers.openai.com/api/docs/guides/speech-to-text).
- **Places.** Search preserves separate Google IDs for identically named businesses. `facts` returns ISO UTC intervals clipped to the requested trip-local date. `[]` means the dated hours confirm no opening interval. `null` means the hours or place timezone are missing, the period cannot be interpreted, or Google’s seven-day window does not cover the whole requested date. A regular weekly schedule is not substituted for missing date-specific hours. [Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search) and [Place details](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places).

Transport, HTTP, and invalid-response failures throw `ProviderError` with `code: 'UPSTREAM_UNAVAILABLE'` and a diagnostic `reason`. An optional `observe` callback receives timing, status, the requested/returned model where available, and token or audio duration usage where returned. It does not receive request text, audio, headers, or raw error bodies.

## Offline replay

Inject `replayFetch(...steps)` from `model/fixtures.ts` and use the raw, synthetic responses from either fixture file. The replay checks request order, URL, and method and never falls back to a live service. Use `placesFixtureNow` for the November 2026 schedules. The sample identifiers, times, and usage values are not live results or cost measurements.

```sh
node --import tsx --test apps/server/src/model/providers.test.ts apps/server/src/places/places.test.ts
```
