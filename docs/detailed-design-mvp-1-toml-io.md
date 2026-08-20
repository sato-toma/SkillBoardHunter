# Detailed Design: MVP-1 TOML Import/Export

## Status

Deferred

## Phase Status

| Phase | Status | Evidence or link |
| --- | --- | --- |
| Plan | Complete | `docs/development-plan.md` MVP-1 |
| Change Scope | Complete | This document |
| Detailed Design | Deferred | Experience-first方針により実装保留 |
| Implementation | Not started |  |
| Unit Test | Not started |  |
| Functional Test | Not started |  |

## Related Documents

- Development plan: `docs/development-plan.md`
- Development workflow: `docs/development-workflow.md`
- MVP-0 design: `docs/detailed-design-mvp-0.md`
- Technical issues: `docs/technical-issues.md`

## Goal

SkillBoardのデータをTOMLとしてExport/Importできるようにし、将来の拡張でも安全に読める互換ルールを最初に定義する。

この設計は将来の実装準備として保持し、現時点では体験づくりを優先する。

## Scope

### In scope

- SkillBoardのTOMLデータ構成（初期版）
- SemVerベースのフォーマットバージョン規約
- Import時の互換判定ルール
- Export時の正規化ルール（並び順、必須キー）
- エラー分類（無効TOML、非対応バージョン、必須キー欠落）

### Out of scope

- UIデザインの詳細
- ファイル選択UIの最終仕様
- GoalやSkill Graphを含む拡張データ
- 暗号化や署名

## Confirmed Requirements

- TOMLでExportできる
- TOMLからImportできる
- 人間が読める構造を優先する
- Import時にバージョン互換を判定できる
- 非互換データは安全に拒否し、ユーザーへ理由を表示する

## Assumptions

- MVP-1時点のSkillは `id`, `name`, `description` を持つ
- `description` は未設定を許可する
- 保存単位はBoard全体
- Importは全置換（mergeしない）

## Open Questions

- TOMLパーサーをどれにするか（例: `@iarna/toml` など）
  - Owner: プロダクトオーナー
  - Deadline or decision point: Implementation開始前

## User Flow and Acceptance Criteria

1. ユーザーがExportを実行する。
2. アプリが現在のBoardをTOML文字列へ変換する。
3. ユーザーがTOMLを保存またはコピーできる。
4. ユーザーがTOMLをImportする。
5. 互換判定と検証が成功した場合、Boardを更新する。
6. 失敗した場合、理由を表示して現在のBoardを維持する。

Acceptance criteria:

- [ ] ExportされたTOMLは必須キーをすべて含む
- [ ] 同一majorのformatVersionはImport成功する
- [ ] formatVersionのmajor不一致はImport失敗し、理由を表示する
- [ ] 無効TOMLはImport失敗し、現在状態を維持する
- [ ] Import成功時、再読み込み後も同じBoardが復元される

## Data Model and Persistence

### TOML data shape (v1.0.0)

```toml
[meta]
format = "skillboard"
formatVersion = "1.0.0"
exportedAt = "2026-08-21T00:00:00Z"

[board]
id = "default"

[[skills]]
id = "skill-ts"
name = "TypeScript"
description = "Type-safe JavaScript"
```

### SemVer policy for `meta.formatVersion`

- MAJOR: 破壊的変更。旧実装で安全に解釈できない
- MINOR: 後方互換な追加。旧実装は未知キーを無視して読み込み可能
- PATCH: 構造を変えない軽微修正

### Import compatibility rules

- `format` が `skillboard` 以外なら失敗
- `formatVersion` がSemVerとして不正なら失敗
- `supportedMajor !== incomingMajor` なら失敗
- `incomingMajor === supportedMajor` なら許可
- 未知キーは無視する（ただし必須キー欠落は失敗）

### Runtime mapping (current app)

- TOML `skills[].id` -> domain `Skill.id`
- TOML `skills[].name` -> domain `Skill.name`
- TOML `skills[].description` -> domain `Skill.description`（未設定なら空文字へ正規化）

## Implementation Design

### Module Boundaries

- `domain`: SkillBoard型、変換前後の検証ルール
- `application`: Import/Export use case、互換判定、エラー型
- `persistence`: TOML serializer/parser adapter
- `store/saga`: Import/Export actionと副作用接続
- `components`: Import/Export操作とエラー表示

### State and Data Flow

```text
Export:
Redux state -> application export use case -> TOML serializer -> UI

Import:
UI input/file -> TOML parser -> compatibility + validation -> Redux action -> save
```

### Error Handling

- `invalid-toml`: TOML構文エラー
- `unsupported-format`: format不一致
- `unsupported-version`: major不一致
- `invalid-schema`: 必須キー欠落や型不一致
- 失敗時はBoardを変更しない

### Platform Considerations

- Windows/Web: 文字列コピーとファイルダウンロードで運用可能
- Android/Capacitor: 将来のファイルAPIアダプター差し替えを想定
- iOS: 同上。初期はWeb同等の導線を優先

## Test Strategy

### Unit Tests

- SemVer parseと互換判定
- TOML -> domain の検証
- domain -> TOML の必須キー出力
- invalid-toml / unsupported-version / invalid-schema の分岐

### Component or Integration Tests

- Import成功で一覧が更新される
- Import失敗でエラー表示され、一覧が維持される

### Manual Verification

- Export文字列が読みやすいTOMLであること
- Import後に再読み込みして同じ状態が復元されること

### Regression Risks

- MINOR追加時に旧実装が未知キーを誤処理する可能性
- SemVer文字列の厳密判定が弱いと壊れたデータを受理する可能性

## Rollout and Recovery

- 初期サポートは `formatVersion` major=1 のみ
- 非対応バージョンは拒否し、Board無変更を保証する
- 将来major更新時はマイグレーション関数を追加する

## Trade-offs

| Option | Benefits | Costs or risks | Decision |
| --- | --- | --- | --- |
| SemVerでformatVersion管理 | 互換ルールが明確で拡張しやすい | 互換判定実装が必要 | 採用 |
| 整数版（schemaVersion=1） | 実装が簡単 | minor/patchの意図を表しにくい | 不採用 |
| Importをmergeする | 既存データ保持しやすい | 競合解決が複雑になる | 不採用（MVP-1は全置換） |

## Implementation Checklist

- [x] Plan: scope, priority, and initial acceptance criteria confirmed
- [x] Change Scope: affected modules, data, platforms, and risks identified
- [ ] Detailed Design: open questions resolved and design approved
- [ ] Update ADR if the architecture changes
- [ ] Implementation: production code completed
- [ ] Unit Test: focused unit tests added and passing
- [ ] Functional Test: acceptance criteria verified
- [ ] Run validation commands and record results
- [ ] Record remaining technical issues
