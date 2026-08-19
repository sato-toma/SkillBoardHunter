# Architecture Decision Records

このディレクトリには、後から変更される可能性がある重要な技術・構成上の判断を記録する。

## ADRのルール

- 1つのADRは1つの判断に集中させる。
- `Status` は `Proposed`、`Accepted`、`Superseded`、`Deprecated` のいずれかを使う。
- Context、Decision、Alternatives、Trade-offs、Consequences、Revisit conditionsを記録する。
- 判断を変更するときは既存ADRを書き換えず、新しいADRを追加して旧ADRを `Superseded` にする。
- 詳細な機能設計はADRではなく `docs/detailed-design-template.md` を使う。
