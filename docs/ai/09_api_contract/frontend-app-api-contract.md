# Frontend-App — API 계약

정본: `src/api/types.ts`의 `Api` 인터페이스. 구현은 두 개다.

- `src/api/demoApi.ts` — 메모리 구현(기본). 새로고침하면 초기화된다.
- `src/api/supabaseApi.ts` — Supabase 구현. 조회는 테이블/뷰 select(RLS 적용), 상태 변경은 RPC.

`src/api/index.ts`가 `EXPO_PUBLIC_SUPABASE_URL`·`EXPO_PUBLIC_SUPABASE_ANON_KEY` 유무로 둘 중 하나를 고른다.

## 메서드

| 메서드 | 권한 | Supabase 대응 | 실패 코드 |
|--------|------|---------------|-----------|
| `signIn(email, pw)` | 누구나 | `auth.signInWithPassword` | INVALID_CREDENTIALS |
| `signUp(email, pw, name)` | 누구나 | `auth.signUp` + 트리거가 profiles(member) 생성 | EMAIL_TAKEN |
| `signOut()` / `getSession()` | 로그인 | `auth.signOut` / `auth.getSession` + profiles | |
| `resetPassword(email)` | 누구나 | `auth.resetPasswordForEmail` | |
| `listItems({query,status})` | 로그인 | `item_view` select | UNAUTHENTICATED |
| `getItem(id)` | 로그인 | `item_view` select | NOT_FOUND |
| `createItem` / `updateItem` | 관리자 | `items` insert/update(RLS: admin) | FORBIDDEN, ITEM_ON_LOAN |
| `createRequest(itemId, dueDate)` | 회원 | RPC `create_request` | PAST_DATE, INVALID_DATE, DUPLICATE_PENDING, ITEM_UNAVAILABLE |
| `cancelRequest(id)` | 본인 | RPC `cancel_request` | FORBIDDEN, ALREADY_PROCESSED |
| `approveRequest(id)` | 관리자 | RPC `approve_request` | FORBIDDEN, CONFLICT, ALREADY_PROCESSED |
| `rejectRequest(id, reason)` | 관리자 | RPC `reject_request` | FORBIDDEN, ALREADY_PROCESSED |
| `listMyRequests()` / `listAllRequests()` | 본인 / 관리자 | `request_view` select | FORBIDDEN |
| `listMyLoans()` / `listAllLoans()` | 본인 / 관리자 | `loan_view` select | FORBIDDEN |
| `requestReturn(loanId)` | 본인 | RPC `request_return` | FORBIDDEN, ALREADY_PROCESSED |
| `confirmReturn(loanId)` | 관리자 | RPC `confirm_return` | FORBIDDEN, ALREADY_PROCESSED |

## 오류 코드

모든 실패는 `ApiError(code)`(`src/domain/errors.ts`). SQL RPC는 `raise exception '<CODE>'`로 던지고,
Supabase 구현이 메시지를 코드로 바꾼다. fetch 실패(`TypeError`)는 `NETWORK`로 본다.
사용자 문구는 `errorMessage()`가 코드별로 만든다.
