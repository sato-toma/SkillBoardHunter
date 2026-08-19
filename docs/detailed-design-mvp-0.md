# Detailed Design: MVP-0 Skill登録

## Status

Draft

## Phase Status

| Phase | Status | Evidence or link |
| --- | --- | --- |
| Plan | Complete | `docs/development-plan.md` MVP-0 |
| Change Scope | Complete | This document |
| Detailed Design | Draft | Saga and persistence contract remain open |
| Implementation | Not started |  |
| Unit Test | Not started |  |
| Functional Test | Not started |  |

## Related Documents

- Development plan: `docs/development-plan.md`
- Development workflow: `docs/development-workflow.md`
- Technology ADR: `docs/decisions/0001-technology-stack.md`
- Technical issues: `docs/technical-issues.md`

## Goal

Skillを1件登録し、自分のSkillとして表示・削除できる最小体験を成立させる。ブラウザを再読み込みしても登録内容を復元できる状態を目指す。

## Scope

### In scope

- Vite + React + TypeScriptの開発環境
- Redux ToolkitによるBoard状態の管理
- Skill名の入力と登録
- 登録済みSkillの表示
- Skillの削除
- Web Storageを使ったローカル保存と復元
- PWAの基本設定
- Vitest、React Testing Library、Playwrightのテスト基盤

### Out of scope

- Skillの説明、習熟度、経験、Evidence
- Goal、Skill Graph、SkillRelation
- TOML Import/Export
- Capacitorによるネイティブアプリ化
- Webサービス、認証、複数端末同期
- 複雑な保存競合やバックグラウンド同期

## Confirmed Requirements

- Skill名を入力して登録できる
- 登録したSkill名を一覧で表示できる
- 登録したSkillを削除できる
- ページを再読み込みしても保存済みSkillを復元できる
- Board全体の実行中状態はRedux Storeで管理する
- React Componentは表示とユーザー操作を担当する
- Persistence Adapterは保存と復元を担当する
- PWAは初期から採用する

## Assumptions

- MVP-0のSkill名は空文字を受け付けない
- Skill名の前後空白は登録前に除去する
- 同名Skillの扱いは、初期実装では重複を許可する
- IDはアプリケーション側で生成し、保存データにも含める
- 初期保存データはBoard全体をJSONとしてWeb Storageへ保存する

## Open Questions

実装前に仕様決定が必要な項目。未回答のまま永続化処理とRedux非同期接続の実装には進まない。

- ReduxとPersistence Adapterを接続するMiddlewareはRedux-Saga、RTK Listener Middleware、Thunkのどれにするか
  - 判断材料: 将来の再試行、同期、認証、複数アクションのワークフロー、既存のSaga経験、MVP-0の実装コスト
  - Owner: プロダクトオーナー
  - Decision point: Detailed Design完了前
- 永続化ポートをDomain層またはApplication層のどこに置くか
  - 判断材料: Domainの純粋性、ユースケースとの近さ、将来アダプターの差し替えやすさ
  - Owner: プロダクトオーナー
  - Decision point: Persistence Adapter実装前
- 永続化ポートを同期APIまたは非同期APIのどちらで定義するか
  - 判断材料: Web Storageの簡単さと、IndexedDB・Capacitor・WebサービスAPIへの移行性
  - Owner: プロダクトオーナー
  - Decision point: Persistence Adapter実装前

## User Flow and Acceptance Criteria

1. アプリを開く。
2. Skill名を入力する。
3. 登録操作を行う。
4. 一覧にSkill名が表示される。
5. 削除操作を行う。
6. 一覧からSkillが消える。
7. ページを再読み込みする。
8. 保存済みのSkillが復元される。

Acceptance criteria:

- [ ] 空文字だけでは登録されない
- [ ] 有効なSkill名を登録すると一覧に表示される
- [ ] 登録したSkillを削除できる
- [ ] 登録後の再読み込みでSkillが復元される
- [ ] 削除後の再読み込みでも削除状態が維持される
- [ ] 保存に失敗した場合、ユーザーに失敗を伝えられる
- [ ] PWAとしてアプリ資産をキャッシュし、オフライン起動を確認できる

## Data Model and Persistence

MVP-0の実行中Boardは次の最小形を想定する。

```ts
type Skill = {
  id: string;
  name: string;
};

type SkillBoard = {
  version: 1;
  skills: Skill[];
};
```

具体的なPersistence Portの配置、同期・非同期API、保存単位、エラー契約は、未解決の設計事項を決定してから確定する。ドメインとRedux ReducerはWeb Storage APIへ直接依存しない。

## Implementation Design

### Module Boundaries

- `domain`: SkillとBoardの型、名前の検証
- `store`: Redux Store、Slice、Reducer、Selectors
- `application`または`persistence`: Persistence PortとWeb Storage Adapter。配置はOpen Questionsの決定後に確定する
- `components`: 入力、一覧、削除操作、エラー表示
- `app`: StoreとAdapterを組み立てるComposition Root

### State and Data Flow

```text
React Component
    -> Redux Action
    -> Redux Store / Reducer
    -> Persistence boundary
    -> Web Storage Adapter
```

Reducerは副作用を持たない。ComponentはWeb Storageを直接呼び出さない。

### Error Handling

- 空のSkill名は登録せず、入力欄またはフォームにエラーを表示する
- Web Storageへの保存・復元に失敗した場合は、ユーザーに再試行可能なエラーを表示する
- 不正な保存データはそのまま画面状態へ流さず、初期状態へフォールバックするかエラー表示する方針を、Persistence Portのエラー契約とともに確定する

### Platform Considerations

- Windows/Web: Chromium系ブラウザで開発・機能テストする
- PWA: Manifest、Service Worker、オフライン起動を確認する
- Android/iOS: MVP-0ではCapacitorを導入せず、将来の追加対象とする

## Test Strategy

### Unit Tests

- Skill名の空文字・空白入力を拒否する
- Skill生成時にIDが設定される
- Reducerが登録・削除のActionで期待する状態を返す
- 保存データの復元と不正データの扱い
- Persistence Adapterの保存・取得・削除失敗

### Component or Integration Tests

- Skill名を入力して登録できる
- 一覧に登録内容が表示される
- 削除操作で一覧から消える
- エラー状態が画面に表示される

### Manual Verification

- 開発サーバーでMVP-0の主要フローを操作する
- ページ再読み込み後に登録内容が残ることを確認する
- PWAとしてインストール可能であることを確認する
- ネットワークを切断してオフライン起動を確認する

### Functional Test

- Playwrightで登録、表示、削除、再読み込み後の復元を検証する
- PWAのManifestとService Workerが生成・登録されることを確認する
- 少なくともChromiumで実行し、必要に応じてFirefoxとWebKitを追加する

### Regression Risks

- Service Workerの古いキャッシュが新しいアプリ資産を隠す可能性
- Web Storageの保存失敗でReduxの状態と保存状態が不一致になる可能性
- Redux非同期接続の選択によってエラー処理とテスト方法が変わる可能性

## Rollout and Recovery

- 初期データの保存キーとBoardバージョンを固定する
- 不正な保存データは復元処理で検出する
- PWAのキャッシュ更新でアプリ資産を失っても、Boardデータの保存領域とは分離する

## Trade-offs

| Option | Benefits | Costs or risks | Decision |
| --- | --- | --- | --- |
| Redux Toolkit + Web Storage Adapter | 将来の複数画面共有とMVPのローカル保存を両立できる | Redux接続と永続化の設計が必要 | 採用 |
| React local state + Web Storage | 最小実装になる | 将来のBoard共有で状態管理を組み直す可能性がある | 不採用 |
| Redux-Saga | 既存経験を活かせ、将来の複雑な非同期ワークフローに対応しやすい | MVP-0には過剰になる可能性がある | 未決定 |
| RTK Listener Middleware / Thunk | MVP-0を軽量に実装しやすい | 将来の複雑なワークフローで再評価が必要 | 未決定 |

## Implementation Checklist

- [ ] Open Questionsを解決する
- [ ] ADRを更新する
- [ ] Vite + React + TypeScript環境を作成する
- [ ] Redux StoreとBoard型を実装する
- [ ] Persistence PortとWeb Storage Adapterを実装する
- [ ] Skill登録・表示・削除UIを実装する
- [ ] PWA設定を実装する
- [ ] Unit Testを追加する
- [ ] PlaywrightによるFunctional Testを追加する
- [ ] Validation commandsを実行する
- [ ] Technical Issuesを更新する
