# Detailed Design: MVP-1 Board Experience

## Status

Draft

## Phase Status

| Phase | Status | Evidence or link |
| --- | --- | --- |
| Plan | Complete | User request 2026-08-21 |
| Change Scope | Complete | This document |
| Detailed Design | Provisional | Interaction model is recorded for further user validation |
| Implementation | Complete | Goal起点の表示＋Skillレベル縦切り |
| Unit Test | In progress | Redux状態遷移テストを追加。実行は未確認 |
| Functional Test | Not started |  |

## Related Documents

- Development plan: `docs/development-plan.md`
- Development workflow: `docs/development-workflow.md`
- MVP-0 design: `docs/detailed-design-mvp-0.md`
- Deferred TOML design: `docs/detailed-design-mvp-1-toml-io.md`
- Technical issues: `docs/technical-issues.md`

## Goal

Skillを単なる一覧ではなく「ボード」として見せ、次の情報を一目で理解できる体験を作る。

- 何を実現したいか（Goal / 目指す世界）
- 何ができるか（Skill）
- どの程度できるか（習熟レベル）
- それを示す実績（Evidence）
- Skill同士の親子関係（TRUNK/LEAF）
- 他ユーザーのSkillを部分的に取り込み、自分のBoardへ統合できる

Goalを先に置き、その達成過程として必要なSkillとEvidenceが積み上がる構造を可視化する。

## Scope

### In scope

- ボード表示（カードまたはノードのレイアウト）
- Goal/やりたいこと/目指す世界の表示
- Skillごとの習熟レベル表示
- Skillごとの実績表示
- 親子関係を持つSkill構造の表示
- GoalとSkillの関連表示（必要Skillの紐づけ）
- 最小の追加/編集UI（ボード体験確認に必要な範囲）
- 他ユーザーBoardからの部分取り込み（選択Import）
- 取り込み時の同一Skill判定フロー（自動候補 + 手動確定）

### Out of scope

- TOML Import/Export
- 完全自動の曖昧同一判定（自然言語だけで100%同一判定する処理）
- 複雑な経路探索アルゴリズム
- 複数ユーザー共有
- i18n本実装
- Goalまでの最短経路計算（MVP-4対象）

## Confirmed Requirements

- Goal（目標）をボード上に表示できる
- Goalに「目指す世界」「やりたいこと」の説明を持たせられる
- Skillをボードとして視覚的に表示する
- Skillに習熟レベルを持たせる
- Skillの証明として実績を表示する
- 実績は外部サービス（GitHub、Xなど）のリンクを添付できる
- 実績リンクから、何を積み上げたかをユーザーが読み取れる
- Skillは親子関係を持てる（TRUNKにもLEAFにもなれる）
- Goalに必要なSkillを紐づけて表示できる
- Goal達成に向けた進捗を、関連Skillの習熟度とEvidenceから読み取れる
- データ読み書きは将来課題として、現段階では体験を優先する
- 他ユーザーのSkillを部分的に取り込める
- 同一Skillはユーザー内で1件に統合できる運用を持つ
- 将来は外部連携イベントで経験値を自動加算できる拡張余地を持つ

## Assumptions

- 初期の習熟レベルは離散値（例: 1-5）とする
- 実績は最小構成としてタイトル + 外部リンクURLを扱う
- Goalは最小構成としてタイトル + 説明（目指す世界/やりたいこと）を扱う
- 親子関係は循環を許可しない
- 1つのSkillが親と子を同時に持つことを許可する
- 自然言語名だけで同一性を自動確定しない
- 同一性の最終決定はユーザー操作で確定できる
- 自動加算はMVP-1では実装せず、手動登録Evidenceのみ扱う

### Decisions for the first vertical slice

- 表示はGoalを起点にSkillを並べる2D投影とする。内部データと表示方式は分離し、将来の3D/4D表示を妨げない。
- 経験値はユーザー個人のSkill経験値として扱い、`level` は0-100の経験値を1-5へ変換して表示する。
- Skillの状態ラベルは `未経験`、`学習中`、`実践中`、`熟練` の固定値とする。自由タグと他ユーザーからの評価値は将来計画に残す。
- 今回の縦切りではGoalの表示、Skillの追加、経験値・レベル・状態ラベルの編集を対象とし、Evidence、親子編集、Importは後続とする。
- 既存MVP-0の保存データを読めるよう、新しいSkill属性は任意フィールドとして追加する。
- Skillの作成は `Skills` 画面に集約し、`Map` はSkillの配置・関係編集・詳細確認に専念する。
- 既存のQuestデータとRedux処理は保持するが、今回のナビゲーションではQuest画面を表示せず、同じ導線を `Skills` として扱う。

## Provisional Interaction Specification

This section records the current interaction direction. It is not a final product specification and must be validated through a runnable prototype before the next production implementation.

### Selected direction

Use a hybrid of two interaction models:

- **Tree model**: show parent-child and prerequisite relationships as a navigable tree. Selecting a node opens its details, including prerequisites, dependents, attainment, and related Goals.
- **Skill Board model**: use attainment earned by the user to satisfy prerequisites. A Skill remains locked until its prerequisites are satisfied; increasing its personal XP can unlock the next Skill or Goal.

The tree is the primary relationship model. The board is a progression view over the same nodes and relationships, not a separate data model.

### Core operation sequence

1. Select a Skill node in the tree or board.
2. Open the Skill detail view.
3. Inspect its prerequisites, dependent Skills, related Goals, current XP, and lock state.
4. Add or remove a prerequisite from the detail view.
5. Increase the user's XP for the selected Skill.
6. Recalculate dependent Skill and Goal lock states immediately.
7. Select an unlocked node and repeat the process.

### Interaction rules for the prototype

- A node click selects the node and keeps the detail view open.
- A blocked node explains which prerequisite is missing.
- XP belongs to the current user and is the input for unlocking.
- Relationship edits are explicit and reversible through add/remove controls.
- Goal unlock state is derived from the user's XP on its required Skills.
- The prototype should make dependent nodes and Goals visibly update after each XP or relationship change.

### Rejected for now

- A purely decorative graph where relationships cannot be inspected or edited.
- Editing relationships directly through small controls embedded in every card.
- Treating a Skill's general popularity or other users' evaluations as the user's personal attainment.

### Validation status

- Prototype A, Git Tree: represented by the in-app `Tree` mode and selected-node detail view.
- Prototype B, Skill Board: represented by the in-app `Board` mode and XP-based unlock flow.
- The standalone prototype page was removed after both interaction models were integrated into the product.
- User feedback: the Git Tree relationship experience is preferred, while the Skill Board lock and unlock progression is also preferred.
- Next validation: implement the hybrid interaction in the main app and verify node selection, detail inspection, prerequisite editing, XP changes, and Goal unlocking as one complete flow.

Until that validation is complete, this section remains provisional and may be revised without a data migration commitment.

## Open Questions

- 習熟レベルの将来の最終スケール（現在は1-5で実装）
  - Owner: プロダクトオーナー
  - Deadline or decision point: UI実装前
- 実績の最小データ形（今回の縦切りでは未実装）
  - Owner: プロダクトオーナー
  - Deadline or decision point: State設計前
- Skill自体の評価値と個人経験値の分離
  - Owner: プロダクトオーナー
  - Deadline or decision point: Component設計前
- 外部サービス連携時の加算式（イベント1件ごとに固定値 / 種別ごと重み）
  - Owner: プロダクトオーナー
  - Deadline or decision point: 自動加算機能のImplementation前
- 2D以外の表示形式（3D/4Dを含む）と投影ルール
  - Owner: プロダクトオーナー
  - Deadline or decision point: Component設計前
- 同一候補の提示条件（完全一致のみ / 類似一致を含む）
  - Owner: プロダクトオーナー
  - Deadline or decision point: Import UI実装前
- Goal進捗の見せ方（達成率バー / 未達項目リスト / ラベル）
  - Owner: プロダクトオーナー
  - Deadline or decision point: Component設計前

## User Flow and Acceptance Criteria

1. ユーザーがSkillを追加する。
2. ユーザーが習熟レベルを設定する。
3. ユーザーが実績を追加し、外部リンクを添付する。
4. ユーザーがGoal（目標）を追加し、目指す世界/やりたいことを入力する。
5. ユーザーがGoalに必要なSkillを紐づける。
6. ユーザーが親子関係を設定する。
7. ボード上でGoal、Skill、レベル、実績、関係を確認する。

Acceptance criteria:

- [ ] Skillカード（またはノード）に名前とレベルが表示される
- [ ] Skillカード（またはノード）に実績タイトルと外部リンクが表示される
- [ ] Goalカードにタイトルと説明（目指す世界/やりたいこと）が表示される
- [ ] Goalに紐づく必要Skillを確認できる
- [ ] 親子関係が視覚的に識別できる
- [ ] 親であるSkillが同時に子としても扱える
- [ ] 保存機能が未実装でも、1セッション内で体験検証できる
- [ ] 部分Import時に候補Skillへマージするか新規作成するかを選べる
- [ ] マージ後も親子関係と実績が破綻しない
- [ ] 将来の自動加算機能を追加しても、既存Evidence表示が壊れない

## Data Model and Persistence

最小の体験検証向けモデル（永続化形式は未確定）。

```ts
export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type Evidence = {
  id: string;
  title: string;
  provider: 'github' | 'x' | 'other';
  linkUrl: string;
  activityType?: string;
  achievedAt?: string;
  note?: string;
  sourceEventId?: string;
  xpDelta?: number;
};

export type SkillNode = {
  id: string;
  canonicalSkillId: string;
  name: string;
  aliases?: string[];
  level: SkillLevel;
  xp: number;
  evidence: Evidence[];
  parentSkillIds: string[];
  childSkillIds: string[];
  sourceRefs?: SkillSourceRef[];
};

export type SkillBoard = {
  version: 1;
  goals: GoalNode[];
  skills: SkillNode[];
};

export type SkillSourceRef = {
  sourceUserId: string;
  sourceBoardId: string;
  sourceSkillId: string;
  importedAt: string;
};

export type GoalNode = {
  id: string;
  title: string;
  vision?: string;
  intent?: string;
  requiredSkillIds: string[];
};
```

今回の実装では、既存MVP-0との互換性を保つため、現在の `Skill` に次の任意属性を追加する。

```ts
type Skill = {
  id: string;
  name: string;
  xp?: number; // 0-100, ユーザー個人の経験値
  level?: 1 | 2 | 3 | 4 | 5;
  status?: 'new' | 'learning' | 'practicing' | 'mastered';
};

type Goal = {
  id: string;
  title: string;
  vision?: string;
};
```

`xp` は20刻みでレベル1-5へ投影する。2DボードはGoalとSkillの現在状態を表示するビューであり、
将来の3D/4D表示は同じBoardデータに対する別の投影として追加する。

- Persistenceは将来課題のため、この段階ではランタイム状態のみを対象にする
- 既存MVP-0の保存層は壊さず、体験確認に必要な表示中心で段階導入する

### Proficiency and evidence model

- MVP-1では手動入力したEvidenceを表示し、`xp` は手動調整または簡易加算で扱う
- `level` は表示しやすさのため残し、`xp` から導く計算式は将来確定する
- 外部リンクは証明情報として表示するが、リンク先の内容検証までは行わない

### Goal-driven board model

- Goalはボードの起点情報として扱う
- SkillはGoal達成に必要な要素として紐づける
- EvidenceはSkillの裏づけ情報として表示し、Goalに対する進捗判断の材料にする
- MVP-1では計算済みの達成率は必須にせず、Goalと関連Skillの可視化を優先する

### Future automatic XP sync

- 対象例: GitHub commit / PR merge、X投稿
- MVP-1では未実装（設計上の拡張点のみ用意）
- 将来は `sourceEventId` で重複加算を防ぐ
- provider別に加算重みを持てる構造にする

### User-scoped uniqueness model

- `id`: 現在のBoard内でのノードID（UI操作や親子リンクで使用）
- `canonicalSkillId`: 「同一Skill」を表すユーザー内一意キー
- `name`: 表示名（自然言語、重複し得る）

この構成により、表示名は自由入力のままにしつつ、同一性は`canonicalSkillId`で管理する。自然言語だけで同一判定しない。

### Partial import merge rules

他ユーザーからSkillを部分Importする際の順序:

1. `sourceSkill.canonicalSkillId` が存在し、取り込み先に同じIDがある場合:
   - 同一としてマージ候補を提示（既定: マージ）
2. 1に該当しない場合:
   - `normalized(name)` の完全一致を候補として提示（自動確定はしない）
3. 候補がない場合:
   - 新規Skillとして追加

マージ時の最小ルール:

- `level`: 高い方を採用（履歴導入前の暫定）
- `evidence`: `id`重複を除外して結合
- 関係情報: 循環検証後に親子リンクへ反映。循環になるリンクはスキップして警告表示
- `sourceRefs`: 追記して取り込み元を保持

## Implementation Design

### Module Boundaries

- `domain`: SkillNode、GoalNode、Evidence、階層関係の検証（循環禁止など）
- `store`: 状態遷移（追加、編集、関係更新、Goal関連付け）
- `components`: ボード表示、Goal表示、編集UI、レベル表示UI
- `application/persistence`: このフェーズでは拡張最小。I/O機能は保留

### State and Data Flow

```text
UI action
  -> Redux action
  -> Reducer (state update)
  -> Board re-render
```

### Error Handling

- 無効な関係（自己参照、循環）は更新を拒否し、UIで通知する
- 実績の必須項目不足は保存せず入力エラーを表示する
- 実績リンクURLが不正な場合は登録しない
- レベル範囲外は受け付けない
- 同一候補が複数ある場合は自動確定せず、ユーザーに選択させる
- Importマージで循環が発生する場合は、そのリンクのみ拒否して他の取り込みは継続する

### Platform Considerations

- Windows/Webを最優先で体験検証
- Android/iOSは同一UI構造を維持できる設計にとどめる

## Test Strategy

### Unit Tests

- 関係更新時に循環を拒否する
- Skillの追加/更新/削除で整合性が維持される
- 親子関係の双方向整合（親追加時に子側も更新される）
- Goal作成と必要Skill紐づけの整合性を維持する
- 部分Import時に `canonicalSkillId` 一致ならマージ候補になる
- name一致のみの場合は候補提示に留まり、自動マージしない
- マージ時にevidence重複除外と循環リンク拒否が動作する

### Component or Integration Tests

- Skill追加でボードに表示される
- レベル変更で表示が更新される
- 実績追加でカードにタイトルと外部リンクが表示される
- Goal追加でボードに表示される
- Goalと必要Skillの関連表示が更新される
- 親子設定で関係表示が更新される
- 部分Import時に「マージ / 新規追加」を選択できる

### Manual Verification

- 複数Skillを追加して親子関係を作成
- 1つのSkillが親かつ子として表示されることを確認
- Goalを作成し、必要Skillと実績が読み取れることを確認
- 実績表示が読みやすいことを確認

### Regression Risks

- 関係更新ロジックが複雑化すると、双方向整合の破綻リスクがある
- GoalとSkillの関連更新で孤立参照（存在しないSkill ID）のリスクがある
- レベル・実績追加でカード密度が上がり、可読性が落ちる可能性
- 同一候補の誤判定で誤マージが起きるリスクがある
- 外部リンクの死活や内容変化で証明の信頼性が低下する可能性がある
- 将来の自動加算で過剰加算や重複加算が起きる可能性がある

## Rollout and Recovery

- まずは最小表示（名前+レベル）を有効化
- 次に実績表示を追加
- 最後に親子関係編集を追加
- 問題が出た場合は関係編集UIを一時無効化して表示のみ維持する

## Trade-offs

| Option | Benefits | Costs or risks | Decision |
| --- | --- | --- | --- |
| 体験優先でUI/状態を先行 | 早くユーザー価値を検証できる | 永続化と後で統合する作業が必要 | 採用 |
| 先にTOML入出力を実装 | 保存形式が早期確定できる | 体験改善が遅れる | 不採用（今は保留） |
| 関係を片方向のみ保持 | 実装が簡単 | 表示時の計算負荷と不整合が増える | 不採用 |

## Implementation Checklist

- [x] Plan: scope, priority, and initial acceptance criteria confirmed
- [x] Change Scope: affected modules, data, platforms, and risks identified
- [ ] Detailed Design: open questions resolved and design approved
- [ ] Update ADR if the architecture changes
- [x] Implementation: production code completed
- [ ] Unit Test: focused unit tests added and passing
- [ ] Functional Test: acceptance criteria verified
- [ ] Run validation commands and record results
- [ ] Record remaining technical issues

## Interaction Validation Record

### Interaction Validation: dependency and goal progression

- Prototype A: Tree. Select a Skill, then add or remove prerequisite Skills from the detail panel. Change XP and observe dependent Skills.
- Prototype B: Skill Board. Select a node, inspect blocked prerequisites, change attainment, and unlock the node when prerequisites are met.
- User-selected model: Combine both models. Use the Git Tree operation model for relationships and the Skill Board operation model for XP-based unlocking.
- Core action sequence: Select a node -> inspect its details -> edit prerequisites or XP -> see dependent and Goal unlock state update.
- Feedback after each action: Show the selected node, prerequisite list, blocked/unlocked state, XP, level, and Goal progress.
- Invalid or blocked action behavior: Prevent self-dependencies and keep a node locked while a prerequisite is below the unlock threshold.
- Undo or recovery behavior: Keep changes local to the selected operation and allow the user to reverse them by removing a prerequisite or lowering XP.
- Rejected alternatives: A purely decorative graph and inline-only checkbox editing were rejected because they do not make dependency impact easy to inspect.
- Verification method: Component or functional test for select -> edit relationship -> change XP -> observe dependent and Goal state.
