# Frontend-App — 용어 사전

| 용어 | 코드 | 정의 |
|------|------|------|
| 물품 | `Item` / `items` | 대여 대상. QR 하나가 물품 하나를 가리킨다 |
| 신청 | `RentalRequest` / `requests` | 회원의 대여 요청. 대기·승인·거절·취소 |
| 대여 | `Loan` / `loans` | 승인으로 생긴 실제 대여. 활성·반납 요청·반납 완료 |
| 대기 신청 | `status = 'pending'` | 관리자 처리 전 신청. 물품을 선점하지 않는다 |
| 열린 대여 | `status in ('active','return_requested')` | 반납 완료 전 대여. 물품당 최대 1건 |
| 대여 가능 / 대여 중 / 사용 중지 | `available` / `on_loan` / `inactive` | 물품 표시 상태(계산값) |
| 내 신청 대기 | `Item.myPending` | 현재 사용자가 이 물품에 대기 신청을 가지고 있음 |
| 반납 예정일 | `dueDate` / `due_date` | 'YYYY-MM-DD', 한국 시간 기준 날짜 |
| 기한 경과 | `isOverdue()` | 오늘이 반납 예정일보다 뒤 |
| 자동 거절 | — | 한 신청이 승인될 때 같은 물품의 나머지 대기 신청이 거절되는 것 |
| 승인 충돌 | `CONFLICT` | 동시에 승인했을 때 늦은 쪽이 받는 오류 |
| 회원 / 관리자 | `member` / `admin` | 역할. 가입 시 회원 자동 부여 |
| 데모 백엔드 | `demoApi` | Supabase 없이 실행하기 위한 메모리 구현 |
