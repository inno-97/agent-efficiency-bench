# Android L1·L2 실행·평가

모바일 과제는 Java 17 + Android native Views 앱입니다. 브라우저의 모바일 viewport로 대체하지 않습니다. 현재 Android만 지원하며 iOS/Flutter/React Native 결과와 같은 조건으로 취급하지 않습니다.

## 환경 준비 (측정 시작 전)

1. JDK 17, Node 22, Android Studio 및 SDK command-line tools를 설치합니다.
2. SDK Manager에서 Android SDK Platform 35, Build Tools 35.0.0, Platform Tools, Android Emulator와 API 35 시스템 이미지를 설치하고 라이선스에 동의합니다.
3. API 35 AVD를 만듭니다. Apple Silicon은 arm64-v8a, Linux CI는 x86_64를 사용하고 결과에 ABI를 기록합니다. 로컬 검증은 google_apis_playstore/arm64-v8a, CI는 google_apis/x86_64입니다. 이 환경을 섞어 속도를 직접 비교하지 않습니다.
4. `ANDROID_HOME`을 SDK 경로로 설정하고 `$ANDROID_HOME/platform-tools`, `$ANDROID_HOME/emulator`를 PATH에 추가합니다.
5. 평가자 저장소에서 `npm ci`를 실행합니다. Gradle 8.13 wrapper와 AGP 8.9.1은 고정되어 있고 최초 빌드에서 다운로드됩니다. 새 실험의 의존성 설치·캐시 준비는 측정 시간에서 제외합니다.

AGP/JDK/Gradle 관계는 [Android 공식 호환성 문서](https://developer.android.com/build/releases/agp-8-9-0-release-notes)를 참고하세요.

## 과제 준비

평가자 저장소 루트에서 실행합니다. WORK는 새 폴더여야 합니다.

```sh
npm run prepare:task -- mobile-build-l1-habit-checker ../habit-run-01
```

다른 과제 ID:

- `mobile-fix-l1-habit-restore`
- `mobile-build-l2-workout-log`
- `mobile-fix-l2-workout-summary`

작업 폴더에서 Git을 초기화하고 최초 커밋을 남깁니다.

```sh
cd ../habit-run-01
git init -b main
git add .
git commit -m 'benchmark starting point'
./gradlew assembleDebug
```

Windows는 `gradlew.bat`를 사용하세요. Android Studio에서 이 작업 폴더를 열어 Run해도 됩니다. 앱에는 저장/입력 UI가 제공되고 build는 모델 로직을 완성하는 과제입니다.

## 에뮬레이터와 수동 실행

`emulator -list-avds`로 AVD 이름을 확인한 뒤 별도 터미널에서 켭니다.

```sh
emulator -avd YOUR_API_35_AVD -no-snapshot -port 5580
adb -s emulator-5580 wait-for-device
adb -s emulator-5580 shell getprop sys.boot_completed
```

마지막 출력이 1인지 확인합니다. 해당 에뮬레이터에는 평가 중 `bench.app`과 `bench.app.test`가 설치되고 앱 데이터가 초기화됩니다. 테스트 전용 AVD를 사용하세요. 평가 도구는 물리 기기 serial을 거절합니다.

```sh
adb -s emulator-5580 install -r app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5580 shell am start -n bench.app/.MainActivity
```

습관 앱은 날짜를 바꾸며 체크, 운동 앱은 새 운동→상세→수정→목록 합계를 확인합니다. prompt.md를 에이전트에게 전달하고 고정 계약을 유지하도록 합니다. 수동 앱은 자동 에이전트 실행 도구가 아니며 토큰은 별도로 수집합니다.

## 독립 평가

에이전트 작업을 멈추고 최초 제출 커밋을 보존한 뒤 **평가자 저장소 루트**에서:

```sh
npm run evaluate:android -- ../habit-run-01 emulator-5580 ../habit-run-01-report.json
```

- 후보 소스를 임시 폴더에 복제하고 독립 instrumentation runner를 주입해 빌드합니다. 후보 원본은 수정하지 않습니다.
- 모델 8개, 실제 Activity/View 4개 검사를 수행합니다. 네이티브 버튼·텍스트 필드를 instrumentation에서 조작하며 시각적 디자인·터치 좌표·접근성은 점수에 포함하지 않습니다.
- 앱을 force-stop한 뒤 새 프로세스로 저장 상태를 다시 확인합니다. 이 결과는 해당 재실행 UI 검사의 통과 여부에 반영됩니다.
- 12/12면 종료 코드 0, 검사 실패는 1, 빌드/기기/runner 오류는 2입니다. 컴파일 실패도 완료 실패로 기록하되 통과 수를 임의로 0/12로 만들지는 않습니다.
- 첫 평가 후 실패 결과를 전달하고 최대 두 번 수정합니다. 결과·토큰·시간 기록은 [공통 방법](methodology.md)을 따릅니다.
- 평가 완료 후 앱은 테스트용 상태로 남을 수 있습니다. 다음 평가가 초기화하므로 실행 간 공유하지 않습니다.

## 평가 도구 자체 검증

```sh
npm run verify:android -- emulator-5580
```

네 과제 각각 starter 실패와 reference 12/12 통과를 확인합니다. reference는 평가자 전용이며 에이전트에게 공개하지 않습니다. 모든 실행은 지정한 에뮬레이터에 순차적으로 설치합니다. 같은 에뮬레이터에 평가를 병렬 실행하지 마세요.

## 문제 해결

- SDK 경로 오류: ANDROID_HOME 또는 ANDROID_SDK_ROOT를 설정하고 Platform 35 설치를 확인합니다.
- Java 오류: JDK 17의 JAVA_HOME을 사용합니다.
- `offline`/부팅 중: `adb -s <serial> shell getprop sys.boot_completed`가 1이 될 때까지 기다립니다.
- 설치 서명 충돌: 테스트용 AVD에서 기존 bench.app 및 bench.app.test를 제거한 뒤 재실행합니다.
- 처음 실행만 느림: Gradle·AGP·SDK 준비와 앱 빌드를 측정 전에 완료하고 캐시 조건을 모든 실행에 맞춥니다.

L3·L4는 스택·DB·기기 조건이 다르므로 [L3·L4 실행 가이드](advanced.md)를 따르세요.
