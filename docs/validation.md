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

## L3·L4 자체 검증 (2026-11-12)

Docker PostgreSQL17, TypeScript/Next.js와 Kotlin/Compose/Room을 사용했습니다. Android L4는 API35 에뮬레이터 두 대를 사용했습니다.

| 과제 | starter | 검증용 정답 |
|---|---|---|
| web-build-l3-bookmark-library | 0/19 | 19/19 |
| web-fix-l3-bookmark-library | 16/19 | 19/19 |
| web-build-l4-team-issue-board | 0/22 | 22/22 |
| web-fix-l4-team-issue-board | 19/22 | 22/22 |
| mobile-build-l3-offline-notes | 0/17 | 17/17 |
| mobile-fix-l3-offline-notes | 14/17 | 17/17 |
| mobile-build-l4-synced-checklist | 1/15 | 15/15 |
| mobile-fix-l4-synced-checklist | 11/15 | 15/15 |

- 웹: HTTP 인증/세션 만료·로그아웃·소유권·멤버 제거·작성자 권한·입력·CRUD·브라우저·서버 재시작.
- 메모: Room·검색/태그·사진 복사/취소/실패/교체/삭제·Compose·강제 종료 후 파일/DB 보존.
- 동기화: 오프라인/네트워크 실패·응답 유실 후 동일 요청 재전송·서버 우선 충돌·삭제 tombstone·실제 두 기기 반영·Compose·강제 종료 후 대기열/세션 복원.
- 고정 서버: 인증/격리·동시 CAS 한 건 승인·idempotency 키 오용·삭제 후 복구 차단·서버 재시작 별도 검증 통과.

[검사별 실패 목록과 요약 JSON](../evaluation/validation/l3-l4.json)을 제공합니다. 레벨별 검사 수가 다르므로 통과 개수와 토큰을 레벨 사이에서 직접 합산하지 않습니다. 이것은 평가 도구 자체 검증이며 에이전트 성능·토큰 사용량 결과가 아닙니다. 실제 사진 공급자 전체, 장기간의 WorkManager 스케줄링, 실서비스 보안/운영/부하는 검증 범위 밖입니다.

CI의 Verify L3 L4 benchmark tasks는 Ubuntu24.04에서 웹/고정 서버 및 API35 x86_64 에뮬레이터 두 대로 같은 검증을 실행합니다. 최신 CI 상태는 Actions를 확인하세요.
