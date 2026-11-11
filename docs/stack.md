# L3·L4 기준 기술 스택

## 선택 기준

널리 사용되는 생태계, 플랫폼 공식 권장 구성, 로컬 재현성, 평가 도구 제공 가능성을 함께 고려한다. 모든 항목이 각각 시장 점유율 1위라는 의미는 아니다. 사용자의 보편적 스택 요청에 따라 L3·L4 기준 트랙을 아래와 같이 확정한다.

## 웹 L3·L4

| 계층 | 선택 |
|---|---|
| 언어 | TypeScript |
| UI·서버 | React + Next.js App Router, Route Handlers |
| 스타일 | Tailwind CSS, 별도 대형 컴포넌트 키트 없음 |
| DB | PostgreSQL |
| ORM·마이그레이션 | Prisma |
| 입력 검증 | Zod |
| 인증 | seed 계정, 비밀번호 해시, 서버에 저장하는 불투명 세션·HttpOnly 쿠키 |
| 평가 | Vitest(단위/통합), Playwright(브라우저), 직접 HTTP 인증·권한 검사 |
| 로컬 환경 | Node 22 기준으로 호환 버전 선정, PostgreSQL은 Docker Compose |

프런트와 API를 별도 서비스로 나누지 않는다. 공개 클라우드·유료 API·관리형 DB는 요구하지 않는다. DB 설치·마이그레이션·seed는 측정 전에 준비한다. 과제별 DB 초기화와 서버 재시작 후 보존을 검증한다.

PostgreSQL은 L3와 L4에 공통 적용하며 로컬 실행 편의를 위해 임의로 SQLite로 대체하지 않는다. ORM·스타일·검증·테스트 도구는 본 벤치마크의 일관성을 위한 구현 선택이며 조사에서 가장 많이 쓰인 도구라고 주장하지 않는다.

## Android L3·L4

| 계층 | 선택 |
|---|---|
| 언어 | Kotlin, JDK 17 호환 빌드 구성 |
| UI | Jetpack Compose + Material 3 |
| 화면·상태 | Navigation Compose, ViewModel, Coroutines + Flow |
| 로컬 DB | Room(SQLite) |
| L3 사진 | Android Photo Picker, 앱 내부 파일 저장 |
| L4 통신 | REST/JSON, Retrofit + OkHttp |
| L4 백그라운드 동기화 | WorkManager, Room 기반 대기 작업 |
| 평가 | 모델·DB 테스트, Compose UI instrumentation, API 35 에뮬레이터 |

Android 공식 권장 구성에 맞춘 네이티브 트랙이다. iOS·Flutter·React Native는 별도 장기 트랙으로 남긴다.

Photo Picker는 광범위한 사진 라이브러리 권한을 요구하지 않는 구성을 기본으로 한다. 선택 취소·URI 접근 실패·파일 복사 실패·재실행 보존을 검사하고 불필요한 저장소 권한을 추가하지 않는다.

## L4 동기화 서버

TypeScript + Next.js Route Handlers + Prisma + PostgreSQL을 사용한다. 웹 과제와 기술 생태계를 맞추되 별도 과제의 코드·DB·평가 환경을 사용한다.

서버·DB 기동 scaffolding과 seed는 제공하고 동기화 규칙·요청 식별자·버전 충돌·삭제 및 재시도 계약은 구현 전 명세에서 고정한다. 외부 클라우드 없이 에뮬레이터 두 대와 로컬 서버로 평가한다.

설치·빌드 호환성을 확인한 기준 조합은 [환경 준비](preparation.md)에 기록합니다. 실제 과제는 아직 구현 전입니다.

## 버전과 비교 정책

- 이 문서는 기술 계열 선택이다. 실제 패키지·SDK·Gradle·컨테이너 이미지 버전은 각 starter 제작 시 호환성·보안·평가 통과를 확인한 뒤 정확한 버전/lockfile로 고정한다.
- 선정한 프레임워크가 Node 22/JDK 17과 호환되지 않으면 무조건 최신을 설치하지 않고, 호환되는 지원 버전을 선택하거나 환경 변경을 명시적으로 기록한다.
- L1·L2의 JavaScript 및 Java/Views 과제는 기존 재현성을 위해 유지한다.
- L3·L4는 언어·프레임워크도 달라지므로 레벨 간 토큰 차이를 순수 난이도 효과로 해석하지 않는다. 기본 비교는 동일 과제·버전·트랙의 에이전트 실행끼리 한다.
- 같은 기능 과제의 여러 스택 비교 구조는 [장기 이슈 #1](https://github.com/inno-97/agent-efficiency-bench/issues/1)에서 다룬다.
- L3·L4는 스택만 확정됐고 아직 planned이며 실행 가능한 과제는 아니다.

## 선택 근거

- [Stack Overflow 2026 웹 기술 사용 조사](https://survey.stackoverflow.co/2026/technology/data/web-framework): React·Next.js·Node.js가 널리 사용되는 생태계임을 확인.
- [Stack Overflow 2026 DB 사용 조사](https://survey.stackoverflow.co/2026/technology/data/databases): 응답자 중 PostgreSQL의 높은 사용 비중을 확인. 전체 개발자 모집단의 점유율로 해석하지 않음.
- [Android Kotlin-first](https://developer.android.com/kotlin/first): 신규 Android 앱의 Kotlin 사용 권장.
- [Jetpack Compose](https://developer.android.com/compose): Android의 권장 현대적 네이티브 UI 도구.
- [Room](https://developer.android.com/training/data-storage/room): SQLite 직접 API 대신 권장하는 로컬 DB 추상화.
