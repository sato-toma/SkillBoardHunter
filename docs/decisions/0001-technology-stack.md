# ADR 0001: 初期の技術スタック

## Status

Accepted

## Context

SkillBoard Hunterは、Windowsで開発・利用を開始し、将来的にAndroid、iOSへ展開する。初期の中心機能は、サーバーを必要としないSkill Boardの編集とローカル保存である。

開発計画ではTypeScriptとReactを第一候補としており、データは将来的にTOMLとしてExport/Importする方針である。初期段階では、サーバーサイドレンダリングや認証、中央サーバーを前提にする必要はない。

## Decision

初期実装では、次の構成を採用する。

- UI: React
- 言語: TypeScript
- ビルド・開発サーバー: Vite
- 状態管理: Redux Toolkit + React-Redux
- 初期のローカル保存: Web Storageを抽象化した永続化層
- Webアプリ配布: 初期からPWAに対応する
- テスト: VitestとReact Testing Library
- 機能テスト: Playwright
- モバイル展開: 必要になった段階でCapacitorを追加する

Board全体の実行中の状態はRedux Storeで管理する。将来的にSkill一覧、Goal、Skill Graph、編集画面など複数の画面でBoardを共有するためである。責務は次のように分離する。

- Redux Store: 実行中のBoard状態と状態遷移を管理する
- Persistence Adapter: Board状態の保存と復元を担当する
- React Component: 表示とユーザー操作を担当する

React ComponentはBoard状態の正本を個別に保持せず、Redux Storeを参照する。Persistence AdapterはRedux ReducerやReact Componentから直接呼び出さず、定義した境界を介して利用する。Redux Reducerは副作用を持たない純粋な状態更新として保つ。フォーム入力やモーダルの開閉など、画面内だけで完結する一時状態はReactのローカル状態で管理する。

Web Storageは最終的なデータ保存先ではなく、初期段階で使うローカル永続化アダプターとして扱う。アプリケーションは永続化ポートを介してデータを読み書きし、ドメインロジックとポートはブラウザAPI、Capacitor API、将来のサーバーAPIに依存させない。これにより、Windowsのブラウザ/PWAでMVPを検証しながら、将来はWeb Storageの実装をIndexedDB、ファイル、またはWebサービスのAPIへ差し替えられるようにする。

永続化ポートとアダプターの具体的な構成は本ADRでは決定しない。ドメイン層から実行環境のAPIを分離するという原則のみを採用し、ポートの配置、同期・非同期API、保存単位、エラー契約、アダプターの選択方法は対象機能の詳細設計で決定する。

PWAは初期から採用する。Service Workerによるアプリケーション資産のキャッシュとWeb App Manifestを用いて、WindowsやAndroidでインストール可能なアプリに近い体験とオフライン起動を提供する。ただし、PWAのキャッシュはアプリデータの永続化とは別の責務として扱い、キャッシュ更新失敗時にユーザーデータを失わない設計とする。

### Capacitorとは

Capacitorは、Web技術で作ったアプリケーションをAndroid/iOSのネイティブアプリとして配布するためのランタイムとプラグイン基盤である。ReactのようなUIフレームワークではなく、WebViewで既存のWebアプリを動かし、必要に応じてカメラ、ファイル、通知などの端末機能をJavaScript/TypeScriptから利用できるようにする。

そのため、SkillBoard HunterではWindowsではブラウザまたはPWAとして利用し、モバイルアプリが必要になった段階で同じReact/TypeScriptのコードをCapacitorでAndroid/iOS向けにパッケージする。端末固有の処理はアプリケーション本体から分離したアダプター経由で提供する。

Next.jsは初期採用しない。現時点ではサーバー機能やSSRが主要要件ではなく、Viteの方がローカルファーストなクライアントアプリの開発・配布モデルに適しているためである。

## Trade-offs

### モバイル展開方式の比較

| 方式 | 利点 | 欠点 | 今回の判断 |
| --- | --- | --- | --- |
| PWA | Webアプリをそのまま配布でき、WindowsやAndroidでインストールとオフライン起動を提供できる | OSやブラウザによる機能差があり、Service Workerのキャッシュ更新を管理する必要がある | 初期から採用する |
| Capacitor | React/TypeScriptのUIとロジックを再利用しながら、必要なネイティブAPIを追加できる | WebView由来の性能・操作感の制約があり、Android/iOSのビルド環境と個別確認が必要 | モバイル展開の第一候補とする |
| React Native | ネイティブUIに近い体験と端末APIを得やすい | Web向けUIとの共有が難しく、既存のReact DOMアプリとは別の実装面が増える | 初期採用しない |
| Flutter | UIと実行環境を統一しやすく、性能も見込みやすい | Dartの導入が必要で、TypeScript/Reactの資産を直接再利用できない | 初期採用しない |

Capacitorを選ぶ主な理由は、初期の価値検証をWindowsのWebアプリに集中しつつ、Android/iOSへの展開時にUIとドメインロジックを大きく作り直さずに済むことである。一方、3D表示、複雑なアニメーション、長時間のバックグラウンド処理などが主要要件になった場合は、WebViewの制約が問題になり得るため、React NativeやFlutterを再評価する。

### 永続化方式の将来性

| 方式 | 利点 | 欠点 | 今回の判断 |
| --- | --- | --- | --- |
| Web Storage | ブラウザだけで利用でき、MVPの実装と検証が軽い | 容量、検索、障害復旧、ユーザーによる直接管理に制約がある | 初期のローカルアダプターとして採用する |
| IndexedDBまたはファイル | ローカルデータをより大きく扱え、Web Storageから段階的に移行できる | 実装と移行処理が増え、プラットフォーム差分も生じる | データ量や保存要件が増えた時点で検討する |
| WebサービスAPI | 複数端末同期、共有、サーバー側検索を実現できる | サーバー、認証、同期競合、障害対応が必要になる | 共有や同期を導入する段階で追加する |

将来Webサービスとして公開する場合も、Reactの画面やドメインロジックから直接Web Storageを呼び出さない。永続化ポートの契約を維持し、ローカルアダプターをWebサービスAPIアダプターへ置き換えることで、段階的な移行を可能にする。ローカルデータをサーバーへ移行する際は、TOML Export/Importまたは明示的な移行処理を経路として利用する。

### 未検討事項

- 永続化ポートをDomain層またはApplication層のどこに配置するか
- ポートを同期APIまたは非同期APIのどちらで定義するか
- Skill単位またはSkill Board単位のどちらで保存するか
- 保存データのバージョン、マイグレーション、エラーの契約をどう定義するか
- Web Storage、Capacitor、WebサービスAPIのアダプターを実行時にどう選択するか
- Reduxと永続化・非同期処理を接続するMiddlewareをどうするか。Redux-Sagaを有力候補とするが、Redux Toolkit Listener MiddlewareやThunkと比較して詳細設計で決定する

Middlewareの選定では、ローカル保存だけでなく、将来のWebサービスAPI、通信失敗時の再試行、同期処理、認証、複数アクションにまたがるワークフローを扱う可能性を判断材料にする。Redux-Sagaの利用経験は学習・保守コストを下げる要因として考慮する。一方、MVP-0の単純な保存処理に対してはRedux-Sagaが過剰になる可能性もあるため、採用を本ADRでは確定しない。

### 機能テスト方式の比較

| 方式 | 利点 | 欠点 | 今回の判断 |
| --- | --- | --- | --- |
| Playwright | Chromium、Firefox、WebKitを同じAPIで検証でき、複数ページ、複数コンテキスト、トレース、スクリーンショットに対応する | ブラウザ実行環境の管理が必要で、テスト設計と実行時間が単体テストより重い | Web/PWAの機能テストに採用する |
| Cypress | 開発中の画面確認がしやすく、失敗時のデバッグ体験がよい | ブラウザ外部の操作や複数タブなど、一般的なブラウザ自動化に制約がある | 初期採用しない |
| WebdriverIO/Selenium | 多様なブラウザ、既存の実機・リモートブラウザ環境に対応しやすい | 設定と実行基盤が重く、MVPのWeb/PWA検証には過剰になりやすい | 初期採用しない |
| Puppeteer | Chromiumの自動化が軽く、Node.js/TypeScriptから扱いやすい | FirefoxやWebKitを含む横断検証には向かず、Playwrightと比べて機能テスト基盤の選択肢が狭い | 初期採用しない |

Playwrightは、Windows上のViteアプリとPWAの主要ユーザーフロー、再読み込み後の復元、複数ブラウザでの表示を検証するために採用する。VitestとReact Testing Libraryは単体・コンポーネントテスト、Playwrightは実ブラウザを使う機能テストという役割分担にする。将来CapacitorのネイティブAPIやストア配布を実機で検証する場合は、Playwrightだけで完結させず、Appium、Maestro、Detoxなどを別途比較する。

### 状態管理方式の比較

| 方式 | 利点 | 欠点 | 今回の判断 |
| --- | --- | --- | --- |
| React local state | MVP-0のような小さな画面状態を最小のコードで扱える | 複数画面でBoard状態を共有しにくく、状態遷移と永続化の責務が分散しやすい | フォームやモーダルなど画面内状態に限定する |
| React Context | 追加ライブラリなしで共有状態を提供できる | 複雑な更新、派生状態、デバッグ、テストの整理に工夫が必要になる | Board全体の主状態には採用しない |
| Redux Toolkit + React-Redux | Board全体の状態遷移をAction/Reducerとして明示でき、複数画面で共有しやすくテストしやすい | MVP-0では初期設定や定型コードが過剰になり得る | Board全体の状態に採用する |

Redux ToolkitはMVP-0の規模だけを見ると過剰になる可能性がある。ただし、将来のBoard拡張を見据えて状態遷移、永続化境界、テスト対象を早期に統一できるため採用する。状態量や画面数が増えず、Reduxの運用コストが効果を上回ると判明した場合は、この判断を再評価する。

## Consequences

### Positive

- ブラウザだけでMVPを素早く検証できる
- オフライン中心の構成を保ちやすい
- WindowsやAndroidでインストール可能なアプリに近い体験とオフライン起動を提供できる
- 永続化ポートを維持したまま、ローカル保存からWebサービスAPIへ段階的に移行できる
- React/TypeScriptの経験をそのまま活用できる
- Android/iOS向けのネイティブ配布を後から追加できる
- Redux Toolkitにより状態更新と永続化の境界を明確にできる
- Board全体を複数画面で共有しながら、画面内の一時状態は局所化できる

### Negative

- PWAのService Worker、キャッシュ更新、ブラウザごとの差異を検証・運用する必要がある
- Capacitor追加時に、ファイルアクセスやバックアップなどの実装を見直す必要がある
- Android向けの開発はWindowsで進められるが、iOS向けのビルド、署名、実機検証には通常macOSとXcodeが必要になる
- Web Storageは大規模データや複雑な検索には向かない
- Webサービスへの移行時には、認証、同期競合、通信失敗、データ移行、サーバー障害への対応が必要になる
- SSRが必要な共有機能を追加する場合は、別途サーバー構成を検討する必要がある
- MVP-0の規模ではRedux Store、Slice、Providerなどの初期構成が過剰になり得る

## Revisit conditions

次の条件に達したら、この判断を見直す。

- Skill Boardのデータ量がWeb Storageの制約に近づいた
- ローカルデータを複数端末で同期またはWeb上で共有する要件が確定した
- Android/iOSのファイル操作や通知など、Web APIだけでは不足する機能が必要になった
- 他人のBoard閲覧や共有でサーバー機能が必要になった
- 実機でのオフライン動作にPWAでは不足があると判明した
- Boardの画面数や状態量が増えず、Redux Toolkitの複雑さが利点を上回ると判明した