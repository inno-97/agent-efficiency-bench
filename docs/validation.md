# 과제 평가 도구 검증

이 결과는 에이전트 성능 측정이 아니라 fixture/evaluator 자체 검증입니다.

- 환경: macOS arm64, Node 22.23.4, Playwright 1.56.1, Chromium headless shell build 1194
- 명령: `npm run verify` (Node 22 런타임)

| 과제 | starter | 검증용 완성 코드 |
|---|---|---|
| web-build-l1-todo | 1/12 | 12/12 |
| web-fix-l1-todo-delete | 9/12 | 12/12 |

fix 실패는 logic/delete-by-id, ui/delete-active-filter, ui/delete-completed-filter입니다. 다른 기능은 통과합니다. CI는 같은 검증을 Ubuntu 24.04/Node 22에서 실행합니다. 플랫폼 간 결과 일치는 CI 결과를 별도로 확인해야 합니다.

검증용 완성 코드는 evaluation/fixtures에 있으며 실험 참가자에게 제공하지 않습니다. 이 결과를 에이전트 결과표에 포함하지 않습니다.
