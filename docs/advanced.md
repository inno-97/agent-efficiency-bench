# L3·L4 실행과 측정

이 문서는 벤치마크 과제를 실행하는 방법입니다. 실제 서비스를 운영하거나 정답 예제를 에이전트에게 구현 참고자료로 제공하는 절차가 아닙니다. 검증 상태는 [validation.md](validation.md)를 확인하세요.

## 무엇을 비교하나요?

웹 북마크(L3)/팀 이슈(L4), Android 오프라인 메모(L3)/개인 체크리스트 동기화(L4)에 각각 build와 fix가 있습니다. UI·DB/SDK scaffolding을 제공하는 constrained build입니다. 웹은 `lib/service.ts`, Android는 `Repository.kt`가 주 작업 경계입니다. 에이전트가 API를 보존하며 필요 파일을 고치는 것은 허용합니다. 고정 서버·평가기는 수정하지 않습니다.

동일한 task ID/version/track/type의 서로 다른 에이전트 실행끼리 품질·토큰·시간·사람 개입을 비교합니다. L1/L2와 스택도 달라 순수 난이도 차이로 해석하면 안 됩니다. L3 120분/L4 180분(수정 최대2회 포함)은 초기 운영 예산이며 실제 측정으로 확정한 시간이 아닙니다.

## 공통 준비 — 측정 전에

[환경 준비](preparation.md)에 따라 Node22, Docker PostgreSQL, JDK17, Android SDK35를 준비합니다. Android SDK/에뮬레이터는 호스트에서 실행하고 DB는 Docker에서 실행합니다. 완전한 Docker 전용 Android 환경을 주장하지 않습니다.

```sh
npm ci
npm run env:init
npm run db:up
npm ci --prefix preparation/web
npx playwright install chromium
```

Node22가 기본 버전이 아니면 현재 터미널 PATH 맨 앞에 해당 설치 bin을 넣으세요. Mac 준비 환경은 `/opt/homebrew/opt/node@22/bin`입니다. DB 비밀번호는 `.env`에만 두고 결과 파일/에이전트 프롬프트에 복사하지 않습니다. `preparation/web`의 pg 패키지는 외부 평가기의 DB 격리 의존성입니다.

## 웹 과제

```sh
npm run prepare:task -- web-build-l3-bookmark-library /tmp/agent-run-bookmarks
npm run setup:web -- /tmp/agent-run-bookmarks
```

setup은 의존성 설치·Prisma 생성·별도 개발용 스키마 생성·seed를 수행합니다. 기존 candidate `.env`는 덮어쓰지 않습니다. 생성한 폴더를 독립 Git 저장소로 만들고, 그 폴더만 에이전트에게 열어 `prompt.md`를 전달하세요. 평가자 저장소·reference는 에이전트 작업공간/검색 경로에서 제외해야 합니다.

측정 전 후보 폴더에서 `npm run build` 및 `npm run dev` 실행 가능 여부를 확인합니다. build starter의501/TODO는 의도된 미완성 상태입니다. 설치·캐시·DB/seed 준비·평가기 검증 시간은 에이전트 작업 시간에서 제외합니다. 준비 완료 후 입력 프롬프트부터 타이머를 시작합니다.

작업 완료 후 평가자 저장소에서:

```sh
npm run evaluate -- /tmp/agent-run-bookmarks /tmp/bookmarks-result.json
```

평가기는 후보를 임시 폴더로 복사하여 빌드하고, `bench_<random>` PostgreSQL 스키마에 seed한 뒤 API/Chromium/서버 재시작 검사를 수행합니다. 후보의 개발 `.env`와 DB를 사용하거나 초기화하지 않습니다. 평가가 끝나면 자기 스키마만 제거합니다. `BENCH_DATABASE_URL`로 평가 전용 DB를 지정할 수도 있습니다(이 계정에 schema create/drop 권한 필요). 출력은 검사별 통과와 오류이며 토큰 추정치는 만들지 않습니다.

L4 웹도 동일 명령에 ID `web-build-l4-team-issue-board` 또는 fix ID를 선택합니다. seed 계정은 alice/bob/carol@example.test, 비밀번호 benchmark-password이며 폐기 가능한 로컬 테스트 전용입니다.

## Android 과제

API35 에뮬레이터를 명시해서 사용합니다. 물리 기기는 평가 대상이 아닙니다. 평가기는 `bench.app`와 `bench.app.test`를 설치하고 테스트 데이터를 초기화합니다. 이 패키지에 개인 데이터를 저장하지 마세요.

```sh
npm run prepare:task -- mobile-build-l3-offline-notes /tmp/agent-run-notes
# 후보 폴더에서 측정 전에 Gradle/SDK 의존성을 캐시
cd /tmp/agent-run-notes
sh gradlew assembleDebug
```

그 후 후보만 에이전트에게 제공하고 작업을 측정합니다. 평가자 저장소에서:

```sh
npm run evaluate:android -- /tmp/agent-run-notes emulator-5580 /tmp/notes-result.json
```

L3는 Room·CRUD·검색·태그·파일 복사/실패/취소/교체/삭제·Compose UI·실제 강제 종료 후 복원을 검사합니다. Photo Picker 취소는 실제 UI에서, URI/복사 실패와 용량 제한은 repository 경계에서 검사합니다. 사진 선택 UI의 모든 공급자/기기 조합을 검사하는 것은 아닙니다.

### L4 서버와 두 에뮬레이터

고정 동기화 서버는 에이전트가 구현할 대상이 아닙니다. 별도 터미널에서 **측정 전에**:

```sh
npm run sync:server
```

서버 준비 메시지를 기다리세요. 서버는 127.0.0.1:3418에서 시작하며 별도 임시 스키마를 사용합니다. Android는 10.0.2.2:3418로 접근합니다. Ctrl-C로 중지하면 자기 스키마만 정리합니다. 기존3418포트를 점유한 서비스는 종료하지 않고 오류를 냅니다. 실행마다 새로운 DB이므로 한 비교 실행 중 서버를 바꾸지 마세요.

서로 다른 API35 에뮬레이터 두 대를 시작합니다(예: 5580/5582). 두 번째는 실제 별도 Android 인스턴스여야 합니다.

```sh
npm run prepare:task -- mobile-build-l4-synced-checklist /tmp/agent-run-sync
BENCH_PEER_EMULATOR=emulator-5582 npm run evaluate:android -- /tmp/agent-run-sync emulator-5580 /tmp/sync-result.json
```

평가기는 두 에뮬레이터 모두의 bench.app 테스트 데이터만 초기화합니다. 한 기기 내 독립 Room 클라이언트 검사(충돌·오프라인·재시도·응답 유실 후 재전송)와 실제 두 기기 간 생성→수정→원 기기 반영 검사를 함께 수행합니다. 서버 우선 충돌409, 버전 CAS, 삭제 tombstone, operationId 중복 방지는 고정 계약입니다.

## 평가 도구 자체 검증

```sh
npm run verify:web:advanced -- /tmp/web-advanced.json
npm run verify:sync
BENCH_PEER_EMULATOR=emulator-5582 npm run verify:android:advanced -- emulator-5580 /tmp/mobile-advanced.json
```

자체 검증은 각 starter가 미완성/버그 검사에서 실패하고 reference는 전부 통과해야 성공합니다. Android 검증 명령은 고정 서버를 직접 기동/정리하므로 `sync:server`를 별도로 켜지 마세요. 서로 같은 에뮬레이터/3418포트로 평가를 동시에 실행하지 않습니다.

평가 종료코드:0=모두 통과,1=품질 검사 실패,2=환경·빌드·instrumentation 오류. 환경 오류를 품질0점이나 에이전트 토큰 절약으로 기록하지 않습니다. 에이전트가 제출한 코드가 빌드되지 않는 경우 결과에는 build-failed를 별도로 남겨야 합니다.

## 결과 기록

`templates/run/report.md`에 task/version/track, 에이전트·모델·버전·설정, 시작/종료 시각, 실제 관측한 입력·출력·캐시·추론 토큰, 사람 개입, 수정 횟수, 평가 JSON 경로를 기록합니다. 미제공 토큰은 null, 서로 다른 토큰 지표를 임의로 합치지 않습니다. 초기 평가와 각 수정 후 평가를 모두 보관하며 예산 내 최종 점수와 총 사용량을 비교합니다. 자동 에이전트 실행/토큰 수집기는 아직 별도 후속 작업입니다. 정답 예제 통과 결과는 에이전트 측정 결과가 아닙니다.
