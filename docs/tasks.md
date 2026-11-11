# 과제 목록

아래 L1·L2 8개 과제는 v1.0.0 ready입니다. 공통 평가의 시작점·완성 코드 동작을 검증했으며, 실제 에이전트 성능 측정은 아직 없습니다.

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

웹은 HTML/CSS/JavaScript ES modules + Node 22/Chromium, 모바일은 Java 17/Android native Views + API 35로 고정합니다. 각 task.json에서 환경과 예산을 확인합니다.

- [웹 실행 가이드](quickstart.md)
- [Android 실행 가이드](android.md)
- [L1~L4 규모와 후속 기획](levels.md)
- [L3·L4 확정 기술 스택](stack.md)
- [평가 도구 검증 결과](validation.md)

build는 제공 UI/환경에서 핵심 로직을 구현하는 과제입니다. fix의 정답·원인은 참가자에게 제공하지 않으며, spec.md의 증상만 제공합니다. 평가자 저장소에는 reference가 있으므로 에이전트의 접근을 제한하세요.

L3·L4, iOS, 게임·CLI·자동화는 planned입니다. ready로 표시하기 전 명세·고정 환경·starter/reference 평가 검증을 완료합니다.
