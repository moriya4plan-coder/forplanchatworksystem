# Chatwork 一括既読 | For-Plan Edition

Chatwork公式APIを使って全ルームを一括既読にするChrome拡張機能です。

---

## セットアップ（管理者・初回のみ）

### 1. GitHubリポジトリの準備

1. GitHubで **プライベートリポジトリ** を作成（名前: `chatwork-readall`）
2. このフォルダの中身を全部アップロード
3. `manifest.json` の `YOUR_GITHUB_USERNAME` を自分のGitHubユーザー名に置き換え
4. `update.xml` の `YOUR_GITHUB_USERNAME` を同様に置き換え

### 2. 拡張機能IDを取得してupdate.xmlに設定

1. Chromeで `chrome://extensions/` を開く
2. デベロッパーモードON
3. 「パッケージ化されていない拡張機能を読み込む」→ このフォルダを選択
4. 表示された **拡張機能ID**（32文字のアルファベット）をコピー
5. `update.xml` の `YOUR_EXTENSION_ID` に貼り付け
6. GitHubに再度アップロード（push）

### 3. ZIPをGitHubに置く

```
# ターミナルで実行
zip -r chatwork-readall.zip chatwork-readall/
```
作成したZIPをGitHubリポジトリのルートにアップロード。

---

## 社員への配布（初回のみ手動）

1. GitHubからZIPをダウンロードして解凍
2. `chrome://extensions/` → デベロッパーモードON
3. 「パッケージ化されていない拡張機能を読み込む」→ 解凍フォルダを選択
4. **以降はChromeが自動更新**（数時間〜1日以内に反映）

---

## バージョンアップ手順（管理者）

1. ファイルを修正
2. `manifest.json` の `"version"` を上げる（例: `"2.0.0"` → `"2.1.0"`）
3. `update.xml` の `version` も同じ番号に合わせる
4. ZIPを再作成してGitHubにアップロード（push）
5. 社員のChromeが自動で検知・更新（何もしなくてOK）

---

## 使い方

1. Chatworkのサービス設定ページでAPIトークンを発行
   https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php
2. 拡張機能アイコンをクリック → トークンを入力して「保存」
3. 「すべて既読にする」ボタンを押すだけ

---

## ファイル構成

```
chatwork-readall/
├── manifest.json       # 拡張機能設定（update_url含む）
├── update.xml          # 自動更新用バージョン管理
├── popup.html          # ポップアップUI
├── popup.js            # APIロジック
├── content.js          # （最小限）
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```
