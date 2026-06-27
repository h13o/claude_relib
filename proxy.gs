/**
 * rosenka 地図アプリ用の薄いプロキシ（不動産情報ライブラリ API 中継）。
 *
 * 役割:
 *   ブラウザ(index.html) → 本スクリプト(doGet) → 不動産情報ライブラリ API
 *   ・APIキーを Ocp-Apim-Subscription-Key ヘッダで付与
 *   ・ブラウザのCORS制限を回避（GASウェブアプリは外部から取得可能）
 *
 * 秘密の扱い（gchat/Code.gs と同じ流儀）:
 *   APIキーはコードに直書きせず、Script Property `REINFOLIB_API_KEY` に保存する。
 *   → リポジトリにキーが残らない。
 *
 * セットアップは rosenka/README.md を参照。
 *   1. このコードを Apps Script に貼る（or clasp push）
 *   2. プロジェクトの設定 → スクリプト プロパティに REINFOLIB_API_KEY = 発行キー
 *   3. デプロイ → ウェブアプリ（実行=自分 / アクセス=全員）
 *   4. 発行URLの末尾に ?url= を付けて index.html の CONFIG.PROXY に設定
 */

function getApiKey_() {
  var key = PropertiesService.getScriptProperties().getProperty('REINFOLIB_API_KEY');
  if (!key) {
    throw new Error('Script Property "REINFOLIB_API_KEY" が未設定です（README参照）');
  }
  return key;
}

function doGet(e) {
  var target = (e && e.parameter) ? e.parameter.url : '';

  // 中継先は不動産情報ライブラリのみに限定（オープンプロキシ化を防ぐ）
  if (!target || target.indexOf('reinfolib.mlit.go.jp') < 0) {
    return json_({ error: 'forbidden: url パラメータが不正です' });
  }

  var res = UrlFetchApp.fetch(target, {
    headers: { 'Ocp-Apim-Subscription-Key': getApiKey_() },
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    return json_({ error: 'upstream ' + code, body: res.getContentText().slice(0, 300) });
  }
  // 取得した GeoJSON をそのまま返す
  return ContentService
    .createTextOutput(res.getContentText())
    .setMimeType(ContentService.MimeType.JSON);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 疎通テスト: プロパティのキーで札幌のタイルを1枚取得してログに出す */
function testFetch() {
  var url = 'https://www.reinfolib.mlit.go.jp/ex-api/external/XPT001'
    + '?response_format=geojson&z=14&x=14624&y=6016&from=20252&to=20252';
  var res = UrlFetchApp.fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': getApiKey_() },
    muteHttpExceptions: true,
  });
  Logger.log('HTTP ' + res.getResponseCode());
  Logger.log(res.getContentText().slice(0, 500));
}
