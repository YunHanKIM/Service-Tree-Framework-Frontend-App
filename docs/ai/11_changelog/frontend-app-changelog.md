# Frontend-App — 변경 이력

## [Unreleased]

### Supabase 실제 연결 (2026-09-28)

- Supabase 프로젝트(ap-northeast-2)에 `0001_init.sql`·`0002_seed_items.sql`(시드 물품, 데모와 같은 고정 id) 적용, 데모 계정 3개 생성.
- 통합 테스트 `npm run test:supabase` 10개 — 역할 상승 차단, RLS 가시성, 중복 신청, 자동 거절, 동시 승인 1건, 반납, 취소를
  실서버로 확인(3회 연속 통과). jest-expo가 fetch를 스텁으로 바꾸므로 별도 설정(`jest.integration.config.js`).
- **버그 수정 — 다른 기기 변경이 열린 화면에 반영 안 됨**: `useRefreshOnFocus`(화면 포커스 재조회)와 AppState → focusManager.
- **버그 수정 — Expo Go로 PC 화면 QR 스캔 시 '등록되지 않은 물품'**(사용자 보고): 데모 시드 물품 id가 기기마다 무작위였다 → 고정 id.
- 검증: 브라우저 3컨텍스트(회원·관리자·회원)로 신청→승인→다른 기기 반영, 신규 물품 기기 간 공유, 새로고침 후 세션 유지.
- **codex 3차 리뷰**(High 0 / Medium 2, 모두 반영): 통합 테스트가 실DB에 데이터를 남기던 문제 → 실행 표식이 붙은 데이터를
  정리용 DB 접속으로 삭제(접속 문자열 없으면 실행 안 함). 10초 안에 포그라운드 복귀 시 재조회되지 않던 문제 →
  `refetchOnWindowFocus: 'always'`.

### 빌림 v0.1 — 첫 구현 (2026-09-28)

- Expo SDK 57 + TypeScript 프로젝트 생성, Expo Router·expo-camera·TanStack Query·Supabase·Jest/RNTL 설정.
- 요구사항 정의서 v1.1을 `요구사항_TASK_전환_Format` 규칙으로 요청문 13건(REQ-F-001~011, REQ-NF-001~002)으로 변환.
- TDD로 도메인 로직 구현: QR 해석(`parseItemQr`), 물품 상태 계산(`deriveItemStatus`), 반납 예정일 검증(한국 시간), 오류 문구.
- API 계약(`Api`)과 데모(메모리) 백엔드 구현. 권한·중복 신청·동시 승인·반납 규칙을 테스트로 고정.
- Supabase 스키마(`supabase/migrations/0001_init.sql`): 부분 유니크 인덱스, RLS, 상태 변경 RPC 6종, `profiles.role` 컬럼 권한.
  Supabase API 구현과 오류 매핑(`supabaseErrors.ts`, 테스트 포함).
- 공통 컴포넌트(TDD): `SubmitButton`(두 번 탭 방지·오류 표시), `StateView`, `CameraPermissionView`, `DueDatePicker`,
  `PendingRequestCard`, 훅 `useScanOnce`, `useApiMutation`(성공·실패 모두 관련 쿼리 무효화).
- 화면 9개: 로그인, 물품 목록, QR 스캔, 물품 상세, 내 대여, 관리자, 물품 등록·수정, 전체 기록.
- `docs/ai` 하네스 문서(01~13) 작성 — Frontend-Web과 같은 구조. 화면별 플레이북 6개.

### codex 리뷰 반영

- **1차(도메인·API·SQL)** — High 0 / Medium 2 / Low 1, 모두 반영.
  - 이미 승인했거나 직접 거절·취소한 신청을 다시 승인하면 `CONFLICT`가 나던 문제 → 동시 승인에서 진 신청(자동 거절)만
    `CONFLICT`, 나머지는 `ALREADY_PROCESSED`. 데모 API와 SQL을 같은 조건으로 맞춤.
  - Supabase `getItem`이 로그인 확인 없이 조회하던 문제 → 먼저 로그인 확인.
- **2차(화면·컴포넌트·훅)** — High 0 / Medium 2 / Low 1, 모두 반영.
  - 대기 신청 카드에서 승인 처리 중 거절도 누를 수 있던 문제 → `PendingRequestCard`가 카드 전체를 잠금.
  - 물품 수정 폼이 다른 물품으로 바뀔 때 이전 입력이 남을 수 있던 문제 → 물품 id로 폼 재마운트.
  - 여러 카드의 버튼 접근성 이름이 같던 문제 → 물품명·신청자를 넣은 `accessibilityLabel`.
- 원문: MultiAgent 루트 `tasks/qr-rental-app/workers/codex-critic/result.md`.

### 검증

- `npm test` 69개 통과, `npm run typecheck` 통과.
- Expo 웹(390×844)에서 Playwright로 로그인 → 목록 → 상세 → 신청 → 내 대여 → 검색 빈 결과 → 스캔 권한 화면 →
  관리자 승인(자동 거절 확인) → 전체 기록 → QR → 반납 확인 후 대여 가능 복귀까지 실행, 콘솔 오류 0건.
  스크린샷: `docs/screenshots/`.
