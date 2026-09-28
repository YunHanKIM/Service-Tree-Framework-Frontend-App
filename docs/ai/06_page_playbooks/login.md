# 페이지 플레이북 — 로그인 (`src/app/login.tsx`)

관련 요청문: REQ-F-001

## 구성

- 한 화면에서 `mode`(로그인·회원가입·비밀번호 재설정)를 바꾼다. 모드마다 필요한 입력칸만 보인다.
- 제출은 `SubmitButton` — 처리 중 비활성화, 실패 시 `errorMessage()` 문구(`INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `CONFIRM_EMAIL`).
- 데모 백엔드일 때만 "데모 계정" 카드가 보인다(`apiMode === 'demo'`). 버튼 한 번으로 회원 2명·관리자 로그인.
- 화면 하단에 현재 백엔드(데모/Supabase)를 표시한다.

## 알아야 할 것

- 로그인 가드는 이 화면이 아니라 `src/app/_layout.tsx`의 `Stack.Protected`가 한다. 로그인 성공 시 `SessionProvider`가
  `profile`을 바꾸면 라우터가 자동으로 `(tabs)`로 보낸다 — 여기서 `router.replace`를 부르지 말 것.
- 로그인·로그아웃 때 `queryClient.clear()`로 이전 사용자의 캐시를 지운다(`SessionProvider`).
- 가입 시 역할은 서버가 `member`로 정한다. 화면에 역할 선택을 넣지 말 것.

## 수정 시 체크리스트

- [ ] 새 인증 오류가 생기면 `ApiErrorCode`·`MESSAGES`·`supabaseErrors.ts` 매핑을 같이 추가
