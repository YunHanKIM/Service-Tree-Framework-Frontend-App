# Frontend-App — 데이터 모델

## DB (Supabase Postgres, `supabase/migrations/0001_init.sql`)

| 테이블 | 주요 컬럼 | 제약 |
|--------|-----------|------|
| `profiles` | id(=auth.users.id), email, display_name, role, organization_id | 본인만 조회(관리자는 전체). `role`·`organization_id` 본인 수정 불가 |
| `items` | id uuid, organization_id, name, description, image_path, is_active, created_at | 쓰기는 관리자만 |
| `requests` | id, item_id, user_id, due_date date, status, reject_reason, processed_by, processed_at, created_at | `status='pending'` 조건 (item_id, user_id) 부분 유니크 |
| `loans` | id, item_id, user_id, request_id, due_date, borrowed_at, return_requested_at, returned_at, return_confirmed_by, status | `status in ('active','return_requested')` 조건 item_id 부분 유니크 |

- 물품 대여 상태 컬럼은 없다. 뷰 `item_view`가 `loans`에서 계산한다.
- 상태 변경(신청·취소·승인·거절·반납 요청·반납 확인)은 `security definer` RPC 함수로만 한다.
  `requests`·`loans`에는 클라이언트 insert/update 정책을 두지 않는다.

## 클라이언트 타입 (`src/domain/types.ts`)

| 타입 | 설명 |
|------|------|
| `Profile` | id, email, displayName, role |
| `Item` | id, name, description, isActive, status(계산), myPending |
| `RentalRequest` | 신청 + itemName, userName(표시용 조인) |
| `Loan` | 대여 + itemName, userName |

DB는 snake_case, 앱은 camelCase다. 변환은 `supabaseApi.ts` 안에서만 한다.

## 쿼리 키 (`src/hooks/queries.ts`)

| 키 | 무효화 시점 |
|----|-------------|
| `['items', params]`, `['item', id]` | 신청·취소·승인·반납 확인·물품 수정 후 |
| `['requests', 'mine' \| 'all']` | 신청·취소·승인·거절 후 |
| `['loans', 'mine' \| 'all']` | 승인·반납 요청·반납 확인 후 |
