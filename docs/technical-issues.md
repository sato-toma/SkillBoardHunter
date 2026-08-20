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
