# 실행과 테스트: 웹 L1 Todo

현재 실행 가능한 과제는 `web/build/l1-todo`, `web/fix/l1-todo-delete` 두 개입니다. 모바일/L2는 준비 전입니다.

## 1. 평가자 환경 준비

Node.js 22 LTS, npm, Git이 필요합니다. 평가자는 신뢰하는 로컬 코드만 실행하세요. evaluator는 보안 샌드박스가 아닙니다.

```sh
git clone https://github.com/inno-97/agent-efficiency-bench.git
cd agent-efficiency-bench
nvm use  # nvm을 사용하는 경우
npm ci
npx playwright install chromium --only-shell
```

Linux에서 시스템 라이브러리가 부족하면 `npx playwright install --with-deps chromium --only-shell`을 사용합니다. 설치에는 네트워크가 필요하지만 Todo 실행과 평가는 로컬에서 진행됩니다. OS·Node·브라우저 버전을 결과에 기록하세요.

## 2. 독립 작업 폴더 만들기

아래 명령은 저장소 루트에서 실행합니다. 새 실행마다 다른 빈 폴더를 사용하세요. build/fix 중 하나를 선택합니다.

```sh
TASK=benchmarks/web/build/l1-todo
# 버그 수정은 대신: TASK=benchmarks/web/fix/l1-todo-delete
WORK=../todo-build-run-01
mkdir "$WORK"
cp -R "$TASK/starter/." "$WORK/"
cp "$TASK/spec.md" "$TASK/prompt.md" "$TASK/acceptance.md" "$TASK/task.json" "$WORK/"
git -C "$WORK" init -b main
git -C "$WORK" add .
git -C "$WORK" commit -m 'benchmark: fixed starting point'
```

WORK 경로는 두 실험 사이 공유하지 않습니다. 원본 저장소 커밋과 작업 폴더 시작 커밋을 기록합니다. 에이전트는 WORK만 작업 공간으로 사용합니다. 이 저장소에는 정답 fixture가 있으므로 평가자 저장소 접근 권한을 부여하지 마세요. 단순히 폴더를 분리하는 것만으로 OS 접근이 차단되지는 않습니다. 사용 도구의 sandbox 설정 또는 별도 환경으로 제한하고 실제 접근 범위를 기록합니다.

## 3. 시작 화면 직접 확인

평가자 저장소 루트에서:

```sh
node tools/serve.mjs ../todo-build-run-01 4173
```

출력된 `http://127.0.0.1:4173`을 브라우저에서 엽니다. Ctrl+C로 서버를 종료합니다. build는 화면만 있고 기능이 미완성이며, fix는 삭제 결함이 있습니다. 완성 전 실패하는 것이 정상입니다.

## 4. 에이전트에게 맡기기

별도 터미널에서 WORK 폴더를 열고 원하는 에이전트를 실행하세요. prompt.md 내용을 첫 요청으로 전달합니다. 동일 비교에서는 모델 외 조건, 시간 예산(기본 전체 경과 30분), 권한, 네트워크, 규칙·스킬을 맞춥니다.

- 실행 전에 시간과 도구가 제공하는 사용량을 기록합니다.
- 완료 보고를 받으면 최초 제출 커밋을 보존합니다.
- 토큰 자동 수집은 아직 없습니다. 에이전트가 제공하는 원본 세션 로그/사용량 보고서를 이용하고, 얻지 못한 항목은 null로 기록합니다.
- 최초 제출 후 독립 평가를 실행하고, 실패 결과만 전달해 최대 2회 수정합니다. 30분 예산에는 수정도 포함합니다. 사람/한도 대기는 별도 기록합니다.
- 반복 실행은 새 폴더·새 세션으로 시작합니다. 다른 실행의 해결 방법을 전달하지 않습니다.

## 5. 공통 테스트 실행

에이전트가 종료하거나 작업을 멈춘 뒤 평가자 저장소 루트에서 실행합니다. 평가 대상은 커밋해 고정한 작업 폴더여야 합니다.

```sh
npm run evaluate -- ../todo-build-run-01 ../todo-build-run-01-report.json
```

8개 로직 검사와 4개 Chromium UI 검사를 수행합니다. 각 UI 검사는 새 브라우저 context로 localStorage를 격리합니다. 결과 JSON의 total/passed와 각 실패 내역을 확인하세요.

| 종료 코드 | 의미 |
|---|---|
| 0 | 12개 모두 통과 |
| 1 | 인수 기준 실패. JSON에 검사별 원인 출력 |
| 2 | import·브라우저 설치·서버 시작 등 평가 오류. 환경/계약 문제를 해결하고 재실행 |

12/12여야 완료입니다. 정답 fixture 통과는 평가 도구 검증용이며 에이전트 성능 결과가 아닙니다. 기준 검사는 UI 외관이나 모든 가능한 결함까지 보장하지 않습니다.

## 6. 결과 기록

```sh
mkdir -p results/web-build-l1-todo/my-agent-run-01
cp templates/run/report.md results/web-build-l1-todo/my-agent-run-01/report.md
cp ../todo-build-run-01-report.json results/web-build-l1-todo/my-agent-run-01/evaluation.json
```

fix는 task ID를 `web-fix-l1-todo-delete`로 바꿉니다. 양식에 모델·설정·시간·원본 사용량·최초/최종 커밋을 채우고 비밀값을 제거한 증빙을 첨부합니다. 결과 폴더의 이름만 바꿔 가짜 예시를 실제 측정처럼 올리지 마세요.

## 유지보수자: 평가 도구 자체 검증

```sh
npm run verify
```

두 starter의 실패와 reference 구현의 12/12 통과를 확인합니다. fix starter는 삭제 관련 검사 3개만 실패해야 합니다. 이 명령은 임시 폴더만 수정하며 starter는 변경하지 않습니다.

## 자주 발생하는 문제

- `Executable doesn't exist`: `npx playwright install chromium --only-shell`을 실행하세요.
- `ERR_MODULE_NOT_FOUND`: 루트에서 `npm ci`를 실행하고 대상 todo.js가 있는지 확인하세요.
- 포트 사용 중: 수동 서버의 마지막 인자를 다른 포트로 바꾸세요. evaluator는 자동으로 빈 포트를 사용합니다.
- 로컬 실행 권한/Chromium sandbox 오류: 평가 환경의 브라우저·로컬 소켓 실행 권한을 확인하세요.

- Node 26에서 고정 Playwright 버전의 브라우저 압축 해제가 지연되면 `.nvmrc`의 Node 22로 설치하세요. 이 저장소의 지원·CI 런타임은 Node 22입니다.
