# Agent Efficiency Bench

난이도별 웹·모바일 앱 신규 구현과 버그 수정 과제로 AI 코딩 에이전트의 **완성도·토큰·시간·사람 개입**을 비교하는 공개 벤치마크입니다.

> 상태: 웹·Android L1/L2의 build/fix 총 8개 과제와 공통 평가를 제공합니다. 자동 에이전트 실행·토큰 수집 및 실제 에이전트 측정 결과는 아직 없습니다.

## 목적

특정 에이전트 수나 제품에 제한 없이 CLI·모델·설정·단독/협업 구성을 비교합니다. 같은 품질에 도달하는 데 필요한 자원을 관측하고, 원하는 과제를 독립적으로 선택할 수 있게 합니다.

- `build`: 고정된 최소 시작 코드에서 명세에 따라 신규 구현
- `fix`: 결함이 포함된 고정 코드와 증상 설명으로 버그 수정
- 도메인: 우선 `web`, `mobile`. 이후 게임·CLI·자동화 등 확장
- 같은 과제·버전·조건 안에서 비교. 유형·도메인을 섞은 종합 순위는 제공하지 않음

## 바로 실행

[웹 실행 가이드](docs/quickstart.md) 또는 [Android 실행 가이드](docs/android.md)를 따라 독립 작업 폴더를 만든 뒤 에이전트에게 prompt.md를 전달하세요. 웹 평가는 `npm run evaluate -- <작업 폴더>`, Android 평가는 `npm run evaluate:android -- <작업 폴더> <에뮬레이터 serial>`입니다. 환경 준비는 각 가이드를 따릅니다.

## 문서

- [과제 목록과 로드맵](docs/tasks.md)
- [실행·평가 방법](docs/methodology.md)
- [난이도 기준](docs/difficulty.md) · [L1~L4 규모](docs/levels.md)
- [측정 규칙](docs/metrics.md)
- [실행 기록 양식](templates/run/report.md)
- [기여 안내](CONTRIBUTING.md)

## 현재 과제

웹·Android L1/L2 각각 build와 fix, 총 8개 과제를 제공합니다. build는 제공 UI와 환경에서 핵심 로직을 구현하는 과제입니다. L3/L4는 후속 기획이며 대규모 과제는 현재 범위에서 제외합니다.

기존 Team Issue Desk 기획은 웹 L4의 참고 방향으로만 활용합니다. 특정 제품의 분업 규칙을 공통 평가 기준에 넣지 않습니다.

## 구조

`benchmarks/<domain>/<type>/<task-id>/`에 과제를, `results/<task-id>/<run-id>/`에 결과를 둡니다. 각 과제는 metadata·spec·prompt·starter·고정 환경을 제공하며 독립 평가 테스트는 evaluation/에서 관리합니다.

라이선스는 아직 정하지 않았습니다.
