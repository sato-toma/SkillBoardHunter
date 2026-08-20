# Technical Issues

技術的な課題、未解決の設計論点、環境依存、検証できていないリスクを記録する。解決済みの項目も、後から判断理由を追える価値がある場合は残す。

## How to Use

- 実装中に判断を保留したら、その場で追加する。
- 次回作業の開始時に、`Open` と `Needs validation` を確認する。
- 解決したら、結論、関連ファイル、検証結果、日付を追記して `Resolved` にする。
- アーキテクチャ上の決定は、このログだけで完結させず `docs/decisions/` にADRを作る。

## Issue Template

### TI-0001: <短いタイトル>

- Status: Open
- Discovered: YYYY-MM-DD
- Context:
- Impact:
- Current understanding:
- Options considered:
- Next action:
- Revisit when:
- Related design/ADR:
- Resolution and validation:

## Open Issues

### TI-0001: 多言語対応（i18n）の導入タイミングと境界

- Status: Open
- Discovered: 2026-08-20
- Context: 多言語対応は必要だが、初回環境（MVP-0の最小導線）では必須ではない。
- Impact: 先にUI文字列を直書きすると、後で置換コストが増える可能性がある。
- Current understanding: MVP-0ではi18nライブラリを導入せず、機能価値の検証を優先する。
- Options considered:
	- A. MVP-0からi18n基盤を導入する
	- B. MVP-0は導入しない。MVP-1以降で導入する
- Next action: MVP-1のPlanフェーズでi18n導入範囲（UI文言、保存データ、テスト）を確定する。
- Revisit when: MVP-1開始時、または2言語以上のUI提供要件が確定した時点。
- Related design/ADR: `docs/development-plan.md`, `docs/detailed-design-mvp-0.md`
- Resolution and validation:

### TI-0002: TOMLパーサー選定とSemVer互換判定の実装方針

- Status: Open
- Discovered: 2026-08-21
- Context: TOML Import/Exportの初期設計は作成済みだが、実装ライブラリの選定が未確定。
- Impact: ライブラリ選定により、型安全性、エラーメッセージ品質、保守性が変わる。
- Current understanding: `formatVersion` はSemVerで管理し、major不一致を拒否する方針。
- Options considered:
	- A. `@iarna/toml` を採用する
	- B. 別の軽量TOMLライブラリを採用する
- Next action: MVP-1 Implementation開始前に1ライブラリを確定し、失敗時エラー分類を実装する。
- Revisit when: `docs/detailed-design-mvp-1-toml-io.md` のImplementation着手時。
- Related design/ADR: `docs/detailed-design-mvp-1-toml-io.md`
- Resolution and validation:

### TI-0003: ボード体験設計の未確定項目（レベル、実績、表示形式）

- Status: Open
- Discovered: 2026-08-21
- Context: 体験優先の方針でボード表示設計を開始したが、最終仕様の一部が未確定。
- Impact: レベル尺度や表示形式が未確定だと、UIと状態設計の手戻りが発生する可能性がある。
- Current understanding: MVP-1は体験優先で、TOML I/Oは将来課題として保留する。
- Options considered:
	- A. レベル1-5、実績はタイトル必須、フラットカード+関係表示
	- B. レベルをラベル制にし、グラフ表示を先行
- Next action: 実装開始前にレベル尺度、実績最小形、ボード表示形式を確定する。
- Revisit when: `docs/detailed-design-mvp-1-board-experience.md` のDetailed Design完了時。
- Related design/ADR: `docs/detailed-design-mvp-1-board-experience.md`, `docs/development-plan.md`
- Resolution and validation:

### TI-0004: 部分Import時の同一Skill判定ポリシー

- Status: Open
- Discovered: 2026-08-21
- Context: 他ユーザーのSkillを部分取り込みしたいが、自然言語名だけでは同一性を安全に判定できない。
- Impact: 誤マージが起きるとユーザーのSkill構造と実績が壊れる可能性がある。
- Current understanding: ユーザー内一意キーとして`canonicalSkillId`を持ち、name一致は候補提示に留める。
- Options considered:
	- A. `canonicalSkillId`一致を優先し、name一致は手動確定
	- B. name類似度で自動マージ
- Next action: MVP-1 Import UI実装前に候補提示条件と既定動作（マージ/新規）を確定する。
- Revisit when: `docs/detailed-design-mvp-1-board-experience.md` のDetailed Design完了時。
- Related design/ADR: `docs/detailed-design-mvp-1-board-experience.md`
- Resolution and validation:

### TI-0005: 外部実績連携による経験値自動加算ルール

- Status: Open
- Discovered: 2026-08-21
- Context: 習熟度を外部実績（GitHub、Xなど）で裏づけたい。将来は外部イベントで経験値を自動加算したい。
- Impact: 加算ルールが曖昧なままだと、過剰加算や重複加算で習熟度の信頼性が下がる。
- Current understanding: MVP-1は手動Evidence入力のみ実装し、自動加算は将来機能として設計拡張点だけ持つ。
- Options considered:
	- A. providerごとの固定加算値
	- B. イベント種別と量に応じた重み付け加算
- Next action: 自動加算実装前に、provider一覧、イベント種別、`sourceEventId`重複排除、加算上限を確定する。
- Revisit when: 外部連携機能のPlan開始時。
- Related design/ADR: `docs/detailed-design-mvp-1-board-experience.md`
- Resolution and validation:

### TI-0006: Goal起点ボードの進捗定義と表示ルール

- Status: Open
- Discovered: 2026-08-21
- Context: Goal/目指す世界/やりたいことをボード表示に含める方針を追加した。
- Impact: 進捗の定義が曖昧だと、Goal表示の意味がぶれてUI実装の手戻りが発生する。
- Current understanding: MVP-1ではGoalと関連Skillの可視化を優先し、経路計算はMVP-4へ分離する。
- Options considered:
	- A. Goal進捗を達成率バーで表示する
	- B. 未達の必要Skillリストで表示する
	- C. MVP-1では数値化せず関連情報表示のみにする
- Next action: Component設計前にGoal進捗の最小表示ルールを確定する。
- Revisit when: `docs/detailed-design-mvp-1-board-experience.md` のDetailed Design完了時。
- Related design/ADR: `docs/detailed-design-mvp-1-board-experience.md`
- Resolution and validation:
