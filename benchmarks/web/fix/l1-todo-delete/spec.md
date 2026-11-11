# Todo L1 — fix

## 공통 기능

- 제목을 앞뒤 trim해 1~120자(UTF-16 length)로 검증. 공백뿐인 입력 거절.
- 추가·완료 전환·삭제. 같은 제목도 허용하며 안정적인 고유 ID로 구분.
- 전체/미완료/완료 필터. 필터·저장 순서와 관계없이 ID로 대상 변경.
- 남은 할 일 개수는 전체 데이터의 미완료 수.
- localStorage에 저장, 새로고침 후 완료 상태와 항목 복원.
- 잘못된 저장 JSON은 빈 목록으로 복구. 저장 데이터는 id/title/completed 타입 검증.
- 제목은 일반 텍스트로 표시. 입력 문자열을 HTML로 실행하지 않음.
- 백엔드·계정·편집·정렬·외부 API·추가 의존성은 범위 밖.

## 고정 계약

HTML/CSS/JavaScript ES modules. starter의 todo.js export와 STORAGE_KEY를 유지합니다.
addTodo/toggleTodo/deleteTodo/visibleTodos는 원본 배열·객체를 수정하지 않습니다. 없는 ID에 대한 toggle/delete는 내용상 변화가 없습니다.
저장은 saveTodos(storage,todos), 복원은 loadTodos(storage). storage는 localStorage와 동일한 getItem/setItem 인터페이스입니다.

평가 선택자: #title, #add-form, #filter(all/active/completed), #remaining, #todos li, 행의 checkbox 및 삭제 button을 유지합니다.
UI 스타일은 평가하지 않습니다. 제공 UI를 유지해도 됩니다. 동작을 구현하는 과제입니다.

## 신고된 증상

할 일을 여러 개 만들고 일부를 완료한 뒤, 미완료 필터에서 삭제하면 다른 항목이 없어지거나 삭제되지 않습니다. 완료 필터에서도 삭제가 정상 작동하지 않습니다. 원인을 찾아 고치고 나머지 동작을 유지하세요.
