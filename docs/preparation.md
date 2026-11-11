# L3·L4 환경 준비

이 구성은 기능 과제가 아니라 **설치·빌드·DB·기기 통신 준비 검사**입니다. L3/L4 실제 과제의 실행·평가는 [별도 가이드](advanced.md)를 따릅니다. 준비 테스트 결과를 에이전트 성능 결과에 포함하지 않습니다.

## 준비 결과

- Docker CLI + Compose, macOS에서는 전용 Colima Docker VM.
- Node 22, Next.js 16.4.6, React 19.3.1, Prisma 7.10.1, PostgreSQL 17.11.
- TypeScript 5.9.3, Tailwind 4.3.5, Zod 4.6.7, Vitest 5.1.0. package-lock.json 고정.
- JDK 17, Gradle 8.13, AGP 8.9.1, Kotlin/Compose compiler 2.0.21, Compose BOM 2025.01.01, Room 2.7.2, API 35.
- Navigation/ViewModel/Flow, WorkManager, Retrofit/OkHttp 의존성 빌드 확인.
- DB 읽기·쓰기 및 Zod 2개 검사, Next.js 프로덕션 빌드·페이지/API, Android Compose UI·Room·API 통신 3개 검사.

버전은 로컬에서 함께 빌드·실행을 확인한 조합입니다. Docker 이미지는 compose.yaml에 multi-platform digest로 고정합니다. 이후 과제별 버전이 달라지면 해당 과제의 lockfile과 환경 기록을 따릅니다.

## 1. macOS Docker 실행 환경

Docker Desktop이 이미 있으면 실행하고 이 절의 Colima 설치는 생략할 수 있습니다. 이 Mac에서는 Docker CLI·Compose·Colima를 사용합니다. Compose 파일은 Docker Desktop/Linux Engine에서도 같은 방식으로 실행할 수 있습니다.

```sh
brew install docker docker-compose colima node@22
colima start agent-bench --cpus 4 --memory 6 --disk 30 --runtime docker --activate=false --mount none --ssh-config=false
export DOCKER_CONTEXT=colima-agent-bench
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
docker compose version
```

Intel Mac은 Homebrew 경로를 `/usr/local` 기준으로 바꿉니다. Homebrew Compose 설치 후 docker compose를 찾지 못하면 기존 `~/.docker/config.json`의 다른 설정을 보존하면서 `cliPluginsExtraDirs`에 `/opt/homebrew/lib/docker/cli-plugins`를 추가합니다. [Colima 공식 문서](https://github.com/abiosoft/colima).

설치 시 Homebrew가 공용 의존성을 갱신할 수 있습니다. 기존 다른 Node가 실행되지 않으면 같은 메이저의 현재 호환 Homebrew 패키지로 복구하고 `node --version`, `npm --version`을 확인합니다. 이 프로젝트에서는 Node 22를 명시적으로 사용합니다.

## 2. DB 준비

저장소 루트에서:

```sh
npm run env:init
npm run db:up
npm run db:check
```

- 무작위 비밀번호를 로컬 `.env`에 만들고 preparation/web/.env에 접속 URL을 생성합니다. 둘 다 Git 제외.
- 기존 `.env`는 보존합니다. 루트 `.env` 값을 변경한 경우 env:init을 다시 실행해 웹 접속 URL을 갱신합니다.
- 이 Mac 전용 `.env`에는 `DOCKER_CONTEXT=colima-agent-bench`가 추가되어 있습니다. 새 환경에서는 위 export 또는 로컬 .env로 지정합니다.
- DB는 `127.0.0.1:55432`에만 노출합니다. 기존 5432의 로컬 PostgreSQL은 사용하지 않습니다.
- 컨테이너·네트워크·named volume은 agent-efficiency-preparation 프로젝트 전용입니다.
- DB 데이터는 컨테이너를 내려도 남습니다. 중지는 `npm run db:down`, 재개는 `npm run db:up`입니다. down에 -v를 붙이면 데이터가 지워지므로 일반 준비 절차에 사용하지 않습니다.
- 비밀번호 환경 변수만 바꿔도 기존 볼륨의 PostgreSQL 비밀번호가 바뀌지는 않습니다. 기존 볼륨과 일치하는 값을 유지하세요.

## 3. 웹 설치·빌드

```sh
npm ci --prefix preparation/web
npm --prefix preparation/web run db:generate
npm --prefix preparation/web run db:push
npm --prefix preparation/web test
npm --prefix preparation/web run build
npm --prefix preparation/web start
```

서버는 `http://127.0.0.1:3417`, DB 확인은 `/api/health`입니다. 다른 터미널에서 `node tools/web-preparation-check.mjs`를 실행합니다.

Prisma db:push는 준비 전용 DB에 PreparationProbe 테이블을 만듭니다. 실서비스나 기존 DB에 실행하지 않습니다. 실제 과제에서는 과제별 DB와 정식 migration/seed를 별도로 제공합니다.

## 4. Android 설치·기기 검사

[Android 가이드](android.md)의 JDK17·SDK35·AVD 준비를 따릅니다. ANDROID_HOME을 설정합니다. 캐시 준비용 빌드:

```sh
cd preparation/android
./gradlew assembleDebug assembleDebugAndroidTest
```

별도 터미널에서 API35 전용 에뮬레이터를 포트5580으로 켜고 부팅 완료를 확인합니다. 웹 서버와 DB를 켜 둔 상태에서 저장소 루트에서:

```sh
npm run env:android -- emulator-5580
```

이 명령은 bench.preparation과 bench.preparation.test를 해당 에뮬레이터에 설치합니다. 물리 기기 serial은 거절합니다.

- Compose 화면 표시
- Room DB 쓰기·읽기
- Retrofit → 에뮬레이터의 `10.0.2.2:3417` → 호스트 Next.js API → 컨테이너 PostgreSQL

세 검사가 통과해야 준비 완료입니다. 10.0.2.2는 Android 에뮬레이터에서 호스트에 접근하는 주소입니다. 준비 앱 debug 빌드에만 로컬 HTTP를 허용합니다. 이 준비 검사는 인증·동기화·Photo Picker를 검사하지 않습니다. 해당 검사는 L3/L4 독립 평가에서 수행합니다.

## 5. 상태 확인·종료

```sh
npm run env:check
```

Node22·Docker·Compose·준비 DB·JDK17·SDK35를 확인합니다. 도구 버전/DB 건강 상태 확인이며 전체 UI 테스트의 대체는 아닙니다.

- 웹 서버: 실행 터미널에서 Ctrl+C.
- 에뮬레이터: `adb -s emulator-5580 emu kill`.
- 준비 DB: `npm run db:down` (데이터 보존).
- 전용 Docker VM: `colima stop agent-bench`. 다시 작업할 때 start 후 db:up.

GitHub Actions의 Verify L3 L4 environment에서도 Docker PostgreSQL·웹 빌드·API35 Android 연결을 검증합니다.

## 다음 구현

L3/L4 과제 준비가 완료되었으며 [과제 실행 가이드](advanced.md)를 따라 에이전트 비교 실행을 시작할 수 있습니다. 설치와 캐시를 미리 준비해도 새 권한·새 도구·환경 오류로 작업이 멈출 가능성이 완전히 사라지지는 않습니다.

## 이번 Mac 설치 기록

Docker CLI 29.9.3, Colima 0.10.3(Docker Engine 29.5.2), Compose 5.7.1, Node 22.23.4를 설치했습니다. Homebrew 공용 의존성 갱신 후 기본 Node의 링크 호환성을 복구하면서 Node 26.4.0 → 26.13.0, Homebrew 연동 Firebase CLI 15.22.3 → 15.35.0으로 갱신됐습니다. 기본 Node와 프로젝트용 Node22 실행을 모두 확인했습니다. 기존 로컬 PostgreSQL은 사용하지 않았습니다.
