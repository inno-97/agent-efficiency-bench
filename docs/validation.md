# 과제 평가 도구 검증

아래는 에이전트 성능 측정이 아니라 starter/reference와 평가 도구의 자체 검증입니다.

## 로컬 검증 환경

- 웹: macOS arm64, Node 22.23.4, Playwright 1.56.1, Chromium headless shell build 1194
- 모바일: 동일 호스트, JDK 17.0.15, Gradle 8.13, AGP 8.9.1, Android API 35 google_apis_playstore arm64 에뮬레이터
- 명령: `npm run verify`, `npm run verify:android -- emulator-5580`

| 과제 | starter | 검증용 완성 코드 |
|---|---|---|
| web-build-l1-todo | 1/12 | 12/12 |
| web-fix-l1-todo-delete | 9/12 | 12/12 |
| web-build-l2-expense-tracker | 0/12 | 12/12 |
| web-fix-l2-expense-summary | 8/12 | 12/12 |
| mobile-build-l1-habit-checker | 2/12 | 12/12 |
| mobile-fix-l1-habit-restore | 10/12 | 12/12 |
| mobile-build-l2-workout-log | 2/12 | 12/12 |
| mobile-fix-l2-workout-summary | 7/12 | 12/12 |

Android는 강제 종료 후 별도 instrumentation 프로세스에서 복원을 확인하며 해당 UI 검사에 반영합니다.

## 의도한 fix 실패

- Todo: ID 삭제 로직, 미완료/완료 필터 삭제 UI.
- 지출: update, year/month filter, year/category UI, edit/delete total UI.
- 습관: 저장 roundtrip, 재실행 복원 UI.
- 운동: update, volume, 생성/복원 합계 UI, 편집 상세/목록 UI, 날짜 이동 합계 UI.

검증 스크립트는 fix의 실패 검사 집합까지 확인합니다. 실패가 사라지거나 다른 회귀가 추가되면 자체 검증이 실패합니다.

## CI

GitHub Actions에서 웹은 Ubuntu 24.04/Node 22/Chromium, Android는 Ubuntu 24.04/JDK 17/API 35 google_apis x86_64 에뮬레이터로 동일한 검증을 실행합니다. 실행 결과는 저장소 Actions에서 확인할 수 있습니다.

reference는 evaluation/fixtures에 있으며 참가자에게 제공하지 않습니다. 해당 결과를 에이전트 순위표에 포함하지 않습니다. UI 검사는 기능 중심이며 시각적 디자인과 모든 가능한 오류를 보장하지 않습니다.
