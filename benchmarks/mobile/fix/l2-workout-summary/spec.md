# Android L2 운동 기록

## 환경·고정 계약

Java 17, Android native Views, AGP 8.9.1, Gradle wrapper 8.13, compile/target SDK 35, min SDK 26. 평가 기준 Android API 35. iOS·웹뷰는 범위 밖.

패키지 bench.app, MainActivity 및 TrackerModel 공개 메서드·Entry 필드를 유지합니다. 제공 네이티브 UI·검증·저장 scaffolding은 사용 가능. 외관은 평가하지 않습니다.

입력은 제목 trim 후 1~80자, 실제 날짜 YYYY-MM-DD(시간대 변환 없이 날짜 문자열), 고유 ID. 데이터 변환은 입력 목록·항목을 변경하지 않습니다. 없는 ID 변경/삭제는 내용상 변화 없음.

SharedPreferences tracker/state에 JSON 저장. Activity 종료 후 재실행과 프로세스 종료 후에도 보존. 손상 JSON/배열 아님은 빈 목록, 잘못된 항목은 제외. 제목은 일반 텍스트.

## 기능

목록·상세·편집 3개 화면(동일 Activity의 패널 전환 가능). 운동 이름·날짜·세트(정수 1~100)·횟수(정수 1~1000)로 추가·전체 필드 수정·삭제.

선택 날짜 목록과 총 운동량(sum(세트×횟수)). 상세에도 세트×횟수를 표시. 수정 후 상세·목록·합계 모두 즉시 최신값. 날짜 이동 시 이전 날짜 합계에서 제외. 취소는 데이터 불변.

TrackerModel: add(rows,title,date,sets,reps), update(rows,id,title,date,sets,reps), delete(rows,id), select(rows,day), volume(rows), write(rows), read(json). Entry: id,title,date,sets,reps.

View tag: list,form,detail,title,date,sets,reps,day,new,save,cancel,error,summary,rows,open:<id>,detail-title,detail-volume,edit,delete,back. 합계·운동량은 숫자로 표시.

## 작업

신고된 증상: 운동 기록의 세트·횟수를 수정해도 상세 값이 바뀌지 않고, 목록의 날짜별 합계도 기대한 운동량과 다릅니다. 다른 기능을 유지하며 수정하세요.

로그인·클라우드·푸시·차트·카메라·추가 의존성·SDK 업그레이드는 범위 밖입니다. 준비 단계의 Gradle/SDK 다운로드는 허용하지만 측정 실행 중 새 의존성을 추가하지 않습니다.
