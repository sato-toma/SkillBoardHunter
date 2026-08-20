# SkillBoard Hunter 開発計画

## 1. 目的

SkillBoard Hunterは、自分が持っているスキルや、これから身につけたいスキルを可視化するためのアプリケーション。

将来的には、現在のスキルから目標までに必要なスキルを発見したり、他人のSkill Boardから新しいスキルや成長経路を見つけられるようにする。

### コンセプト

> **自分に必要なSkillを探す。**

---

## 2. 基本機能

### Skill

* Skillを登録する
* Skillの説明を登録する
* Skillの習熟度を設定する
* Skillに経験や成果物を紐付ける

### Goal

* 将来達成したい目標を登録する
* Goalに必要なSkillを定義する
* SkillからGoalまでの経路を表示する

### Skill Graph

* Skill同士の関係を表現する
* Skillをグラフとして可視化する
* 現在のSkillからGoalまでの経路を探索する
* 目標までの「あと何手」を表示する

### Sharing

* Skill BoardをExport / Importできるようにする
* 他人のSkill Boardを閲覧できるようにする
* 他人のSkillを自分のBoardへ取り込めるようにする

---

## 3. 開発方針

### Local First

* 基本的な機能は端末だけで利用できるようにする
* 中央サーバーを必須にしない
* オフラインでも利用できる構成を目指す

### User Owned Data

* ユーザー自身がデータを管理できるようにする
* 特定サービスへの依存を避ける
* 人間が読める形式でデータを保存する

### Server Optional

* 初期段階ではサーバーを持たない
* オンライン機能が必要になった場合のみサーバーを導入する

### Progressive Development

* 最小限の機能から開発する
* 必要性が確認できた機能から段階的に追加する
* 初期段階では複雑なGraph探索やP2P通信を実装しない

---

## 4. プラットフォーム・技術

### 対象

* Windows
* Android
* 将来的にiOS / iPhone

### 第一候補

* TypeScript
* React

### データ形式

* TOML

Skill Boardのデータは、可能な限り人間が直接読んだり編集したりできる形式として管理する。

---

## 5. MVP

最初のMVPでは、Skill Boardの最小単位だけを作る。

### MVP-0

まず、

> **Skillを1つ登録して表示できる**

ところまで作る。

* [ ] Skillを登録できる
* [ ] Skill名を表示できる
* [ ] Skillを削除できる
* [ ] Skillをローカルに保存できる

### MVP-1

Skillを複数登録し、自分のSkill一覧として扱えるようにする。

* [ ] 複数のSkillを登録できる
* [ ] Skillを編集できる
* [ ] Skillの説明を登録できる
* [ ] Skillを一覧表示できる
* [ ] TOMLとしてExportできる
* [ ] TOMLからImportできる

### MVP-2

Skill同士の関係を表現できるようにする。

* [ ] Skill同士を接続できる
* [ ] Skill Graphを表示できる
* [ ] Skillの関係をTOMLに保存できる

### MVP-3

「これから身につけたいSkill」を扱えるようにする。

* [ ] 習得済みSkillを設定できる
* [ ] 習得したいSkillを設定できる
* [ ] 未習得Skillを可視化できる

### MVP-4

GoalとSkillの関係を扱う。

* [ ] Goalを登録できる
* [ ] Goalに必要なSkillを設定できる
* [ ] 現在のSkillとの差分を表示できる
* [ ] Goalまでの経路を表示できる
* [ ] 「あと何手」を表示できる

---

## 6. データモデル

主要な概念：

* User
* Skill
* Goal
* SkillRelation
* Experience
* Evidence

特に以下を分離する。

* **Skill**：何ができるか
* **Experience**：何を経験したか
* **Evidence**：SkillやExperienceを示すもの
* **Goal**：これから達成したいこと

初期段階では必要最小限のデータモデルから開始する。

---

## 7. データ保存

初期段階ではサーバーを使用しない。

基本的なデータフロー：

```text
SkillBoard Hunter
    ↓
Local Data
    ↓
TOML
    ↓
Export / Import
```

将来的にオンライン共有を追加しても、ローカルデータを失わない設計を目指す。

---

## 8. 将来検討する機能

* Skill Graphの高度化
* Goalまでの経路探索
* 「あと何手」の計算
* 他人のSkill Board閲覧
* Skill BoardのImport
* Skill Boardの比較
* Skill BoardのFork
* AIによるSkill推薦
* GitHubとの連携
* OSS活動からのSkill推定
* P2PによるBoard交換
* マルチデバイス同期
* 多言語対応（i18n）

---

## 9. 未決定事項

以下は開発を進めながら決定する。

* [ ] Skillの粒度
* [ ] Skillの習熟度の定義
* [ ] Skill間の関係の種類
* [ ] Goalの定義
* [ ] 「あと何手」の計算方法
* [ ] Skillの正確性・証拠の扱い
* [ ] TOMLのデータ構造
* [ ] 他人のSkillをImportする方法
* [ ] 公開範囲
* [ ] オンライン機能の必要性
* [ ] P2P通信の必要性

---

## 10. 開発管理

GitHubでは役割を分けて管理する。

* `README.md`：プロジェクト概要
* `docs/development-plan.md`：開発計画
* `docs/roadmap.md`：開発状況と今後の予定
* `docs/ideas.md`：将来のアイデア
* `docs/decisions/`：重要な設計判断
* GitHub Issues：個別の開発タスク
* Pull Requests：実装とレビュー

---

## 11. 最初のゴール

最初に目指すのは、Skill GraphやGoalまで完成させることではない。

まず、

> **「Skillを登録して、自分のSkillとして保存できる」**

という最小限の体験を成立させる。

そこから、

```text
Skillを登録する
    ↓
Skillを保存する
    ↓
Skillを編集する
    ↓
Skill同士をつなぐ
    ↓
Skill Graphを見る
    ↓
習得したいSkillを登録する
    ↓
Goalを設定する
    ↓
Goalまでの道を見る
```

と段階的に発展させる。
