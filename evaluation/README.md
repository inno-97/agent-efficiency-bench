# Evaluation

- 웹: `npm run evaluate -- <candidate-directory> [report.json]`, `npm run verify`
- Android: `npm run evaluate:android -- <candidate-directory> <emulator-serial> [report.json]`, `npm run verify:android -- <emulator-serial>`

각 과제는 로직/모델 8개 + UI 4개. Android는 별도 프로세스 재실행 복원도 확인합니다. [웹 가이드](../docs/quickstart.md), [Android 가이드](../docs/android.md).

평가 코드는 에이전트 작업 공간 밖에 보관합니다. fixture는 평가 도구 검증용 정답이므로 참가자에게 제공하지 않습니다. 후보 코드 실행은 보안 샌드박스가 아니므로 전용 환경에서 실행하세요.

L3·L4: `workspace.mjs`는 별도 PostgreSQL 스키마/Next 서버/Chromium을, `android/advanced.mjs`는 외부 Kotlin instrumentation/강제 종료 및 L4 두 에뮬레이터를 사용합니다. `sync-server/`는 고정 평가 서버이며 에이전트 과제가 아닙니다. 자세한 실행은 [advanced.md](../docs/advanced.md)를 따릅니다.
