# Android L1 습관 체크

## 환경·고정 계약

Java 17, Android native Views, AGP 8.9.1, Gradle wrapper 8.13, compile/target SDK 35, min SDK 26. 평가 기준 Android API 35. iOS·웹뷰는 범위 밖.

패키지 bench.app, MainActivity 및 TrackerModel 공개 메서드·Entry 필드를 유지합니다. 제공 네이티브 UI·검증·저장 scaffolding은 사용 가능. 외관은 평가하지 않습니다.

입력은 제목 trim 후 1~80자, 실제 날짜 YYYY-MM-DD(시간대 변환 없이 날짜 문자열), 고유 ID. 데이터 변환은 입력 목록·항목을 변경하지 않습니다. 없는 ID 변경/삭제는 내용상 변화 없음.

SharedPreferences tracker/state에 JSON 저장. Activity 종료 후 재실행과 프로세스 종료 후에도 보존. 손상 JSON/배열 아님은 빈 목록, 잘못된 항목은 제외. 제목은 일반 텍스트.

## 기능

습관 추가·ID별 삭제·선택 날짜 완료 토글. 날짜를 바꿔도 이전 날짜의 완료 기록 보존. 같은 제목도 별개 ID. 선택 날짜의 완료 개수 표시.

TrackerModel: add(rows,title), toggle(rows,id,day), delete(rows,id), completed(rows,day), write(rows), read(json). Entry: id,title,days(Set<String>).

View tag: title,day,add,error,summary,rows 및 row:<id>,toggle:<id>,delete:<id>. summary는 선택 날짜 완료 수를 숫자로 표시.

## 작업

신고된 증상: 완료 표시 후 앱을 닫았다 다시 열면 체크가 해제됩니다. 날짜별 기록도 재실행 후 사라집니다. 다른 기능을 유지하며 수정하세요.

로그인·클라우드·푸시·차트·카메라·추가 의존성·SDK 업그레이드는 범위 밖입니다. 준비 단계의 Gradle/SDK 다운로드는 허용하지만 측정 실행 중 새 의존성을 추가하지 않습니다.
