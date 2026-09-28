# Frontend-App — 코딩 규칙

## TDD

- 새 로직은 실패하는 테스트부터 쓴다. 커밋은 `test:`(실패) → `feat:`(통과) → `refactor:` 순서로 나눈다.
- 동작을 테스트한다. 내부 state 값이나 호출 순서가 아니라 사용자가 보는 결과와 함수의 입출력을 검증한다.
- RNTL은 `screen.getByRole('button', { name })`처럼 접근성 이름으로 찾는다. testID는 마지막 수단.
- 커밋 전 `npm test`와 `npm run typecheck`를 통과시킨다.

## 상태와 서버 호출

- 물품 대여 상태는 저장하지 않고 `deriveItemStatus()`로 계산한다.
- 승인·거절·반납 확인 등 상태 변경은 낙관적 업데이트를 하지 않는다. 성공 후 관련 쿼리를 무효화한다.
- 변경 요청 중에는 버튼을 비활성화한다(`SubmitButton`). 같은 요청을 두 번 보내지 않는다.
- 실패는 `ApiError(code)`로 받고, 문구는 `errorMessage()` 한 곳에서 만든다. 화면에 문구를 하드코딩하지 않는다.
- `CONFLICT`·`ALREADY_PROCESSED`를 받으면 목록을 다시 불러온다.

## 보안

- 권한 검사는 화면 숨김과 서버(RLS·RPC) 양쪽에서 한다. 화면 숨김만으로 끝내지 않는다.
- QR에는 `billim://item/<uuid>`만 넣는다.
- Supabase `service_role` 키를 앱 코드·환경변수(`EXPO_PUBLIC_*`)에 넣지 않는다.

## 접근성·UI

- 누를 수 있는 요소에는 `accessibilityRole="button"`과 읽을 수 있는 이름을 준다.
- 상태는 색과 텍스트를 함께 표시한다(`StatusBadge`).
- 데이터 화면은 로딩·빈 목록·오류(재시도)를 `StateView`로 처리한다.
