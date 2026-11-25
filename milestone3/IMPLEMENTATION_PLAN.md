# Waymark M3 實作計畫｜從 Discord 分享到手機上的共同行程

**Group 4，2026/12/02 提交。** Mia 在 Discord 貼一則錦市場 Reel。朋友能在手機地圖找到同一個地方，看到誰分享、誰想去，請 AI 把它排進京都行程。Alex 可以先看第三天修改前後的差異，再決定要不要套用。這是本次要做通的旅程，由一個 Codex 協調者統籌實作，一位使用者處理外部帳號、裝置操作與受測證據。

主對話按任務難度與相依關係派工。A 做手機前端與發佈，B 做 Discord、API 與部署，C 做旅程記憶和地點，D 做規劃、交通和版本。Q1 獨立驗收。第 2 節定義共用的操作，第 4 節提供關西行程測資，文末附 TypeScript 契約。[跳到模型分級與 11 張任務卡](#agent-dispatch)

**11/25 實作交接。** 四個分頁已可操作。A 的離線示範能重播祇園提案與地點來源；切到本機後端後，Alex 和 Mia 能各自審閱、套用、確認同一份旅程。B、D 已串好手動加站、改時、拒絕、衝突處理和歷史日曆；Q1 用兩個成員身分驗過 v1 → v2 → 1/4 確認。下批接 Discord 登入與頻道收集、模型產生提案、公開 HTTPS 及簽署安裝。啟動、重播與安裝設定見 [英文 README](README.md)。

## 產品範圍與畫板對照

畫面名稱、按鈕與操作層級依 M2 的 22 張畫板。簡報第 17–20 頁定義分享、整理／規劃、共同編輯三個情境，第 37–38 頁驗收修改、確認與儲存。簡報第 24、30 頁原提 Web App，本次交付改成可裝在 iPhone 與 Android 上的測試版。[M2 互動原型](https://claude.ai/artifact/75jXxDxX1EwALYK2eui1Xs) · [38 頁上台版](../milestone2/slides_presentation.pdf)

### 手機上的四個分頁

| 分頁與畫板 | 成員打開後能做什麼 | 完成的判準 |
|---|---|---|
| **AI Chat**　#1、#17 | 要求產生三日草案，或只規劃 Day 2 的 13:15–17:30。在嵐山、祇園、休息等有依據的方向中選一個，看建議站點及時段，可按 Apply 或 Keep original。從 Map 或 Trip 點 Ask AI 時帶入當天情境 | 兩個入口都能發起規劃。選祇園先得到待審預覽，只有按 Apply 才會改已接受行程 |
| **Map**　#2、#10 | 依城市或類別篩選、搜尋、點圖釘或候選卡看地點。詳情顯示地址、來源、備註、成員的四種反應；成員可打開原貼文或 Google Maps、選擇要加入的日期 | Mia 分享的錦市場在 Import log 與地圖都指向同一候選。加入 Day 2 經過提案，已排日期能從接受版讀回 |
| **Trip**　#3–6、#9 | 切日期、在地圖與時間表之間切換。展開交通比較時間、票價、轉乘和步驟，選 Use 預覽。Day 3 的兩隊可走不同路線，在 Namba Station 集合；未排候選留在 Drafts。修改預覽可 Edit、Apply 或 Keep original | M3 採 #3 左側時間軸，#4 上方時間帶保留為設計備選。#5 分組、#6 版本差異、#9 交通使用同一份行程，套用後兩端顯示同版 |
| **Manage**　#7 | 查看日期、城市、住宿、航班、步調、建立者與成員、連結的 Discord 頻道。分享邀請、開 Trip memory、匯出已接受版日曆 | 第二位有頻道權限的成員可從邀請加入；兩人看到相同旅程。匯出的日曆對應選定的已接受版本 |

**跨頁入口。** #8 Import log 從 AI Chat 或 Manage 的 Trip memory 開啟。列出已匯入、待補件和辨識失敗的來源，保留原分享者和時間。成員在來源仍獲授權時可按 Re-analyze 重試，或替 Riverside café 補地點。#13 TabBar、#14 AI button、#15 Place card、#16 Itinerary page 由 A 各實作一次，供前述畫面共用。

### Discord 的七種卡片

| 畫板 | 觸發與驗收 |
|---|---|
| **#18 Scope** | 首次提及 Waymark 時，成員選 From now on 或 Include earlier messages。B 記下頻道與授權起點。單次摘要再選 From reply／From here／All earlier，最多只能讀到已授權範圍 |
| **#11 Place card、#22 Clarify** | C 辨識到錦市場後，B 發地點卡，顯示原貼文、分享者、地圖連結和 Must go／Want to／No opinion／Skip。遇到缺店名的 Riverside café，成員可 Add place 或 Not this time，保留判斷的來源 |
| **#12 Summary & options、#19 Generate** | 摘要分 Decided／Undecided，標出涵蓋的訊息與時間。Memory only 保存摘要，Generate plan 產生待審草案，Open in app 回到該旅程或提案。成員投下午方向票，手機可讀回票數 |
| **#20 Change proposal、#21 Confirm & finish** | Mia 要求第三天從 08:30 改成 11:00 並跳過大阪城。接受後大阪城回候選區，第 1、2 天照舊。Confirm／Unconfirm 記錄本人對該版本的意見。Save & finish 先顯示保存內容，確認後暫停收集，重開仍可編輯 |

**這一週的取捨。** 先完成上表的操作。#7 的增減天數、改綁／解除頻道與刪除旅程排在三個情境通過之後，第一版顯示實際可用的控制項。#4 的替代版面也排在之後。M2 第 26 頁把主動推薦未分享的新地點及 LINE 列入後續；成員可以手動加地點。原型上的票數、票價與 AI 建議僅作測資，演示版本要顯示成員的實際選擇與執行結果。[M2 正式報告](../milestone2/GROUP_4_MILESTONE_2.pdf)

## 1. 誰負責哪個模組

一個 Codex 協調者維護相依關係、派工、整合及交件狀態。A／B／C／D 是四個模組邊界，共用一份 v1 契約，可先用第 4 節的測資開發。Q1 獨立審查功能與證據，模組缺陷交回協調者安排修正。所有目錄都相對於 `milestone3/`。

| 工作包／角色 | 執行方式 | 擁有的程式與決定 | 第一次交接 |
|---|---|---|---|
| **A　手機 App** | Codex 的模組任務 | `apps/mobile/`。Expo／React Native 的四個分頁、共用元件、登入回跳與深層連結、前景刷新、日曆分享、iOS／Android 安裝包 | 用測資從 Discord 連結打開指定提案，展示待審、接受後與過期三種狀態。將連結格式、使用者提供的真機測試結果交給 B |
| **B　Discord 與後端整合** | Codex 的模組任務 | `apps/server/src/{discord,http,trip,jobs}/`。七種卡片、登入、旅程權限、來源範圍、命令去重、背景工作與部署。把同一個操作轉給 C 或 D | 給 A 一個可用手機網路登入的 HTTPS 網址；給 C 一筆含授權範圍的來源；給 D 一筆有身分、版本及來源的規劃請求 |
| **C　記憶與地點** | Codex 的模組任務 | `apps/server/src/{memory,places,model}/`。Understand、Ground、摘要、匯入狀態、候選／偏好、成員修正、投票、Places 查詢及共用模型連線 | 交一份包含錦市場與兩個來源、待澄清咖啡店、已決／未決摘要及方向票的記憶快照。A 用來畫地圖，D 用來規劃 |
| **D　行程、交通與版本** | Codex 的模組任務 | `apps/server/src/{planner,routes,review}/`。Draft、Revise、路段比較、分組與集合、提案差異、接受版本、個別確認和日曆 | 交一筆會保留前兩天與分組的 Day 3 提案。A、B 都能用同一個 ID 檢視、接受或拒絕，再讀回同一版本 |
| **Q1　獨立驗收** | 獨立 reviewer | `tests/integration/`、`evaluation/`。依契約與情境檢查整合、重現步驟及實測證據，不兼任 A／B／C／D 的功能實作 | 先列 §4 的預期結果；整合後回報可重現缺陷與尚缺的人類實測證據 |
| **使用者　人類操作者** | 一位使用者 | 外部帳號與憑證、頻道與主機權限、iOS 簽署、手機操作、邀請經同意的受測者、收集實測及錄影證據、最終提交 | 提供可用的外部服務與兩平台測試裝置，依驗收步驟回傳實際結果。真正使用者／受測者是自願參與測試的人，不是額外開發者 |

B 管共用 SQLite 連線、migration runner 和工作佇列，C、D 各管自己資料表的寫入與 migration。C 維護擷取及模型呼叫，D 維護規劃 prompt 和行程驗證。C 交地點與座標，D 交交通時間與選項，A 呈現與收集成員選擇。Codex 依模組任務接通 M2 提案的 Whisper／Places／Routes 與兩級模型；使用者提供所需外部權限與獲准資料。記錄實際模型 ID、失敗情況與每趟成本，對照簡報的 US$2 估算。[M2 簡報第 23–25、28–31 頁](../milestone2/slides_presentation.pdf)

```mermaid
flowchart LR
    Mobile["A · iOS / Android<br/>AI Chat · Map · Trip · Manage"]
    Chat["Discord 群組與卡片"]
    Chat -->|"Open in app"| Mobile
    subgraph Server["一台常駐後端"]
      Bot["B · Discord Bot"]
      Entry["B · Trip 與工作佇列"]
      Memory["C · 旅程記憶與地點"]
      Planner["D · Planner / Review"]
      DB[("持久化 SQLite")]
      Bot <--> Entry
      Entry -->|"收集或修正"| Memory
      Entry -->|"規劃或核准"| Planner
      Memory -->|"同版記憶快照"| Planner
      Entry --> DB
      Memory --> DB
      Planner --> DB
    end
    Chat <--> Bot
    Mobile <-->|"HTTPS /api/v1"| Entry
    Memory -->|"擷取、地點辨識"| ToolsC["模型 / Whisper / Places"]
    Planner -->|"經 C 的 ModelPort 呼叫規劃模型"| Models["規劃模型"]
    Planner --> Routes["Google Routes"]
```

### 真機測試與後端部署

課程要求能依 README 在本機重現。為了讓組員和受測者離開開發電腦也能使用，團隊另外提供雙平台安裝包及一個固定的 HTTPS 網址。一台常駐主機即可執行 Fastify、Discord Bot 與工作處理，SQLite 放在重新部署仍保留的磁碟上。[M3 作業規格](https://docs.google.com/document/d/1f_e977FQVdIpVFO7rHM773MVLVu1sZUJekJLDzXhDFg/edit)

- **B 管網址。** Discord 旅程卡用 `/trips/{t}`，提案卡用 `/trips/{t}/proposals/{p}`。已安裝時開到指定內容，未安裝時同一網址顯示測試版安裝說明。A 處理冷啟動、背景返回、未登入後恢復原目的地；B 逐次驗證旅程權限。
- **A 管兩個安裝包。** Android 交付簽署的 APK。iOS 用團隊的 Apple Developer Program 帳號登記測試機 UDID，產生 ad hoc 安裝連結。A 提供 App ID、Android 套件名及簽章指紋，B 在網域的 `/.well-known/` 提供兩平台驗證檔。兩支手機均應能關掉開發電腦後從 Discord 進入同一筆提案。[Expo 安裝與簽署](https://docs.expo.dev/build/internal-distribution/) · [App 連結](https://docs.expo.dev/linking/overview/)

## 2. 大家共用的 API

A 的 App 經由 HTTPS 呼叫下表的路徑，全部以 `/api/v1` 開頭。B 的 Discord Bot 在同一個後端程序呼叫 `TripPort`。兩端共用旅程權限、操作與版本。可從附錄複製完整 TypeScript 型別，或從 repo 匯入。[共用契約](packages/contracts/src/index.ts)

### 手機從 Discord 登入

使用者從 Discord 開啟旅程或提案時，A 先在手機保存要開的 `tripId`、選用的 `proposalId` 與加入意圖。若尚未登入，A 產生隨機 `state` 和 PKCE `code_verifier`，暫存於 SecureStore，再用系統瀏覽器開啟登入網址。`code_challenge` 是 verifier 的 SHA-256 雜湊經 base64url 編碼（無 padding）。[原生 App 登入流程](https://www.rfc-editor.org/rfc/rfc8252) · [PKCE S256](https://www.rfc-editor.org/rfc/rfc7636)

| 方法與路徑 | 輸入 | 成功回應與用途 |
|---|---|---|
| GET `/auth/discord` | `MobileAuthStart` 的 query 欄位 | B 將 App 的 state 與 challenge 綁到本次登入，另產生一次性 Discord OAuth state 並綁定瀏覽器工作階段，302 到 Discord |
| GET `/auth/discord/callback` | Discord 回傳的 `state`，以及 `code` 或拒絕授權的 `error` | Discord 只回到已登記的後端 HTTPS 位址。B 驗證瀏覽器工作階段並核銷 OAuth state，在後端交換 Discord code、取得身分。B 只導向固定的 `waymark://auth/callback`，query 為 `MobileAuthReturn`，帶回原 App state。成功時附 Waymark 的一次性 code，使用者拒絕時附 `error=access_denied` |
| POST `/auth/mobile/exchange` | JSON `MobileExchange` | B 以原 challenge 驗證 verifier，再以單筆交易核銷綁定該成員、有效 60 秒的 Waymark code 並建立 session。200 `MobileSession`，`expiresAt` 是 24 小時後的 UTC ISO 8601 時間 |
| POST `/auth/logout` | `Authorization: Bearer <accessToken>`，空 body | B 撤銷本次手機 session，回 204。A 清除本機憑證，已失效回 401 時亦清除 |

A 只處理對應本次登入的 callback 和 state。成功後把 verifier 換成 Waymark session，將 token 存在 SecureStore，呼叫受保護的 API 時放入 Authorization header。App 回到先前保存的畫面，需要加入時先呼叫 `join` 再讀提案。B 只在後端保存 Discord 憑證，App 回呼網址只攜帶一次性結果。若取消或關掉瀏覽器，A 清除本次 verifier 和 state，保留目的畫面供重試。code 過期、已使用或 verifier 不符都回 401 `UNAUTHENTICATED`，A 重新啟動登入。B 遇到未通過驗證的 Discord state，在瀏覽器結束流程。

### 讀取資料與加入旅程

| 方法與路徑 | 送什麼 | 成功回應與用途 |
|---|---|---|
| GET `/me` | bearer token | 200 `Member`。A 用此 ID 顯示自己的地點票與版本確認 |
| GET `/trips` | bearer token | 200 `TripInfo[]`，列出已加入的旅程 |
| POST `/trips` | `NewTrip` | 201 `TripInfo`。B 驗證操作者可讀取指定頻道，以本人 ID 寫入 creatorId 並加入成員。每個測試頻道綁一趟旅程，重複綁定回 409 |
| POST `/trips/{t}/join` | 空 body | 200 `TripView`。邀請連結帶 trip ID，B 驗證登入者可讀取該旅程綁定的 Discord 頻道再加入 |
| GET `/trips/{t}` | 無 body | 200 `TripView`，包括基本資料、成員、收集狀態、記憶、已接受版本及待審提案。A 的四個分頁共用這份快照 |
| GET `/trips/{t}/proposals/{p}` | 無 body | 200 `Proposal`，可查看已套用、拒絕或過期的提案。Bot 卡片可用 ID 重新讀取狀態 |
| GET `/trips/{t}/jobs/{j}` | 無 body | 200 `Job`。輪詢至終態，取回提案、澄清問題、摘要、記憶版本或失敗原因 |
| GET `/trips/{t}/places/search?q=...` | 成員輸入的地名或地址 | 200 `Place[]`。B 驗證成員，C 搜尋 Places。選中的 placeId 可綁回原候選，或從地圖加新地點 |
| GET `/trips/{t}/routes?version=2&from=s1&to=s2&modes=rail,bus` | 已接受版本、同一段交通的站點 ID、允許的方式 | 200 `RouteOption[]`。預設 Rail + Bus。顯示可取得的時間、票價、轉乘、步驟。Use 將 optionId 送入手動提案。無可用選項回空陣列 |
| GET `/trips/{t}/calendar.ics?version=2` | 已接受版本號 | 200 `text/calendar`。D 匯出指定版本，A 以登入憑證讀取檔案，透過手機的分享選單匯出。版本不存在回 404 |

新旅程的 `collection=inactive`、`accepted=null`、基準行程版本為 0。B 由 bearer token 或 Discord 事件取得操作者，逐次檢查旅程與頻道權限，並檢查所用的 job、source、candidate、proposal 歸屬該旅程。Discord 按鈕可攜帶旅程與版本，但身分取自當下的點擊者。

### 操作與回應

所有操作都送到 **POST `/trips/{t}/commands`**。每一列的欄位放在同一個 JSON 物件。例：`{"kind":"confirm","planVersion":2}`。HTTP 回應使用下表的型別本身，不另包一層 `data`。

| `kind` | 除 kind 外的欄位 | 負責執行 | 成功回應 |
|---|---|---|---|
| `collect` | `scope: ReadScope` | B，確認範圍後啟動或恢復 | 200 `TripView` |
| `pause` | 無 | B，保存目前接受版、停止收集 | 200 `TripView` |
| `edit_memory` | `memoryRevision, edit: MemoryEdit` | C，人工補景點、澄清、改偏好、排除或投票 | 200 `TripView` |
| `retry_import` | `sourceId` | B 載入原先獲准的分享與媒體，C 重試該筆失敗的匯入 | 202 `JobRef`，成功結果為 `{kind:"memory",revision}` |
| `summarize` | `range: SummaryRange` | B 篩選獲准訊息，C 保存摘要、筆記及可選的方向投票，回傳 summaryId | 202 `JobRef` |
| `plan` | `base: Base, request: PlanRequest, replacesProposalId?` | B 固定輸入快照，D 生成首案、自然語言修改或手動修改的預覽 | 202 `JobRef` |
| `answer` | `jobId` 及 `text` 或 `optionId`，二選一 | B 讀出原規劃工作保存的 `clarify`。選項 ID 須屬於該題，再將回答與來源交給 D | 202 新的 `JobRef` |
| `decide` | `proposalId, action: "apply" 或 "reject"` | D，套用或拒絕指定提案 | 200 `TripView` |
| `confirm`／`unconfirm` | `planVersion` | D，記錄或撤回呼叫者對該版本的同意 | 200 `TripView` |

來源 `sourceId`、候選 `candidateId`、地點供應商的 `placeId` 和行程站點 `stopId` 分開使用。同一地點的多則分享可以合併成一個候選，同一候選可以出現在不同站點。A 用這些 ID 連起原文、地點卡與行程，保留被移出行程的候選。

### 原型按鈕如何接到契約

| 入口 | 讀取與操作 |
|---|---|
| **AI Chat** | 生成首案送 `plan/draft`，修改接受版送 `plan/revise`。規劃 Day 2 下午時指定 `request.context.date` 和帶 UTC offset 的 `window.start/end`。A 保存 jobId。若結果是 `clarify`，點 B · Gion 送 `answer {jobId,optionId}`，也可回覆文字。若沿用已保存的摘要選項，在規劃請求的 context 傳 `selectedOption:{summaryId,pollId,optionId}`。這兩條路都可取得待審提案。Discord 投方向票另送 `edit_memory/vote_option`。 |
| **Map／Place details** | Map 依座標畫點，用 place.city 與候選標籤篩選。Place details 讀地址、來源及成員反應。四種票依序對應 `heart/check/minus/cross`。筆記用 `edit_memory/set_candidate_note`（`candidateId,text`，傳 null 清除本人筆記）。點 Day 1／2／3 後選時段，以 `plan/manual` 加入 `add_stop`，預覽通過才寫入該日。移除一站用 `remove_stop`，略過整個候選用 `edit_memory/exclude`。 |
| **Trip／Transport** | 用 `accepted.itinerary.days` 畫時間表、分組與會合點，從未排入且未排除的候選顯示 Drafts。點交通段帶入該版本與首尾 stop ID，按 Use 送 `plan/manual` 的 `choose_route`。提案畫面用 `proposal.preview/differences/warnings`。Apply 與 Keep original 分別對應 `decide/apply`、`decide/reject`。 |
| **Manage／Trip memory** | Manage 從 `trip` 讀名稱、日期、時區、`creatorId`、`details`（城市、住宿、航班、步調）和 B 從 Discord 取得的 `channelName`（缺值時顯示 `channelId`），從 `members` 顯示成員。缺少選填資料時顯示未提供。M3 核心提供唯讀資料、分享加入連結與匯出 .ics。Trip memory 以 `memory.sources[].importState` 顯示匯入進度、結果與失敗原因，再依 `candidate.sourceIds` 找到地點。Re-analyze 用 `retry_import`，Needs details 用搜尋 → `edit_memory/resolve`。 |
| **Discord · Scope、Place card、Clarify** | Scope 的選擇送 `collect`。獲准分享完成後，Place card 以 `edit_memory/vote` 記錄實際按鈕者。Clarify 的 Add place 用搜尋與 `resolve` 綁回原候選，Not this time 用 `exclude`。 |
| **Discord · Summary & options、Generate、Change proposal、Confirm & finish** | `summarize` 產生摘要卡，Memory only 停在已存的摘要。Generate plan 和 Edit 經 `plan` 產生提案。Open in app 打開旅程或該提案。變更卡呼叫 `decide`，版本卡呼叫 `confirm/unconfirm`。Save & finish 先顯示保存內容，成員確認後送 `pause`。 |

旅程的三種 POST（建立、加入、commands）各帶 `Idempotency-Key`，例如一次點擊產生的 UUID。Bot 使用 Discord interaction ID。索引以操作者、路徑、key 為範圍。完全相同的重試回原先結果或同一個 job ID，用相同 key 送不同內容回 409。登入交換與登出各用上方的憑證規則。A 在旅程畫面開啟時短輪詢，App 回到前景時重讀快照，以伺服器回傳的版本為準。

### 錯誤與狀態

| 情況 | 回應 | 呼叫端行為 |
|---|---|---|
| 尚未登入、session 過期或已撤銷／無權存取旅程 | 401 `UNAUTHENTICATED`／403 `FORBIDDEN` | 401 清除失效憑證，保存原畫面目的地並顯示登入入口。403 說明所需頻道權限 |
| 旅程中的物件不存在 | 404 `NOT_FOUND` | 重新載入旅程 |
| 格式或參照錯誤／已知不可行的行程 | 422 `INVALID_INPUT`／`INFEASIBLE` | 顯示原因，讓使用者修改 |
| 基準過期／提案已結案／key 重用 | 409 `STALE_BASE`／`ALREADY_DECIDED`／`KEY_REUSED` | 取回最新快照，重新預覽後再操作 |
| 匯入已完成或已超出本次收集範圍 | 409 `IMPORT_NOT_RETRYABLE` | 重新讀取該筆 Import log。失去旅程或頻道讀取權仍回 403 |
| 外部模型或地圖服務失敗 | 已受理的 job 進入 `failed`，附 `UPSTREAM_UNAVAILABLE` 與原因 | 顯示重試。單站缺少營業時間、交通估計則以 warning 或 null 呈現 |

錯誤 body 格式為 `{"error":{"code":"STALE_BASE","message":"Refresh this trip and review the new version.","current":{"planVersion":2,"memoryRevision":4}}}`。若 job 開始後才發現資料已變動，查詢 job 仍回 HTTP 200，body 的 `status` 為 `failed`，`error.code` 同樣為 `STALE_BASE`。掛起的 job 可回 `queued` 或 `running`，停止收集而取消的擷取工作回 `cancelled`。

## 3. 後端模組怎麼接

| 介面與負責人 | 呼叫者 | 輸入、輸出與責任 |
|---|---|---|
| `TripPort` · B | A 的 HTTP client、B 的 Discord adapter | 驗證 actor、旅程與權限。以 `forChannel` 找旅程、`onMessage` 收獲准分享、`run` 接成員操作，回傳 `TripView` 或 `JobRef`。保存 Discord 卡片的 channel/message ID 與對應的候選、提案或版本。App 或 Bot 寫入成功後，B 用已提交的狀態更新原卡片，Discord 暫時失敗時重試。 |
| `MemoryPort`、`TranscriptionPort`、`ModelPort` · C | B 提供來源、C 擷取與整理、D 讀地點事實與呼叫模型 | `ingest` 接已核可的來源和媒體，必要時轉錄可取得的音訊。`snapshot` 回傳同一個 revision 的候選、偏好、來源與摘要。`searchPlaces`、`facts` 回地點及營業區間。C 和 D 各自驗證模型 JSON 與來源 ID。 |
| `PlannerPort`、`RoutesPort` · D | B 的規劃工作、D 的 Planner | 固定 `GenerationInput` 的旅程、記憶、接受版本、請求及補答。首案回 `drafted`，修改回有型別的 `patch`，缺資訊可回 `clarify` 與附來源的選項。比較路線時傳地點、出發時間、可接受的交通方式。 |
| `ReviewPort` · D | B 的工作佇列與同步操作 | `propose` 計算預覽及與接受版的差異。`decide` 接受或拒絕指定提案，`setConfirmation` 寫入實際操作者對該版本的意見，`calendar` 匯出指定接受版本。 |

**收集與 Import log。** B 在呼叫 C 之前保存來源和工作狀態，故模型失敗仍查得到原分享。未啟用、已暫停、超出範圍的頻道訊息不排入工作。C 合併同一地點的來源，保留人工修正。私人影片或模糊名稱可留下待補資料的候選。B 在 `Source.importState` 提供這筆分享最近一次匯入的 job ID 與狀態。成功可為 imported 或 needs_details，失敗附 reason，因暫停而取消則為 cancelled。重試須是該旅程有權讀取、仍在本次收集範圍內的失敗分享。B 載入原本的媒體，並讓同一來源只執行一個重試工作。暫停後取消舊工作，每次恢復增加 epoch，C 在寫入時再比對 epoch 與狀態。只有影響規劃的記憶變更才增加 revision。

**兩端的使用者輸入。** B 將手機的要求或補答記為 `origin=app`、`url=null`，作者取自 session。Bot 呼叫非同步 `run` 時可傳內部參數 `discordSource`，標為 `origin=discord` 並保留真實的 Discord 原文連結。外部 Reel 或貼文的網址另存 `sharedPost`。只有要匯入的分享才帶 `importState`。B 把來源 ID 放進規劃輸入，C、D 只使用該旅程獲准的來源。B 用同一操作 key 重試時，須取回原來源與原 job。

**Day 2 的方向選擇。** D 以指定日期、時間窗和既有候選產生選項，C 提供已知營業時間，未知為 null。使用者按選項後，B 依原 job 取回選項與來源，將選項放入 GenerationInput.answers 的 selectedOption。選項不存在回 422 INVALID_INPUT。若引用先前的方向票，則驗證 summary/poll/option 彼此隸屬。D 保留其他日期與時段，將結果送入同一個提案審閱流程。需要補地名時，用搜尋與 `resolve` 修正原候選，再從最新 revision 規劃。無法排入時段或分組後無法準時會合，回傳具體衝突供成員修正。

**摘要與路線。** `collect.scope` 決定可讀的訊息。`summarize.range` 選其中一段來整理。From reply 從被回覆訊息、From here 從指定訊息算起，All earlier 涵蓋已授權的歷史，截止於成員提出摘要要求時。C 保存時間範圍、訊息數、Decided／Undecided 及其來源，供兩端再次開啟。交通比較按指定版本、路段與出發時間查詢，保留每種方式可取得的步驟、時間、票價和轉乘。無方案回空陣列，缺資料的數值回 null。成員選用路線後仍可先預覽。

**接受、拒絕與確認。** B 維護 SQLite 連線與 migration runner，各人維護自己模組的資料表。網路請求在交易外執行。D 建提案和套用時都比對 `base.planVersion` 與 `base.memoryRevision`。Apply 在同一筆交易內檢查 pending、寫入新版、結束提案並記錄操作結果。Reject 只結束提案。每個新版本從零位成員確認開始。Edit 以 `replacesProposalId` 指向的預覽作起點，新提案存妥後將舊提案標為 stale，並相對於已接受版本列出完整差異。Save & finish 暫停收集後仍可重開同一版行程、查看來源與待確認者。

## 4. 三個可重跑的整合情境

用同一趟 Kansai Fall Trip（`osaka`，`Asia/Tokyo`，11/20–22），分別還原每個情境的起始狀態。Mia、Alex、Ben、Yuki 各有自己的身分。以下是開發用合成資料與預期結果。測試版驗收時，把同一套步驟放到經同意的 Discord 測試頻道與實機上執行，記下實際結果。

| 情境與畫板 | 從哪裡開始 | 兩端怎麼驗收 |
|---|---|---|
| **① Mia 分享，Ben 補地點**。11、8、10、22 | 在已啟用的頻道分享錦市場 Reel，同一地點再由另一人分享一次。Ben 的 Riverside café 只有名稱線索 | Discord 出現含來源的地點卡。App 的 Map 和 Import log 找得到同一個候選、兩筆來源及每位成員的反應。Ben 從 Add place 選定地址後保留原來源。另以解析失敗的貼文測一次 Re-analyze，重送只產生同一份工作結果 |
| **② Alex 選祇園，讓 AI 預覽下午的安排**。12、1、17、9 | 先給 Day 2 留 13:15–17:30 空檔，備妥已分享、可辨識的候選。Discord 摘要列 Decided／Undecided 及方向投票。以 `sum2/poll2/gion` 識別祇園選項 | 在 App 的 AI Chat 選 Gion，讀回只改 Day 2 下午的待審預覽，原版與投票數維持原值。Keep original 後空檔仍在。從同一基準重跑並 Apply，再看 Trip 時段及兩站的 Transport。另從空行程測一次 Generate，Apply 後才有 v1 |
| **③ 第三天晚出發，兩組仍能會合**。5、6、20、21 | 還原下方 v1，Mia 在 Discord 說「第三天十一點出發，跳過大阪城」。兩組已約好 16:00 在 Namba Station 會合 | 手機顯示 v1→待審差異，兩個入口都能 Keep original。Alex 按 Apply 後顯示 v2、0/4，Mia 再 Confirm 才是 1/4。大阪城回到候選，兩組的成員及會合站保留，第 1、2 天逐欄相同。Save & finish 可取消，完成後暫停收集。重開 App 仍可從 Manage 匯出 v2 的日曆 |

**情境 ② 的請求。** `vote_option` 記錄成員在 Discord 對方向的意見。按 AI Chat 的 Gion 按鈕會提出以下 `POST /api/v1/trips/osaka/commands`。三個方向先存在 `SavedSummary.poll`，整理時使用的訊息可從摘要筆記追溯。若成員直接從 App 詢問空檔，伺服器也可回傳附選項的 `clarify`。A 送 `answer`、該次 `jobId` 與 `optionId` 取得預覽。每個 POST 範例另帶一次操作的 `Idempotency-Key`。

```json
{
  "kind":"plan","base":{"planVersion":1,"memoryRevision":4},
  "request":{"kind":"revise","instruction":"請把祇園散步排進第二天下午",
    "context":{"date":"2026-11-21","window":{"start":"2026-11-21T13:15:00+09:00","end":"2026-11-21T17:30:00+09:00"},
      "selectedOption":{"summaryId":"sum2","pollId":"poll2","optionId":"gion"}}}
}
```

**情境 ②、③ 的共同起點。** A 用下方 JSON 模擬 `GET /api/v1/trips/osaka`，B–D 用同一份 `TripView` 建測資。每次測試都還原 v1。測試「先從 App 詢問」時清空 `summaries`，保留同一批來源與候選，確認 AI 仍能給出有依據的方向。範例座標僅供畫面測試，真實分享需可回查原文，交通時間用實際查詢結果。

<details>
<summary>展開可直接載入的 TripView 測資</summary>

```json
{
  "trip":{"id":"osaka","name":"Kansai Fall Trip","channelId":"ch1","channelName":"kansai-trip","timezone":"Asia/Tokyo","firstDate":"2026-11-20","lastDate":"2026-11-22","creatorId":"mia","details":{"cities":["Osaka","Kyoto"],"stay":"Namba hotel","flights":null,"pace":["Relaxed","Less walking"]}},
  "members":[{"id":"mia","name":"Mia"},{"id":"alex","name":"Alex"},{"id":"ben","name":"Ben"},{"id":"yuki","name":"Yuki"}],
  "collection":"active","epoch":1,"scope":{"mode":"from_now"},
  "memory":{"revision":4,"preferences":[],
    "summaries":[{"id":"sum2","range":{"mode":"from_here","messageId":"ky1"},"firstAt":"2026-11-19T18:05:00+09:00","lastAt":"2026-11-19T18:06:00+09:00","messageCount":2,
      "notes":[{"id":"n1","state":"decided","text":"Lunch at Nishiki Market.","sourceIds":["ky1"]},{"id":"n2","state":"undecided","text":"Day 2 afternoon is open until 17:30.","sourceIds":["ky1","ky2"]}],
      "poll":{"id":"poll2","question":"How should we spend the afternoon?","options":[{"id":"arashiyama","label":"Arashiyama","voterIds":["ben"]},{"id":"gion","label":"Gion · Old-town stroll","voterIds":["mia","alex"]},{"id":"rest","label":"Keep time free","voterIds":[]}]}}],
    "sources":[
      {"id":"m1","origin":"discord","authorId":"mia","text":"Nishiki Market on Day 2, Osaka Castle on Day 3.","url":null,"at":"2026-11-19T18:00:00+09:00"},
      {"id":"m2","origin":"discord","authorId":"ben","text":"Start at Namba Station on Day 1. After lunch in Shinsekai on Day 3, Mia and Yuki visit Umeda Sky Building, Alex and Ben visit Tsutenkaku. Meet at Namba Station at 16:00.","url":null,"at":"2026-11-19T18:01:00+09:00"},
      {"id":"ky1","origin":"discord","authorId":"alex","text":"After lunch at Nishiki Market, we have 13:15–17:30 free. We could visit Yasaka Shrine and walk along Hanamikoji in Gion.","url":null,"at":"2026-11-19T18:05:00+09:00"},
      {"id":"ky2","origin":"discord","authorId":"ben","text":"Or visit Arashiyama Bamboo Grove, or simply leave the afternoon free.","url":null,"at":"2026-11-19T18:06:00+09:00"}
    ],
    "candidates":[
      {"id":"castle","label":"Osaka Castle","state":"resolved","place":{"id":"place-castle","name":"Osaka Castle","coordinates":null},"choices":[],"sourceIds":["m1"],"votes":[]},
      {"id":"lunch","label":"Shinsekai · Lunch","state":"resolved","place":{"id":"place-lunch","name":"Shinsekai · Lunch","coordinates":null},"choices":[],"sourceIds":["m2"],"votes":[]},
      {"id":"namba","label":"Namba Station","state":"resolved","place":{"id":"place-namba","name":"Namba Station","coordinates":null},"choices":[],"sourceIds":["m2"],"votes":[]},
      {"id":"umeda","label":"Umeda Sky Building","state":"resolved","place":{"id":"place-umeda","name":"Umeda Sky Building","coordinates":null},"choices":[],"sourceIds":["m2"],"votes":[]},
      {"id":"tsuten","label":"Tsutenkaku","state":"resolved","place":{"id":"place-tsuten","name":"Tsutenkaku","coordinates":null},"choices":[],"sourceIds":["m2"],"votes":[]},
      {"id":"nishiki","label":"Nishiki Market","state":"resolved","place":{"id":"place-nishiki","name":"Nishiki Market","city":"Kyoto","coordinates":{"lat":35.005,"lng":135.765}},"choices":[],"sourceIds":["m1","ky1"],"votes":[]},
      {"id":"yasaka","label":"Yasaka Shrine","state":"resolved","place":{"id":"place-yasaka","name":"Yasaka Shrine","city":"Kyoto","coordinates":{"lat":35.004,"lng":135.778}},"choices":[],"sourceIds":["ky1"],"votes":[]},
      {"id":"hanamikoji","label":"Hanamikoji","state":"resolved","place":{"id":"place-hanamikoji","name":"Hanamikoji","city":"Kyoto","coordinates":{"lat":35.002,"lng":135.775}},"choices":[],"sourceIds":["ky1"],"votes":[]},
      {"id":"bamboo","label":"Arashiyama Bamboo Grove","state":"resolved","place":{"id":"place-bamboo","name":"Arashiyama Bamboo Grove","city":"Kyoto","coordinates":null},"choices":[],"sourceIds":["ky2"],"votes":[]}
    ]
  },
  "accepted":{"version":1,"confirmedBy":[],"itinerary":{"days":[
    {"date":"2026-11-20","departAt":"2026-11-20T10:00:00+09:00","stops":[{"id":"s1","candidateId":"namba","start":"2026-11-20T10:00:00+09:00","end":"2026-11-20T10:15:00+09:00","sourceIds":["m2"]}],"legs":[],"split":null},
    {"date":"2026-11-21","departAt":"2026-11-21T12:00:00+09:00","stops":[{"id":"s2","candidateId":"nishiki","start":"2026-11-21T12:00:00+09:00","end":"2026-11-21T13:15:00+09:00","sourceIds":["m1"]}],"legs":[],"split":null},
    {"date":"2026-11-22","departAt":"2026-11-22T08:30:00+09:00",
     "stops":[
       {"id":"sCastle","candidateId":"castle","start":"2026-11-22T09:30:00+09:00","end":"2026-11-22T11:30:00+09:00","sourceIds":["m1"]},
       {"id":"sLunch","candidateId":"lunch","start":"2026-11-22T12:15:00+09:00","end":"2026-11-22T12:45:00+09:00","sourceIds":["m2"]},
       {"id":"sMeet","candidateId":"namba","start":"2026-11-22T16:00:00+09:00","end":"2026-11-22T16:15:00+09:00","sourceIds":["m2"]}
     ],
     "legs":[{"fromStopId":"sCastle","toStopId":"sLunch","mode":"transit","minutes":null}],
     "split":{"afterStopId":"sLunch","meetingStopId":"sMeet","branches":[
       {"memberIds":["mia","yuki"],"stops":[{"id":"sUmeda","candidateId":"umeda","start":"2026-11-22T13:25:00+09:00","end":"2026-11-22T14:30:00+09:00","sourceIds":["m2"]}],"legs":[{"fromStopId":"sLunch","toStopId":"sUmeda","mode":"transit","minutes":null},{"fromStopId":"sUmeda","toStopId":"sMeet","mode":"transit","minutes":null}]},
       {"memberIds":["alex","ben"],"stops":[{"id":"sTsuten","candidateId":"tsuten","start":"2026-11-22T13:00:00+09:00","end":"2026-11-22T14:00:00+09:00","sourceIds":["m2"]}],"legs":[{"fromStopId":"sLunch","toStopId":"sTsuten","mode":"transit","minutes":null},{"fromStopId":"sTsuten","toStopId":"sMeet","mode":"transit","minutes":null}]}
     ]}
    }
  ]}},
  "pending":[]
}
```

</details>

**用同一筆提案測版本。** B 把 Mia 的修改請求記為新來源 `m3`，先回傳 `202 {"jobId":"j7"}`。背景工作由 D 產生下面的 `DraftResult`，驗算預覽的站點、交通與分組。App 輪詢 `GET /api/v1/trips/osaka/jobs/j7` 得到 `proposalId=p7`，再讀 `GET /api/v1/trips/osaka/proposals/p7`。按 Apply 送 `{"kind":"decide","proposalId":"p7","action":"apply"}`，另一次 Confirm 送 `{"kind":"confirm","planVersion":2}`。

```json
{
  "kind":"patch","changes":[
    {"kind":"retime_day","date":"2026-11-22","departAt":"2026-11-22T11:00:00+09:00"},
    {"kind":"remove_stop","stopId":"sCastle"}
  ],
  "sourceIds":["m3"],"warnings":[]
}
```

**重送與競爭。** 從同一份 v1 建兩個待審提案，用兩支手機分別套用。一次成功，另一支應收到 409 並顯示新版本。成功端因斷線以相同 key 重送，應讀回第一次的 v2。再從 v1 獨立測 Keep original，確認版本與分組都未變。暫停收集後才抵達的擷取結果應被捨棄。

<a name="agent-dispatch"></a>

## 5. Agent 派工單

一個 Codex 對話負責調度。A、B、C、D 是產品模組，Q1 是跨模組驗收。這份表決定每張卡的哪一段交給哪種 agent；後面的卡片定義可寫入的路徑、接口和交付條件。路徑相對於 `milestone3/`，已存在的實作依據是本文與 `packages/contracts/src/index.ts`。

### 本機的模型與難度

依本機 `model-router` 和 2026/11/25 的 Codex 設定分派。表內是開發 Waymark 的模型；Waymark App 用來擷取景點與產生行程的模型由 C1、D1 另行設定。

| 難度 | 在此專案使用的 agent | 派給它的工作 |
|---|---|---|
| T0 · lite | `gpt-6.1-terra` · medium | 規則已給定、可逐項比對的單檔工作，例如從 §4 抽取一筆 JSON，或核對交件版號 |
| T1 · std | `gpt-6.2-sol` · xhigh | 依既有契約實作畫面、轉換供應商回應、重播已定義的測試案例 |
| T2 · deep | `gpt-6.2-astra` · xhigh | OAuth、頻道權限、簽署、SQLite 交易與遷移、跨端狀態、時段／分組約束及跨模組除錯 |
| T3 · 主對話 | 本機預設 `gpt-6.2-astra` · ultra | 裁決會改動多方契約的設計問題，例如 B1 與 D2 的交易邊界無法保證 Apply 只寫入一次。日常交接由同一個主對話處理 |

### 11 張卡怎麼分派

表中用箭頭表示同一張卡的交接次序。前一位要回報可重跑的測試和修改路徑，下一位才接管同一批檔案。

| 卡 | 分派 | 交接時要看到的結果 |
|---|---|---|
| A1 手機入口 | **T1** 四個分頁、測資 client → **T2** 登入、SecureStore、簽署與真機連結 | 未登入點 p7，授權後回 p7；取消能再試，無權時看到 403 |
| A2 地圖與記憶 | **T1** 依固定快照做 Map、Manage、Import log 與地點詳情 → **T2** 驗證補正後重試、跨頁加入行程及雙機同步 | 兩筆分享只有一個圖釘，仍可追兩個來源；加入指定日期須先預覽 |
| A3 AI Chat 與 Trip | **T1** 時間軸、分組與差異畫面 → **T2** 串接非同步提案、重試、409 與前景刷新 | 選祇園時票數與 v1 不動；按 Apply 才讀到 v2 |
| B0 工程與部署 | **T2** 擁有 workspace、持久化、遷移與部署。可獨立交 **T0** 按 §4 抽固定測資，交 **T1** 重跑乾淨安裝 | 服務重啟後仍讀到同版資料；重跑 migration 成功 |
| B1 身分與工作 | **T2** 主責 OAuth、頻道授權、工作佇列與去重。若需改 v1 契約才能完成交易，由 **T3** 裁決 | 一次性 code 只能使用一次；同 key 回原結果，無權不能讀取旅程 |
| B2 Discord | **T1** 用假的 TripPort 重播七種卡片 → **T2** 核對真實點擊者、授權範圍及事件重送 | 同一 interaction 重播一次只算一票，原卡能反映手機端的 Apply |
| C1 供應商 | **T1** 做轉錄／Places／模型回應的轉換及測試替身。涉及後端憑證或權限的真服務接線交 **T2** | 同名地點、無法讀取的媒體和未知營業時間都能區分；真實結果另列 |
| C2 記憶與匯入 | **T2** 處理來源去重、人工補正、重試與 epoch 競爭 | 暫停後舊工作晚到仍無法寫入；補正地點保有原來源 |
| D1 Planner 與交通 | **T2** 處理時段、分組、路線選項與有來源的模型輸出。已定格式的票價／轉乘轉換可交 **T1** | 改 Day 2 下午只影響指定時段；Day 3 兩組仍準時會合 |
| D2 版本審閱 | **T2** 負責提案生命週期、並行 Apply、逐人確認及同筆交易保存 | 兩人同時按 Apply 只產生一份 v2，重送仍回原結果；Mia 確認後為 1/4 |
| Q1 獨立驗收 | **T1** 依 §4 從外部入口重跑三情境；**T2** 用第二個視角重現權限、競爭與跨端異常；**T0** 核對交件版號 | 交給主對話可重現輸入、預期／實際結果與證據，並區分本機、真機、真服務 |

**交給主對話的開工指令**（準備實作時使用）：

> 依 §5 模型表調度 Waymark，在本機 repo 開工。第一批派 B0 的 T2、A1 的 T1、C1 的 T1，三個 worker 各寫自己範圍。每次派工附上卡號、本次子任務、允許路徑、§4 測資與通過條件。主對話重跑驗收後，再依交接順序派下一個可開工的任務。

**調度與升級。** 主對話保留一席，最多三個 worker 同時操作。每份 T0、T1 派工指令附上 `If this turns out harder than expected, stop and reply only with ESCALATE: <reason>.`。接到 ESCALATE 或驗收失敗時，附失敗案例升一級重試一次；仍失敗由主對話接手。新發現涉及安全、登入、計費或刪除資料的工作直接交至少 T2。每次交接記錄實際使用的模型與推理強度、改動範圍、測試命令及結果。

### A 負責手機前端

#### A1　手機入口、登入、測試版

- **範圍。** 擁有 `apps/mobile/app/`、`src/platform/`、`src/ui/` 與手機專案設定（均在 `apps/mobile/` 下）。建置 Expo 四分頁、共用 UI、API client、fixture／連線模式與 EAS preview。A2、A3 各自匯出畫面，A1 在此註冊。將 App ID、Android 套件名稱與簽章指紋交給 B0。
- **串接。** 系統瀏覽器開啟 `GET /auth/discord`，以 `POST /auth/mobile/exchange` 換取本人 session 並存 SecureStore。記住原本的旅程／提案，授權後先驗證成員再開 p7。401 提示重登，403 顯示權限問題，回前景重讀旅程。
- **交付 A2、A3、B0。** 一套可切換的 API client、一個 APK、一個登記 iPhone 可裝的 ad hoc 版本。兩支手機從行動網路測冷啟、背景返回、取消登入再重試與開啟指定提案。尚未取得簽署或網域時，分列已通過的本機步驟與待驗的真機步驟。

#### A2　Map、Manage、地點詳情與匯入紀錄

- **範圍。** 擁有 `apps/mobile/src/features/{map,memory,manage}/`。完成 #2、7、8、10 與共用地點卡 #15 的內容。以同一個 `candidateId` 串圖釘、來源、反應和備註。Manage 顯示成員與頻道，提供邀請與日曆分享。
- **串接。** 先對 `TripView` 與 A1 client 替身開發，再接 B1、C2。四種反應、筆記及補地點用 `edit_memory`，另行重試解析用 `retry_import`。選 Day 2 時送 `plan/manual` 的 `add_stop`，導到 A3 的提案預覽。從 Manage 帶登入憑證匯出指定版 `.ics`。
- **交付 A1、C2。** 兩筆錦市場分享只畫一個圖釘，可開到兩筆來源。Ben 補 Riverside café 後仍看得到原分享；重試失敗的貼文有進度或失敗原因。用第二位成員核對反應同步。

#### A3　AI Chat、Trip、路線與提案

- **範圍。** 擁有 `apps/mobile/src/features/{chat,trip}/`，含 #1、3、5、6、9、17 與 #14、16 內容。實作左側時間軸、分組／會合、候選區、交通比較、來源與差異。地圖或 Discord 的指定提案連結都進同一份預覽。
- **串接。** `plan` 或 `answer` 取得 `jobId`，輪詢後用 `proposalId` 讀提案。分開處理 Discord 方向票、直接選擇 AI 的澄清選項，以及引用已存摘要選項；Edit 傳 `replacesProposalId`。按 Use、Apply、Keep original、Confirm 各走第 2 節對應操作。
- **交付 A1、D1、D2。** 用有投票／無投票兩種起點測祇園預覽。按 Keep original 保留 v1，按 Apply 才出現 v2 與 0/4；Mia 確認後為 1/4。過期提案收到 409 時重新載入，Day 3 仍顯示兩組在 16:00 會合。

### B 負責共用工程、API 與 Discord

#### B0　工作區、資料庫與可部署入口

- **範圍。** 擁有 M3 根目錄的 workspace 設定、共用 lockfile、英文 README、`.env.example`、`fixtures/`、`deploy/`、`apps/server/` 的專案設定與啟動入口、`apps/server/src/db/`。以 npm workspaces 建立手機、後端及 contracts 的匯入關係；各 agent 回報依賴需求給專案設定擁有者。
- **先交什麼。** 從第 4 節取出可匯入的 `TripView`、`Command`、`DraftResult` 測資，建立單一 SQLite 連線、交易與 migration runner。C2、D2 各交模組內 migration。提供測試專用 DB、重置示範資料與型別檢查入口，工作可重播且不覆寫使用者的旅程。
- **交付全組。** 英文 README 在乾淨 checkout 可重現 `npm ci`、`npm run check`、`npm test`、`npm run seed:demo`、`npm run dev:server`（由本卡建立）。相同 migration 跑兩次、服務重啟後，版本和來源仍一致。線上用同一啟動入口、固定 HTTPS 和持久磁碟；以 A1 的識別資料交付兩平台關聯檔及安裝引導頁。

#### B1　身分、HTTP、TripPort 與背景工作

- **範圍。** 擁有 `apps/server/src/{http,trip,jobs}/` 及本模組資料表。註冊第 2 節的登入、查詢和 commands。先以 C、D 的替身測 Fastify 的 HTTP 入口，之後由 B0 注入真實 ports。每筆請求從登入或 Discord 事件取 actor，檢查旅程及該頻道權限。
- **交易與交接。** 同步回 `TripView`，長任務回 202 `JobRef`。B1 保存來源原文、媒體參照、scope／epoch、job 狀態及操作結果，在 snapshot 組裝時向 C2 提供獲准來源。B1 與 D2 共用同一筆交易完成版本套用及去重。將已提交的卡片更新交給 B2，讓 App 與 Discord 共用狀態。
- **驗收給 A1、B2、Q1。** 測試登入取消、一次性 code 重用、無權旅程 403、重送同 key 讀回同一個 job／操作結果、同 key 改內容回 409。重啟後可查 job 與版本，暫停中晚到的擷取不能寫入；一次 App 請求能追到 App 的來源，Discord 請求能追到原訊息。

#### B2　Discord 七種卡片

- **範圍。** 擁有 `apps/server/src/discord/`。用假的 `TripPort` 先重播一則分享和一次點擊，再接 B1。完成 #18、11、22、12、19、20、21，並保存原卡識別資料供更新。Bot 元件上的旅程／提案 ID 用於查詢，操作者取自當次 Discord interaction。
- **交付 A1、Q1。** 在測試頻道讓兩位成員完成 From now on、分享、四種反應、摘要方向票、草案、澄清與修改。Open in app 打開同一提案；成員在手機套用後原卡也顯示 v2。Save & finish 先預覽保存內容，可取消；確認後新訊息不再匯入。以同一 interaction ID 重播時不重複計票。

### C 負責 AI 擷取與旅程記憶

#### C1　模型、轉錄、地點查詢

- **範圍。** 擁有 `apps/server/src/{model,places}/`，含轉錄 adapter。實作 `ModelPort.generate`、`TranscriptionPort.transcribe`、地點搜尋與營業時段查詢。C2 透過 MemoryPort 對外提供後兩項地點能力，D1 用 ModelPort 呼叫規劃模型。
- **交付 C2、D1。** 交一份可重播的供應商回應及實際服務呼叫結果，列實際模型 ID、輸入來源、延遲與可得的成本資料。測營業時段已知、未知、確定未開；驗證同名地點、無法取用的媒體及供應商失敗都保留可判讀結果。金鑰由 B0 記其設定名稱，值只在後端使用。

#### C2　Memory、匯入、投票與補正

- **範圍。** 擁有 `apps/server/src/memory/`，含候選、來源關聯、摘要、成員反應及 revision 的 migration。用 C1 替身與 B1 提供的原文／epoch，實作 `ingest`、`snapshot`、`edit`、`summarize`。只處理獲准資料，寫入前以同一交易再次確認 epoch 與人工修正。
- **交付 A2、B2、D1。** 錦市場只留一個候選、兩個可追溯來源。Riverside café 可從 Needs details 補地點；重試失敗來源只執行一個工作且不覆蓋人工答案。產生帶來源的 Decided／Undecided 摘要和方向票，驗證投票與版本一致。B1 提供的匯入狀態必須出現在 App 快照；回報測試中的去重、誤辨與虛構地點數。

### D 負責規劃、交通與版本

#### D1　Planner、路線與局部修改

- **範圍。** 擁有 `apps/server/src/{planner,routes}/`。讀 `GenerationInput`，使用 C1 的模型介面及 C2 的同版記憶。首案回 `drafted`，修改回 `patch`，缺資訊回 `clarify`。驗證模型輸出的欄位和來源 ID，檢查時窗、已知營業時間、分組與會合。
- **交付 A3、D2。** 分別以有摘要及無摘要的測資安排 Day 2 13:15–17:30。使用者選祇園後才產生可審預覽，保留窗外行程與票數。Day 3 的 patch 將出發改成 11:00、移除大阪城、保留 16:00 會合。比較同路段的交通，未知票價回 null、無方案回空陣列；Use 的 optionId 綁版本、路段與出發時間。至少留一筆真實模型與路線服務的驗收紀錄。

#### D2　Review、版本與日曆

- **範圍。** 擁有 `apps/server/src/review/`、本模組 migration 與日曆匯出。先直接餵第 4 節的 `DraftResult`，使用 B0 的交易入口做 `propose`、`decide`、`setConfirmation`、`calendar`。A、B 均讀同一份伺服器預覽。
- **交付 B1、A3、Q1。** 兩人從 v1 開不同提案，一人 Apply 後只有一份 v2，另一人收到 409；成功者相同 key 重送仍讀回原結果。Reject 保留 v1；Apply 後 0/4，Mia Confirm 後 1/4。舊版本可匯出，移除的候選可追溯，前兩天與分組集合保持原值。另測「編輯舊提案」只在新提案成功保存時淘汰舊提案。

### Q1　跨模組驗收與交件

主對話整合各卡後，另派 Q1 重做驗收。Q1 擁有 `tests/integration/` 與 `evaluation/`，先依 §4 編寫預期結果，整合後走公開 HTTP、Discord 卡片與實機 UI。遇到差異，把可重現輸入交還原卡修正，再由 Q1 重跑。

| 要證明的事 | 獨立還原後的操作與交件證據 |
|---|---|
| 來源可追、錯誤可修 | 兩則分享同地點，兩支手機與卡片顯示同一候選；補正 Riverside、重試失敗匯入，再測暫停後回來的舊工作。記錄候選、來源、job 與 epoch |
| 人能決定 AI 建議 | 從已投票或尚無投票的狀態選祇園，先拒絕，再重跑並接受。記錄窗外行程、票數、接受版與提案的前後差異 |
| 跨端修改能保存 | 兩人競爭 Apply、重送、Confirm／Unconfirm、Save & finish，再關 App、重啟後端、匯出日曆。核對 v2、分組集合、確認名單與停止收集 |
| 別人能重現 | 每次記下 commit、build、裝置、輸入、預期、實際及限制。A 交英文實拍 MP4，B 交可乾淨安裝的 ZIP／英文 README，C、D 交英文 PDF。三者引用同一版 |

### 同一台機器的執行順序

| 階段 | 三個 worker 優先拿什麼 | 主對話重跑的驗收 |
|---|---|---|
| 起手 | **B0／T2** 工作區、共用 fixture、交易入口；**A1／T1** 四分頁與測資 client；**C1／T1** 單一供應商 adapter 與重播資料 | 以 §4 快照啟動手機畫面；確認 B0 能在新測試 DB 重跑 migration，才交給需要寫入的卡 |
| 後端狀態 | **B1／T2** 身分、工作與去重；**D2／T2** 版本交易；**C2／T2** 記憶與 epoch。先以替身隔離開發 | B1 和 D2 以同一筆交易驗證重送；B1 和 C2 驗證暫停後仍在途的工作不能落盤。B0 整合、持久磁碟與固定網域準備好後接真服務 |
| App 與 Discord 接線 | **A1／T2** 登入與簽署；**B2** 先 T1 卡片、再 T2 真實互動；**D1／T2** 規劃與路線。C1 的真服務／憑證接線在首個空槽由 T2 完成 | 驗證手機可直接回 p7；把真實訊息、來源 ID、模型產生的提案一路查回原卡 |
| 完成三情境 | **A2** 地圖與記憶；**A3** AI Chat 與 Trip；**Q1** 先以 T1 準備黑箱案例，整合時由獨立 T2 驗證跨端行為 | 逐一還原 §4，驗分享去重、祇園預覽與跨端核准。其餘空槽回修能重現的缺陷；交件前以同一版重跑 |

階段按依賴釋出工作，每個 worker 完成即可補位。為配合 11/26 實機安裝與 11/27 分享驗收，A1 的登入在 B1 登入入口可用時優先接手，A2 的唯讀地圖與 B2 的地點卡也可提早接測資。共用 lockfile、伺服器啟動入口由 B0 維護；手機路由與 manifest 由 A1 維護。各卡可在同一台機器用獨立 worktree。需要改 v1 契約時把失敗案例交給主對話，和受影響的卡一起更新型別、文件與測資。

**需要本人協助的部分。** 帳號擁有者提供測試頻道與服務權限、iOS 簽署和實機操作；agent 可先用替身開發、準備安裝包並重跑本機驗收。Q1 分別記錄本機測試、實機／真服務和受測者實際操作的結果。

### 給手機 agent 的選用工具

這些工具用在 A 的任務內。11/25 查閱時，三者都由 Expo 團隊發佈，來源 repo 約 4.2K stars。表中是技能目錄的累計安裝量。B、C、D 與 Q1 可直接使用專案契約、SQLite 與第 4 節的可重播情境。[Expo 官方 repo](https://github.com/expo/skills)

| 適用卡 | 用途與安裝量 | 選用時執行 |
|---|---|---|
| A1 | 四個分頁、巢狀提案路徑與深層連結，約 35.3K。[expo-router](https://skills.sh/expo/skills/expo-router) | `npx skills add expo/skills --skill expo-router` |
| A2、A3 | iOS／Android 的原生介面元件，約 41.2K。[expo-native-ui](https://skills.sh/expo/skills/expo-native-ui) | `npx skills add expo/skills --skill expo-native-ui` |
| A1 發佈 | EAS 簽署與 build 設定，約 29.9K。這次走 APK 與 iOS ad hoc 的 internal distribution。[eas-app-stores](https://skills.sh/expo/skills/eas-app-stores) · [測試版發佈設定](https://docs.expo.dev/build/internal-distribution/) | `npx skills add expo/skills --skill eas-app-stores` |

## 6. 一週內接起來與交件

| 日期 | 當天要能在使用者或受測者裝置上重現什麼 |
|---|---|
| **11/25** | Codex 協調者按 A／B／C／D 模組跑通同一份 v1 測資。使用者確認團隊可用的 iOS 簽署帳號與測試機 UDID，提供 Discord 測試頻道、網域和持久磁碟權限；Codex 讓 C、D 各跑通一次實際模型或地圖服務，Q1 先寫預期結果 |
| **11/26** | Codex 完成 A 的 Android APK、已登記 iPhone 的 ad hoc 安裝連結。使用者在兩支真機以行動網路從 Discord 開啟指定旅程並記錄結果。尚未安裝時顯示安裝引導，安裝後再點原連結。B 在部署主機重啟服務後仍讀得到資料 |
| **11/27** | 跑情境①。Codex 串接 B 的收集範圍、C 的真實分享與地點補正、A 的 Map／Trip memory。使用者在兩部手機驗收來源、投票與重複分享，Q1 核對證據 |
| **11/28** | 跑情境②。從已授權摘要或 App 的 AI Chat 取得祇園方向提案。Codex 依 D 模組驗證指定時段與交通，使用者在 A 的實機畫面示範 Keep original 和 Apply 的不同結果 |
| **11/29** | 跑情境③。使用者安排兩位已同意參與測試的實際成員完成跨端修改、確認、Save & finish、重開及匯出日曆；他們參與測試而非分攤開發。Q1 核對 §4 的重試與 409 案例 |
| **11/30** | 使用者邀請沒看過設計且自願參與的朋友，先只讀英文 User Flows，再自行走上述 2–3 個情境。記下哪一步需要提示、完成時間、手機型號、測試版號與實際結果，交 Q1 核對 |
| **12/01–02** | 12/01 由 Codex 在乾淨環境按英文 README 本機啟動，使用者安排實際受測者用釋出的測試版走一遍並提供證據。Q1 獨立核對，協調者凍結同一版本完成錄影、報告及 ZIP，12/02 由使用者提交 |

**若整合落後。** 先保住「分享能追來源、AI 可預覽與拒絕、兩端同版且逐人確認」三段操作。畫板 4 的上方時間帶可留作 A/B 比較，Manage 的進階管理操作依前述範圍排在核心驗收後。排程變動由 Codex 協調者記下受影響的 M2 情境、目前可操作部分及替代展示，Q1 核對對應證據。展示真實服務的步驟與合成測資要在報告標明。

**評估與交件。** 全部繳交材料均以英文撰寫或錄製。使用者提供約三份經同意的聊天；Codex 依 C 模組及 M2 評估計畫標記地點、偏好與重複分享，記錄正確率及虛構地點數（目標 0）。D 依實測紀錄整理受測者是否能辨認待審／已套用、可否拒絕，以及是否理解停止收集。使用者目標邀請 3–5 組自願參與的朋友作為真正使用者／受測者，報告寫實際組數、任務、預期／實際結果與限制，不將他們計為開發人力。使用者提供真機操作與英文解說錄影，A 彙編為 2–4 分鐘英文 MP4，給評閱者看到真實模型呼叫與人在兩端的決定。B 整理可本機重跑的程式 ZIP、英文 README、`.env.example`、帳號及安裝步驟，C、D 彙整 6–8 頁英文 PDF。Codex 協調者整合以上產物及測試版安裝連結與線上後端，Q1 逐項獨立核對影片、報告、程式與版號，使用者完成最終提交。[M3 作業規格](https://docs.google.com/document/d/1f_e977FQVdIpVFO7rHM773MVLVu1sZUJekJLDzXhDFg/edit) · [M2 互動原型](https://claude.ai/artifact/75jXxDxX1EwALYK2eui1Xs)

## 附錄 · 可直接交給 AI 的 TypeScript 契約

日期用 YYYY-MM-DD。每天的 `departAt` 是團體出發的時間，第一個停留點的 `start` 是抵達後開始造訪的時間。站點與交通出發時間用帶 UTC offset 的 ISO 8601 字串。所有 ID 為字串。stop ID 跨版本保持穩定。重新排序時傳完整的同日主線 stop ID，分組時以共同站點 ID 指定分開與集合位置。資料未知使用 null。當 `accepted` 為 null，新的規劃請求傳 `base.planVersion=0`。每個範例中的 `{t}`、`{p}`、`{j}` 都使用前一步取得的 ID 代入。

<details>
<summary>展開完整型別與模組函式簽名</summary>

```ts
// Waymark v1. These declarations are shared by the mobile app, Discord adapter and server.
export type Id = string
export type Actor = { memberId: Id } // Created by the server from an authenticated session or Gateway event.
export type Member = { id: Id; name: string }
export type MobileAuthStart = { state: string; code_challenge: string; code_challenge_method: 'S256' }
export type MobileAuthReturn =
  | { state: string; code: string }
  | { state: string; error: 'access_denied' }
export type MobileExchange = { code: string; code_verifier: string }
export type MobileSession = { tokenType: 'Bearer'; accessToken: string; expiresAt: string }
export type ReadScope =
  | { mode: 'from_now' | 'history' }
  | { mode: 'from_message'; messageId: Id }

// A summary selects raw messages inside the already authorized collection window.
export type SummaryRange =
  | { mode: 'from_reply' | 'from_here'; messageId: Id }
  | { mode: 'all_earlier' }
export type Reaction = 'heart' | 'check' | 'minus' | 'cross'
export type SavedSummary = {
  id: Id; range: SummaryRange; firstAt: string; lastAt: string; messageCount: number
  notes: { id: Id; state: 'decided' | 'undecided'; text: string; sourceIds: Id[] }[]
  poll: { id: Id; question: string; options: { id: Id; label: string; voterIds: Id[] }[] } | null
}
export type ImportState =
  | { status: 'queued' | 'running' | 'cancelled' | 'imported' | 'needs_details'; jobId: Id }
  | { status: 'failed'; jobId: Id; reason: string }
export type Source = {
  id: Id; authorId: Id; text: string; url: string | null; at: string
  origin?: 'app' | 'discord'
  importState?: ImportState
  sharedPost?: { url: string; platform: string; author: string | null; thumbnailUrl: string | null }
}
export type ScopedSource = {
  tripId: Id; epoch: number; source: Source
  media: { kind: 'link' | 'image' | 'video' | 'audio'; url: string }[]
}
export type Place = {
  id: Id; name: string; coordinates: { lat: number; lng: number } | null
  address?: string; city?: string
}
export type Candidate = {
  id: Id; label: string; state: 'unresolved' | 'resolved' | 'excluded'
  place: Place | null; choices: Place[]; sourceIds: Id[]
  votes: { memberId: Id; value: Reaction }[]
  notes?: { memberId: Id; text: string }[]
  tags?: string[]; description?: string
}
export type Preference = {
  id: Id; memberId: Id; text: string; confirmed: boolean; sourceIds: Id[]
}
export type MemorySnapshot = {
  summaries: SavedSummary[]
  revision: number; candidates: Candidate[]; preferences: Preference[]; sources: Source[]
}
export type MemoryEdit =
  | { kind: 'resolve'; candidateId: Id; placeId: Id }
  | { kind: 'add_place'; label: string; url?: string; placeId?: Id }
  | { kind: 'exclude'; candidateId: Id }
  | { kind: 'preference'; preferenceId: Id; text: string; confirmed: boolean }
  | { kind: 'vote'; candidateId: Id; value: Reaction | null }
  | { kind: 'set_candidate_note'; candidateId: Id; text: string | null }
  | { kind: 'edit_note'; summaryId: Id; noteId: Id; text: string }
  | { kind: 'vote_option'; summaryId: Id; pollId: Id; optionId: Id | null }

export type Mode = 'walk' | 'rail' | 'bus' | 'taxi' | 'bike' | 'drive'
export type RouteOption = {
  id: Id; minutes: number | null; fare: { amount: number; currency: string } | null
  transfers: number | null; steps: { mode: Mode; label: string; minutes: number | null }[]
}
export type Stop = {
  id: Id; candidateId: Id; start: string; end: string; sourceIds: Id[]
}
export type Leg = {
  fromStopId: Id; toStopId: Id; mode: Mode | 'transit'; minutes: number | null; route?: RouteOption
}
export type Branch = { memberIds: Id[]; stops: Stop[]; legs: Leg[] }
export type Day = {
  date: string; departAt: string; stops: Stop[]; legs: Leg[]
  split: { afterStopId: Id; branches: [Branch, Branch]; meetingStopId: Id } | null
}
export type Itinerary = { days: Day[] }
export type AcceptedPlan = { version: number; itinerary: Itinerary; confirmedBy: Id[] }
export type ManualChange =
  | { kind: 'add_stop'; date: string; candidateId: Id; start: string; end: string }
  | { kind: 'remove_stop'; stopId: Id }
  | { kind: 'retime'; stopId: Id; start: string; end: string }
  | { kind: 'retime_day'; date: string; departAt: string }
  | { kind: 'reorder'; date: string; stopIds: Id[] }
  | { kind: 'split'; date: string; split: Day['split'] }
  | { kind: 'choose_route'; fromStopId: Id; toStopId: Id; optionId: Id }
export type PlanContext = {
  date: string
  window?: { start: string; end: string }
  selectedOption?: { summaryId: Id; pollId: Id; optionId: Id }
}
export type PlanRequest =
  | { kind: 'draft'; instruction?: string; context?: PlanContext }
  | { kind: 'revise'; instruction: string; context?: PlanContext }
  | { kind: 'manual'; changes: ManualChange[] }
export type Base = { planVersion: number; memoryRevision: number }
export type Warning = { code: string; message: string; stopId?: Id }
export type Proposal = {
  id: Id; base: Base; status: 'pending' | 'accepted' | 'rejected' | 'stale'
  preview: Itinerary; differences: string[]; warnings: Warning[]; sourceIds: Id[]
}
export type PlanningOption = { id: Id; label: string; sourceIds: Id[] }
export type Outcome =
  | { kind: 'proposal'; proposalId: Id }
  | { kind: 'clarify'; question: string; options?: PlanningOption[] }
  | { kind: 'memory'; revision: number }
  | { kind: 'summary'; summaryId: Id; sourceIds: Id[] }
export type ApiError = { error: { code: string; message: string; current?: Base } }
export type Job =
  | { id: Id; status: 'queued' | 'running' | 'cancelled' }
  | { id: Id; status: 'succeeded'; result: Outcome }
  | { id: Id; status: 'failed'; error: ApiError['error'] }
export type JobRef = { jobId: Id }

export type TripInfo = {
  id: Id; name: string; channelId: Id; timezone: string; firstDate: string; lastDate: string
  creatorId?: Id; channelName?: string
  details?: { cities: string[]; stay: string | null; flights: string | null; pace: string[] }
}
export type TripView = {
  trip: TripInfo; members: Member[]; collection: 'inactive' | 'active' | 'paused'
  epoch: number; scope: ReadScope | null; memory: MemorySnapshot
  accepted: AcceptedPlan | null; pending: Proposal[]
}
export type NewTrip = Omit<TripInfo, 'id' | 'creatorId' | 'channelName'>
export type SyncCommand =
  | { kind: 'collect'; scope: ReadScope }
  | { kind: 'pause' }
  | { kind: 'edit_memory'; memoryRevision: number; edit: MemoryEdit }
  | { kind: 'decide'; proposalId: Id; action: 'apply' | 'reject' }
  | { kind: 'confirm' | 'unconfirm'; planVersion: number }
export type AsyncCommand =
  | { kind: 'summarize'; range: SummaryRange }
  | { kind: 'retry_import'; sourceId: Id }
  | { kind: 'plan'; base: Base; request: PlanRequest; replacesProposalId?: Id }
  | { kind: 'answer'; jobId: Id; text: string; optionId?: never }
  | { kind: 'answer'; jobId: Id; optionId: Id; text?: never }
export type Command = SyncCommand | AsyncCommand

// Session and event identity enter through B. Ports below run inside the shared server.
export interface TripPort {
  list(actor: Actor): Promise<TripInfo[]>
  forChannel(actor: Actor, channelId: Id): Promise<TripInfo | null>
  create(actor: Actor, input: NewTrip, key: Id): Promise<TripInfo>
  join(actor: Actor, tripId: Id, key: Id): Promise<TripView>
  view(actor: Actor, tripId: Id): Promise<TripView>
  proposal(actor: Actor, tripId: Id, proposalId: Id): Promise<Proposal>
  searchPlaces(actor: Actor, tripId: Id, query: string): Promise<Place[]>
  routeOptions(actor: Actor, tripId: Id, version: number, fromStopId: Id, toStopId: Id, modes: Mode[]): Promise<RouteOption[]>
  job(actor: Actor, tripId: Id, jobId: Id): Promise<Job>
  calendar(actor: Actor, tripId: Id, version: number): Promise<string>
  onMessage(channelId: Id, source: Source, media: ScopedSource['media']): Promise<JobRef | null>
  run(actor: Actor, tripId: Id, cmd: SyncCommand, key: Id): Promise<TripView>
  run(actor: Actor, tripId: Id, cmd: AsyncCommand, key: Id, discordSource?: Source): Promise<JobRef>
}
export type PlaceFacts = {
  placeId: Id; openingIntervals: { start: string; end: string }[] | null
}
export interface MemoryPort {
  ingest(input: ScopedSource): Promise<void>
  snapshot(tripId: Id): Promise<MemorySnapshot>
  edit(actor: Actor, tripId: Id, atRevision: number, edit: MemoryEdit): Promise<void>
  summarize(tripId: Id, range: SummaryRange, allowedSources: Source[]): Promise<Extract<Outcome, { kind: 'summary' }>>
  searchPlaces(tripId: Id, query: string): Promise<Place[]>
  facts(placeId: Id, date: string, timezone: string): Promise<PlaceFacts>
}
export interface TranscriptionPort {
  transcribe(input: { sourceId: Id; audio: Uint8Array }): Promise<{ text: string; sourceId: Id }>
}
export type GenerationInput = {
  trip: TripInfo; members: Member[]; memory: MemorySnapshot; accepted: AcceptedPlan | null
  request: PlanRequest; requestSourceId: Id; editing: Proposal | null
  answers: (Source & { selectedOption?: PlanningOption })[]
}
export type DraftResult =
  | { kind: 'drafted'; preview: Itinerary; sourceIds: Id[]; warnings: Warning[] }
  | { kind: 'patch'; changes: ManualChange[]; sourceIds: Id[]; warnings: Warning[] }
  | Extract<Outcome, { kind: 'clarify' }>
export interface PlannerPort {
  generate(input: GenerationInput): Promise<DraftResult>
}
export interface ReviewPort {
  accepted(tripId: Id): Promise<AcceptedPlan | null>
  pending(tripId: Id): Promise<Proposal[]>
  get(tripId: Id, proposalId: Id): Promise<Proposal>
  propose(tripId: Id, base: Base, draft: Exclude<DraftResult, {kind: 'clarify'}>, replacesProposalId?: Id): Promise<Proposal>
  decide(actor: Actor, tripId: Id, proposalId: Id, action: 'apply' | 'reject', key: Id): Promise<void>
  setConfirmation(actor: Actor, tripId: Id, version: number, confirmed: boolean, key: Id): Promise<void>
  calendar(tripId: Id, version: number): Promise<string>
}
export interface ModelPort {
  generate(input: {
    task: 'extract' | 'ground' | 'summarize' | 'draft' | 'revise'; instruction: string; text: string; images?: string[]
    jsonSchema: Record<string, unknown>
  }): Promise<unknown>
}
export interface RoutesPort {
  options(fromPlaceId: Id, toPlaceId: Id, departAt: string, modes: Mode[]): Promise<RouteOption[]>
}
```

</details>
