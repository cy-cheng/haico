# Waymark · Milestone 3

Waymark helps a travel group turn shared places into a reviewed itinerary. This local preview opens the three-day Kansai Fall Trip with four members, an accepted v1 itinerary, and Mia’s pending Day 3 change. The server stores each decision in SQLite. The data in this demo is synthetic.

## Run the preview

Use Node.js 24.2 or newer and npm. From the repository root, enter `milestone3` and run the following commands.

```sh
cd milestone3
npm ci
npm run check
npm test
npm run seed:demo
npm run dev:server
```

Keep the server terminal open. It listens on `http://127.0.0.1:3000` and prints separate, two-hour demo tokens for Alex and Mia. Each restart issues new tokens. The local preview needs no provider credentials. Public hosting and tunnels are outside this release.

In another terminal, open the same `milestone3` directory and start the app in a browser.

```sh
npm run web --workspace @waymark/mobile
```

The app opens in offline preview mode. You can try the four tabs there without starting a server. Changes in that mode last for the current session. Connect to the local server to share decisions between members and keep them after a restart.

For Expo on a simulator, use `npm run dev:mobile`. The iOS Simulator can reach the Mac’s loopback address. When a local Android emulator or USB-connected device is selected in adb, run `adb reverse tcp:3000 tcp:3000` so its loopback address reaches the server. For a bundle of the Android, iOS and web client assets, run `npm run bundle --workspace @waymark/mobile`. This command produces assets for those platforms. Signed APK and ad hoc iOS installers require a separate native build.

## Review a change

Open **Manage → Connect to test server**, enter `http://127.0.0.1:3000`, paste Alex’s token and choose **Connect**. In **Trip**, open **Review proposal** for the pending change, `p7`. Mia wants to leave at 11:00 on November 22 and skip Osaka Castle. The proposal keeps the first two days, both afternoon groups, and their 16:00 meeting at Namba Station.

Choose **Apply** to create v2. It starts with zero confirmations. Open the app in a second tab, connect with Mia’s token and confirm v2 in **Trip**. Both members can now see one of four members confirmed. From **Manage**, export the accepted itinerary as a calendar file. To try the alternative outcome, use a fresh demo and choose **Keep original**. The group stays on v1 with Osaka Castle in its itinerary.

To create a new proposal, open **Map → Yasaka Shrine**, select **Day 2**, enter 14:00–14:45 and choose **Preview addition**. Both members can review the pending change while the accepted itinerary stays on its current version. The server records the member who requested it and checks the requested time against the existing itinerary.

In the offline demo, **AI Chat** replays the sample planning conversations. The live Discord gateway and AI services still need to be connected. The two Discord review cards can be exercised through `npm test`: an Apply click and a confirmation from the mobile API use the same SQLite state, and refreshing the original message shows the new count. The tests provide the Discord transport and the original message binding.

## Replay and persistence

The default database is `milestone3/data/waymark.sqlite`. Re-running `npm run seed:demo` preserves existing decisions and sources. To make another copy of the starting situation, run the following command.

```sh
npm run seed:demo -- --fresh
```

The command prints the new database path. Stop the previous server and start it with that path.

```sh
WAYMARK_DB_PATH="/absolute/path/printed/by/the/seed" npm run dev:server
```

To use a persistent location of your choice, set `WAYMARK_DB_PATH` before both seeding and starting the server. You can also copy `.env.example` to `.env` and set it there.

## Shared data and tests

The checked-in fixtures mirror the three JSON examples in section 4 of the implementation plan. `fixtures/trip-view.json` contains the shared starting snapshot. `fixtures/command.json` supplies the Day 2 Gion request. `fixtures/day3-patch.json` supplies the Day 3 change. The CLI seeds `p7` separately so the same snapshot works for tests that need an empty proposal queue.

The test suite uses isolated databases. It also exercises the same HTTP client used by the app with two members, concurrent decisions, request retries and calendar export across versions. Anthropic, transcription and Google Places adapters are exercised with recorded-format synthetic responses. See the [provider handoff](apps/server/src/model/README.md) for replay instructions and the [implementation plan](IMPLEMENTATION_PLAN.md) for Discord collection, hosted services and device testing.

On November 25, Q1 ran the exported web app at 390 × 844 in Chromium against the local HTTP server and a fresh SQLite database. The two sessions used distinct credentials. See [Alex reviewing the change](evaluation/day3-review/alex-review.png), [v2 immediately after Apply](evaluation/day3-review/alex-v2.png) and [v2 after Mia’s confirmation](evaluation/day3-review/mia-v2.png).

## Install a preview on Android or iPhone

The `preview` profile builds a signed Android APK and an ad hoc iOS app. Both use `org.waymark.trip` and include the JavaScript bundle, so testers can open the sample Kansai trip offline. The profile sets `EXPO_PUBLIC_ALLOW_TEST_SESSION=1` to enable test sessions under **Manage**. Enter an HTTPS server address reachable from the phone and a token issued by that server. Testing a shared trip over cellular with Discord sign-in still requires a hosted Waymark HTTPS backend and Discord OAuth integration.

From `milestone3`, link the app to the team's Expo project on the first build.

```sh
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest init
```

- **Android.** Run `npx eas-cli@latest build --platform android --profile preview`. Follow the signing prompt to use the team's keystore or create one for the first build. On the phone, open the resulting build link, download the APK and tap it to install. [Expo APK installation](https://docs.expo.dev/build-reference/apk/#physical-device)
- **iPhone.** An Apple Developer Program team member runs `npx eas-cli@latest device:create` and sends the registration link to the tester. Open it on the iPhone and complete device registration. Then run `npx eas-cli@latest build --platform ios --profile preview` on the computer and include that iPhone in the signing profile. Open the install link on the registered phone. On iOS 16 or later, enable Developer Mode to launch the app. For a new iPhone, update the profile and rebuild or re-sign the app. [Expo ad hoc distribution](https://docs.expo.dev/build/internal-distribution/#managing-devices) · [iOS Developer Mode](https://docs.expo.dev/guides/ios-developer-mode/)
