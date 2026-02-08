# Extension Loading Instructions / 拡張機能の読み込み方法

## 問題の説明 / Problem Description

この修正は以下の問題を解決します：
This fix resolves the following issues:

1. **マニフェストファイルエラー / Manifest File Error**
   - エラーメッセージ: "マニフェスト ファイルが見つからないか読み取れません"
   - Error message: "Manifest file not found or cannot be read"

2. **日本語の文字化け / Japanese Character Encoding Issues**
   - 日本語テキストが□や文字化けで表示される問題
   - Japanese text displaying as boxes or garbled characters

## 解決方法 / Solution

Chrome拡張機能の国際化（i18n）構造を適切に実装しました：
Properly implemented Chrome extension internationalization (i18n) structure:

- `manifest.json`内で直接UTF-8文字を使用する代わりに、`__MSG_*__`プレースホルダーを使用
- `_locales/`ディレクトリ構造を作成
- 日本語（ja）と英語（en）のメッセージファイルを追加
- `default_locale`フィールドを`manifest.json`に追加

Instead of using UTF-8 characters directly in `manifest.json`, we:
- Use `__MSG_*__` placeholders
- Created `_locales/` directory structure
- Added Japanese (ja) and English (en) message files
- Added `default_locale` field to `manifest.json`

## 拡張機能の読み込み方法 / How to Load the Extension

### ステップ 1: Chrome拡張機能ページを開く / Step 1: Open Chrome Extensions Page

ブラウザのアドレスバーに以下を入力：
Enter the following in your browser's address bar:

```
chrome://extensions/
```

または / Or:
- メニュー → その他のツール → 拡張機能
- Menu → More Tools → Extensions

### ステップ 2: デベロッパーモードを有効化 / Step 2: Enable Developer Mode

右上隅の「デベロッパーモード」トグルをONにします。
Turn ON the "Developer mode" toggle in the top-right corner.

### ステップ 3: 拡張機能を読み込む / Step 3: Load the Extension

1. 「パッケージ化されていない拡張機能を読み込む」ボタンをクリック
   Click the "Load unpacked" button

2. このディレクトリを選択：
   Select this directory:
   ```
   /home/runner/work/Debate-AI-Extension-Chorme/Debate-AI-Extension-Chorme
   ```

3. 拡張機能が正常に読み込まれるはずです！
   The extension should load successfully!

### ステップ 4: 確認 / Step 4: Verify

拡張機能が正常に読み込まれたことを確認：
Verify the extension loaded correctly:

- ✅ エラーメッセージが表示されない / No error messages appear
- ✅ 拡張機能リストに「AIディベート拡張機能」が表示される / "AIディベート拡張機能" appears in the extension list
- ✅ アイコンが正しく表示される / Icons display correctly
- ✅ 日本語テキストが正しく表示される（文字化けなし）/ Japanese text displays correctly (no mojibake)

## トラブルシューティング / Troubleshooting

### エラーがまだ表示される場合 / If You Still See Errors

1. **ファイルの確認 / Verify Files**
   ```bash
   ls -la manifest.json
   ls -la _locales/ja/messages.json
   ls -la _locales/en/messages.json
   ```

2. **JSONの検証 / Validate JSON**
   ```bash
   python3 -m json.tool manifest.json
   python3 -m json.tool _locales/ja/messages.json
   python3 -m json.tool _locales/en/messages.json
   ```

3. **エンコーディングの確認 / Check Encoding**
   ```bash
   file -bi manifest.json
   file -bi _locales/ja/messages.json
   ```
   結果は `charset=utf-8` または `charset=us-ascii` であるべきです。
   Results should show `charset=utf-8` or `charset=us-ascii`.

4. **Chromeのキャッシュをクリア / Clear Chrome Cache**
   - 拡張機能ページで既存の拡張機能を削除
   - Chromeを再起動
   - 拡張機能を再度読み込む
   
   - Remove the existing extension from the extensions page
   - Restart Chrome
   - Load the extension again

## ファイル構造 / File Structure

正しいディレクトリ構造：
Correct directory structure:

```
Debate-AI-Extension-Chorme/
├── manifest.json                 # メインマニフェストファイル（i18nプレースホルダー使用）
├── _locales/                     # 国際化ディレクトリ
│   ├── ja/                       # 日本語（デフォルト）
│   │   └── messages.json        # 日本語メッセージ
│   └── en/                       # 英語（フォールバック）
│       └── messages.json        # 英語メッセージ
├── popup.html
├── popup.js
├── popup.css
├── background.js
├── content-chatgpt.js
├── content-gemini.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 技術的な詳細 / Technical Details

### 変更前 / Before

```json
{
  "name": "AIディベート拡張機能",
  "description": "AIシステム間のディベートを実現..."
}
```

**問題点：** Chromeは一部の環境でUTF-8文字を含むマニフェストファイルを読み込めないことがあります。
**Problem:** Chrome may fail to load manifest files containing UTF-8 characters in some environments.

### 変更後 / After

```json
{
  "name": "__MSG_extensionName__",
  "description": "__MSG_extensionDescription__",
  "default_locale": "ja"
}
```

**利点：**
**Benefits:**
- ✅ 環境に依存しない / Environment-independent
- ✅ Chrome推奨のベストプラクティス / Chrome-recommended best practice
- ✅ 複数言語サポートが容易 / Easy multilingual support
- ✅ 文字化けの問題を防ぐ / Prevents mojibake issues

## 参考資料 / References

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/manifest/)
- [Chrome Extension Internationalization (i18n)](https://developer.chrome.com/docs/extensions/reference/i18n/)
- [Chrome Extension Sample: Localized Hosted Apps](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/i18n)
