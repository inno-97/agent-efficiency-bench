# 지출 기록장 L2

HTML/CSS/JavaScript ES modules, 백엔드·로그인·추가 의존성 없음. 제공 UI 사용 가능.

- 항목: 안정적인 고유 id, 제목 trim 후 1~80자, 금액 1~100000000원의 정수, 실제 존재하는 YYYY-MM-DD 날짜, 분류 food/transport/other.
- 추가·전체 필드 수정·ID별 삭제. 없는 ID 수정/삭제는 목록 변화 없음. 같은 제목 허용.
- YYYY-MM 월과 분류(all 포함)를 함께 필터. 연도가 다르면 같은 월이라도 제외. 입력 순서 유지.
- 합계는 현재 필터 결과의 원 단위 정수 합. 수정·삭제·필터 변경 즉시 갱신.
- localStorage 저장, reload 후 복원. JSON 손상/배열 아님은 [], 잘못된 항목은 제외.
- 일반 텍스트 표시. 날짜 계산에 시간대 변환을 적용하지 않음.
- 모든 목록 변환 함수는 입력 배열/객체를 변경하지 않음.

## 고정 계약

expense.js의 export와 STORAGE_KEY 유지. addExpense(rows,input), updateExpense(rows,id,input), deleteExpense(rows,id), selectExpenses(rows,month,category='all'), totalExpenses(rows), saveExpenses(storage,rows), loadExpenses(storage).

선택자: #expense-form, #title, #amount, #date, #category, #cancel, #month, #category-filter, #total, #error, #rows li(내부 span, button.edit, button.delete).

## 작업
핵심 로직의 TODO를 완성하고 전체 UI 흐름을 검증하세요.
