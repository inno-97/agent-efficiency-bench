# 과제 목록

아래 L1~L4 16개 과제는 v1.0.0 ready입니다. 공통 평가의 시작점·완성 코드 동작을 검증했으며, 실제 에이전트 성능 측정은 아직 없습니다.

| 도메인 | 레벨 | 유형 | 과제 ID | 범위 |
|---|---|---|---|---|
| web | L1 | build | web-build-l1-todo | Todo 기본 로직 |
| web | L1 | fix | web-fix-l1-todo-delete | 필터 상태의 ID 삭제 |
| web | L2 | build | web-build-l2-expense-tracker | 지출 CRUD·월/분류·합계 |
| web | L2 | fix | web-fix-l2-expense-summary | 연도 필터·수정 후 금액 |
| mobile | L1 | build | mobile-build-l1-habit-checker | 날짜별 습관 체크 |
| mobile | L1 | fix | mobile-fix-l1-habit-restore | 재실행 후 완료 기록 복원 |
| mobile | L2 | build | mobile-build-l2-workout-log | 목록·상세·편집·운동량 |
| mobile | L2 | fix | mobile-fix-l2-workout-summary | 수정 반영·운동량 집계 |
| web | L3 | build | web-build-l3-bookmark-library | 인증·소유권·북마크 |
| web | L3 | fix | web-fix-l3-bookmark-library | 인증·소유권·북마크 |
| web | L4 | build | web-build-l4-team-issue-board | 프로젝트·작성자 권한·이슈 |
| web | L4 | fix | web-fix-l4-team-issue-board | 프로젝트·작성자 권한·이슈 |
| mobile | L3 | build | mobile-build-l3-offline-notes | 오프라인 메모·사진 파일 보존 |
| mobile | L3 | fix | mobile-fix-l3-offline-notes | 오프라인 메모·사진 파일 보존 |
| mobile | L4 | build | mobile-build-l4-synced-checklist | 오프라인 체크리스트·두 기기 동기화 |
| mobile | L4 | fix | mobile-fix-l4-synced-checklist | 오프라인 체크리스트·두 기기 동기화 |

L1/L2 웹은 HTML/CSS/JavaScript ES modules, 모바일은 Java/Views입니다. L3/L4 웹은 TypeScript/Next.js/PostgreSQL, 모바일은 Kotlin/Compose/Room입니다. 공통 Node22, JDK17, Android API35를 사용합니다. 각 task.json에서 환경과 예산을 확인합니다.

- [웹 실행 가이드](quickstart.md)
- [Android 실행 가이드](android.md)
- [L1~L4 규모와 후속 기획](levels.md)
- [L3·L4 확정 기술 스택](stack.md)
- [평가 도구 검증 결과](validation.md)

build는 제공 UI/환경에서 핵심 로직을 구현하는 과제입니다. fix의 정답·원인은 참가자에게 제공하지 않으며, spec.md의 증상만 제공합니다. 평가자 저장소에는 reference가 있으므로 에이전트의 접근을 제한하세요.

iOS, 게임·CLI·자동화 및 다른 기술 스택은 planned입니다. L3·L4 실행은 [별도 가이드](advanced.md)를 따릅니다.
