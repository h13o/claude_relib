# rosenka — スマホで「丁目レベルの土地相場」を一発で見る地図

住所を入れると、その周辺の**土地の取引価格**を地図に点で表示する単一HTMLです。
データは国土交通省 **[不動産情報ライブラリ](https://www.reinfolib.mlit.go.jp/)** の取引価格API（XPT001）。
スマホのホーム画面に置けば、毎回の「許諾クリック＋住所入力」なしで、**タップ→住所→相場**まで最短で着きます。

> このリポジトリは [claude_estate](https://github.com/h13o/claude_estate) の `rosenka/` アプリを、
> **GitHub Pages で公開する**ために単独リポジトリ（リポジトリ直下に `index.html`）として切り出したものです。

**公開URL（GitHub Pages）:** `https://h13o.github.io/claude_relib/`
（`?q=` を付ければ開いた瞬間にその地域へ：`https://h13o.github.io/claude_relib/?q=千葉市中央区`）

> ⚠️ まず大事な前提：**これは「相続税路線価そのもの」ではありません。**
> 無料・合法に地図へ重ねられる路線価のタイルは存在しない（国税庁の路線価図は画像/PDF＋ゼンリン著作権、本物の路線価タイルは有料API）ため、
> ここでは**実際の取引価格**を相場の当たり付けとして表示します。相続税路線価は一般に**公示地価のおおむね8割**・**取引相場よりやや低め**が目安なので、ポップアップに「路線価の目安（取引㎡単価×0.8）」も参考表示します。**正確な数字が要るときは**、ポップアップ下部のリンクから国税庁路線価図／全国地価マップで確認してください。

## できること

- 住所・地名・駅名で検索 → その地点へジャンプ（住所検索は地理院ジオコーダ＝無料・キー不要）
- 周辺の**土地（宅地）取引**を色分けの点で表示（🔴宅地(土地) / 🔵土地+建物）
- 点をタップ → 総額・**㎡単価**・面積・間口・前面道路・用途地域・建ぺい/容積・取引時期、と**路線価の目安(×0.8)**
- `?q=住所` のURLで**ダイレクトに開く**（ホーム画面ブックマーク向き）

## GitHub Pages での公開

このリポジトリには `.github/workflows/pages.yml` を同梱しており、`claude/rosenka-github-pages-1g8xjn` ブランチ（＝既定ブランチ）に push すると、
リポジトリ直下の `index.html` を **GitHub Actions が自動で GitHub Pages にデプロイ**します（Pages の有効化もワークフロー側で実施）。

- 初回の Actions 実行が成功すると `https://h13o.github.io/claude_relib/` で開けます。
- うまく出ない場合は **Settings → Pages → Build and deployment → Source = GitHub Actions** になっているか確認してください。

## セットアップ（5分）

### 1. APIキーを取得
[不動産情報ライブラリ API利用申請](https://www.reinfolib.mlit.go.jp/api/request/) からキー（Subscription Key）を発行します。無料です（以前取得済みならそれでOK）。

### 2. キーを貼る
`index.html` 冒頭の `CONFIG` を編集：

```js
const CONFIG = {
  API_KEY: "ここに発行されたキー",
  PROXY:   "",            // 通常は空。CORSで弾かれる場合のみ（下記）
  FROM:    "20231",       // 取引時期From  YYYYN（N=四半期 1〜4）
  TO:      "20264",       // 取引時期To
  LAND_TYPES: "01,02",    // 01=宅地(土地) / 02=土地と建物 / 07=中古マンション / 10=農地 / 11=林地
  ...
};
```

- **土地だけ**を見たいなら `LAND_TYPES: "01"`。戸建て（土地＋建物）も含めるなら `"01,02"`（既定）。
- `FROM`/`TO` は四半期コード。例：`20231`＝2023年1〜3月、`20262`＝2026年4〜6月。

### 3. 開く
- 手軽に試す：`index.html` をブラウザで直接開く（`file://`）。
- スマホで常用：上記 GitHub Pages の URL を**ホーム画面に追加**。`?q=` を付けたURLをブックマークすると、開いた瞬間にその地域へ。

## おすすめ構成：GASプロキシ（キーをブラウザに置かない）

ブラウザから不動産情報ライブラリAPIへ**直接** `fetch` するとCORSで弾かれることがあり、また `API_KEY` をブラウザに置くのも避けたい——という理由から、**Apps Scriptの薄いプロキシを1つ挟む**のがおすすめです。キーは **Script Property** に入れるので、リポジトリにもブラウザにも残りません。

このフォルダにデプロイ即用のファイルを同梱しています：

| ファイル | 内容 |
|----------|------|
| `proxy.gs` | 中継スクリプト本体（キーは Script Property `REINFOLIB_API_KEY` から読む） |
| `appsscript.json` | ウェブアプリ設定（実行=自分 / アクセス=全員 / 外部通信スコープ） |

### 手順（コピペ版）

1. [script.google.com](https://script.google.com/) → 新しいプロジェクト → `proxy.gs` の中身を貼り付け。
2. ⚙️ **プロジェクトの設定 → スクリプト プロパティ** に `REINFOLIB_API_KEY` ＝ 発行キー を追加。
   - キーを後で再発行したら、ここを差し替えるだけ（コード修正不要）。
3. （任意）関数 `testFetch` を実行 → 初回OAuth同意 → 実行ログに `HTTP 200` と中身が出れば疎通OK。
4. **デプロイ → 新しいデプロイ → ウェブアプリ**：実行＝**自分**、アクセス＝**全員**。発行された `…/exec` URLを控える。
5. `index.html` の `CONFIG.PROXY` に、**末尾 `?url=`** を付けて設定（`API_KEY` は空のままでOK）：

   ```js
   PROXY: "https://script.google.com/macros/s/XXXXXXXX/exec?url=",
   ```

### 手順（clasp版・CLI派向け）

```bash
npm i -g @google/clasp
clasp login                         # ブラウザで1回だけGoogle認証
clasp create --type webapp --title "rosenka-proxy" --rootDir .
# 生成された .clasp.json は手元のみ（コミット不要）
clasp push                          # proxy.gs / appsscript.json をアップロード
# ブラウザのプロジェクト設定で REINFOLIB_API_KEY を追加してから:
clasp deploy                        # ウェブアプリとしてデプロイ
```

> なぜ自分の操作が要るのか：GASは**あなたのGoogleアカウント内**にデプロイされ、`clasp login`／OAuth同意は本人のブラウザでしか行えません。コード・設定はこのリポジトリで用意済みなので、あなたの作業は「貼る／push → キーをプロパティに入れる → デプロイ」だけです。

## データの注意点（誤読を防ぐため）

- **点は「最寄り駅」の座標に集約**されます（番地ピンではない）。本APIの仕様上、同じ駅圏の取引が同一点に積み上がるため、地図上では駅周辺に固まって見えます。重なり緩和のため微小に散らして描画しています。
- 表示は**実際の取引/成約価格**であって、相続税路線価・公示地価ではありません。路線価の「目安」は `取引㎡単価 × 0.8` の粗い仮置きです。
- ㎡単価は、API側に単価があればそれを、無ければ `総額 ÷ 面積` で算出（土地＋建物は建物分を含むので土地単価より高めに出ます）。
- データは四半期更新で、直近期は反映が遅れることがあります。

## ファイル

| ファイル | 内容 |
|----------|------|
| `index.html` | 地図アプリ本体（Leaflet＋地理院タイル＋不動産情報ライブラリXPT001）。設定は冒頭`CONFIG`のみ |
| `proxy.gs` | GASプロキシ本体（キーは Script Property `REINFOLIB_API_KEY`）。CORS回避＋キー秘匿 |
| `appsscript.json` | GASウェブアプリ設定 |
| `.github/workflows/pages.yml` | GitHub Pages へ `index.html` を自動デプロイするワークフロー |

## 出典・ライセンス

- 取引価格：国土交通省「不動産情報ライブラリ」API（[利用規約](https://www.reinfolib.mlit.go.jp/help/)に従って利用）
- 背景地図：[地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)（出典表示が必要）
- 住所検索：国土地理院 住所検索API
