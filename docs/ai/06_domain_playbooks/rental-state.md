# 도메인 플레이북 — 대여 상태 전이

## 상태

| 대상 | 전이 | 누가 |
|------|------|------|
| 신청 | `pending` → `approved` | 관리자(approve_request) |
| | `pending` → `rejected` | 관리자(reject_request) 또는 다른 신청 승인 시 자동 |
| | `pending` → `cancelled` | 신청한 회원 본인(cancel_request) |
| 대여 | (생성) `active` | 승인과 같은 트랜잭션 |
| | `active` → `return_requested` | 대여한 회원 본인(request_return) |
| | `return_requested` → `returned` | 관리자(confirm_return) |
| 물품 표시 상태 | 계산값 | `inactive`(사용 중지) > `on_loan`(반납 완료 전 대여 있음) > `available` |

## 규칙

- 대기 신청은 물품을 선점하지 않는다. 여러 회원이 같은 물품에 대기 신청할 수 있다.
- 승인은 원자적이다: 물품 행 잠금 → 신청이 `pending`인지 확인 → 열린 대여 없음 확인 → 대여 생성 → 나머지 대기 신청 자동 거절.
- 처리된 신청을 다시 처리하면 `ALREADY_PROCESSED`. 단, 이미 다른 대여가 열려 있으면 `CONFLICT`(동시 승인에서 진 쪽).
- 대여 중(반납 요청 포함)인 물품은 새 신청(`ITEM_UNAVAILABLE`)과 사용 중지(`ITEM_ON_LOAN`)가 거부된다.
- 반납 예정일은 날짜(date), 한국 시간 기준. 오늘은 허용, 과거는 거부. 기한 경과 = 오늘 > 반납 예정일.

## 구현 위치

- 순수 로직: `src/domain/itemStatus.ts`, `src/domain/dueDate.ts`
- 서버 규칙: `src/api/demoApi.ts`(데모), `supabase/migrations/0001_init.sql`(RPC 함수)
- 두 구현이 같은 결과를 내는지는 `src/api/__tests__/demoApi.test.ts`가 정본 시나리오다. SQL을 바꾸면 이 시나리오와 대조한다.
