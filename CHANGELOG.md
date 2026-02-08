# Changelog

## Version 1.1.0 (2026-02-08)

### 新機能 (New Features)

1. **ペルソナ機能**
   - 各AI参加者にペルソナ（役割や性格）を設定できるようになりました
   - ペルソナは最初のメッセージに自動的に追加されます
   - 例: "あなたは哲学者です。深い洞察と論理的な議論を展開してください。"
   
2. **画面上の設定ボタン**
   - ChatGPTとGeminiのページに浮動設定ボタンが追加されました
   - ボタンをクリックすると設定へのアクセス方法が表示されます
   - ボタンは右下に配置され、ホバー時にアニメーションします

3. **タブ識別の改善**
   - 各AIページのインジケーターに参加者番号とAIタイプが表示されるようになりました
   - 例: "参加者1 (ChatGPT)" または "参加者2 (Gemini)"
   - どのタブがどの参加者かが一目でわかります

### 修正 (Fixes)

1. **双方向メッセージング**
   - AI 2からAI 1への応答が正しく送信されるように改善しました
   - 詳細なログを追加し、メッセージフローをデバッグしやすくしました
   - 応答検出ロジックを改善しました

### 改善 (Improvements)

1. **ログの強化**
   - すべてのメッセージ送信/受信イベントにログを追加
   - コンソールログを追加してデバッグを容易化
   - より詳細なエラーメッセージ

2. **UIの改善**
   - ペルソナ入力用のテキストエリアを追加
   - 設定ボタンのスムーズなアニメーション
   - インジケーターのレイアウト改善

---

## Version 1.0.0 (Initial Release)

### Features
- ChatGPT vs Gemini debate
- ChatGPT vs ChatGPT debate
- Gemini vs Gemini debate
- Customizable turn limits
- Adjustable delay between responses
- Activity logging
- Visual indicators
