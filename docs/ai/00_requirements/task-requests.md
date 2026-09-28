# 빌림 — 요구사항 → 요청문(TASK) 변환

정본 요구사항: `requirements-v1.1.md` (기획안 1.1). 변환 규칙: MultiAgent 루트의 `요구사항_TASK_전환_Format.md`.

## 변환 공통값

- 진행 현황이 모두 `개발중` → 성격 `코드 구현`, 산출물 `소스(커밋)`
- target_repo: `C:/Users/yh/Desktop/Java-Service-Tree-Framework-main/tree/Service-Tree-Framework-Frontend-App`
- 담당: DEV + 리뷰 → 워커 `생산=Claude Code(Orchestrator 직접 구현), 리뷰=codex-critic`
  - 사용자가 "코드는 codex로 검토하면서 진행"을 지정. 구현을 claude-main 워커로 따로 호출하지 않고 오케스트레이터 세션이 직접 작성했다.
- write_scope: 리뷰 워커는 `none`(read-only). 구현 쓰기는 오케스트레이터가 직접 한다.
- 공통 전제: Expo SDK 57 + TypeScript + Expo Router + TanStack Query. 백엔드는 API 계약(`src/api/types.ts`) 뒤에 데모(메모리) 구현과 Supabase 구현을 둔다.
- 공통 제약: 테스트 없이 구현 커밋 금지(TDD: `test:` → `feat:`), 화면 코드에서 권한 검사만으로 보안 처리 금지, QR에 개인정보·인증정보 인코딩 금지.

---

REQ-F-001

목표: 이메일·비밀번호로 가입·로그인·로그아웃·비밀번호 재설정을 한다. 완료 조건 =
① 로그인하지 않으면 보호 화면 대신 로그인 화면으로 이동한다
② 틀린 비밀번호, 중복 이메일은 원인별 문구를 보여준다
③ 가입하면 회원 역할이 자동으로 부여된다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/login.tsx`, `src/auth/*`, `src/api/*`
제약: 비밀번호를 앱 저장소나 로그에 남기지 말 것, 가입 시 역할을 클라이언트가 정하지 말 것

REQ-F-002

목표: 회원이 이름으로 물품을 검색하고 상태(대여 가능·대여 중·사용 중지)로 필터링한다. 완료 조건 =
① 본인의 대기 신청이 있는 물품에 "내 신청 대기" 배지를 표시한다
② 결과가 없으면 빈 상태를, 실패하면 오류와 재시도를 보여준다
③ 당겨서 새로고침을 할 수 있다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/(tabs)/index.tsx`
제약: 물품 상태를 별도 컬럼으로 저장하지 말 것(대여 기록에서 계산)

REQ-F-003

목표: 카메라 권한에 동의하고 QR을 스캔하면 물품 상세로 이동한다. 완료 조건 =
① 권한을 거부하면 설정 이동 안내와 목록 검색 경로를 보여준다
② 다시 물을 수 있는 상태면 권한 요청 버튼을 보여준다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/scan.tsx`, `src/components/CameraPermissionView.tsx`
제약: 권한 없이 카메라 미리보기를 띄우지 말 것

REQ-F-004

목표: 잘못된 QR을 원인별로 안내하고, 같은 QR을 연속으로 감지해도 한 번만 처리한다. 완료 조건 =
① `billim://item/<uuid>` 형식이 아니면 "빌림 QR이 아님", uuid가 틀리면 "손상된 QR", 미등록이면 "등록되지 않은 물품"을 보여준다
② 오류 후 재스캔할 수 있다
③ 연속 감지 시 이동이 한 번만 일어난다(자동 테스트)
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/domain/qr.ts`, `src/hooks/useScanOnce.ts`
제약: QR 값으로 서버 요청을 두 번 이상 보내지 말 것

REQ-F-005

목표: 회원이 반납 예정일을 골라 대여를 신청한다. 완료 조건 =
① 과거 날짜는 앱에서 막고 서버도 거부한다(한국 시간 기준, 오늘은 허용)
② 같은 물품에 대한 본인의 중복 대기 신청, 대여 중이거나 사용 중지된 물품은 서버에서 거부한다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/item/[id].tsx`, `src/domain/dueDate.ts`
제약: 날짜 검증을 앱에서만 하지 말 것

REQ-F-006

목표: 관리자가 대기 신청을 승인하거나 사유와 함께 거절한다. 완료 조건 =
① 승인은 서버 함수 하나에서 원자적으로 처리한다(활성 대여 없음 확인 → 대여 생성 → 같은 물품의 다른 대기 신청 자동 거절)
② 동시 승인 시 대여는 한 건만 확정되고, 실패한 쪽 앱은 이유를 보여준 뒤 목록을 갱신한다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/(tabs)/admin.tsx`, `supabase/migrations/*`
제약: 승인·거절에 낙관적 업데이트 금지, 앱에서 테이블을 직접 update하지 말 것

REQ-F-007

목표: 대여 중인 회원이 반납을 요청하고, 관리자가 확인해야 물품이 다시 대여 가능이 된다. 완료 조건 =
① 반납 요청 중에도 물품은 대여 중으로 보인다
② 반납 요청 전에는 반납 확인을 할 수 없다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/(tabs)/my.tsx`, `src/app/(tabs)/admin.tsx`
제약: 회원이 반납 완료 처리를 할 수 없어야 함

REQ-F-008

목표: 회원은 본인 기록을, 관리자는 조직 전체 기록(처리자·처리 시각 포함)을 본다. 완료 조건 =
① 회원이 다른 회원의 기록이나 전체 기록을 요청하면 서버가 거부한다
② 기록 화면에 처리 결과와 거절 사유가 보인다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/(tabs)/my.tsx`, `src/app/admin/history.tsx`, RLS 정책
제약: 화면에서 숨기는 것만으로 권한을 처리하지 말 것

REQ-F-009

목표: 관리자가 물품 이름·설명을 등록·수정하고 사용 여부를 바꾸며, 물품별 QR을 확인한다. 완료 조건 =
① 대여 중인 물품은 사용 중지할 수 없다
② 상세 화면에서 QR 이미지를 볼 수 있다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/admin/item-form.tsx`, `src/components/ItemQr.tsx`
제약: 관리자가 대여 상태를 직접 바꾸는 UI를 만들지 말 것, 사진 업로드는 선택 범위라 제외

REQ-F-010

목표: 네트워크 오류가 나면 진행 표시를 끝내고 실패 이유와 재시도를 보여준다. 완료 조건 =
① 처리 중에는 버튼이 비활성화되어 두 번 탭해도 요청이 한 번만 간다(자동 테스트)
② 실패하면 버튼 아래에 원인 문구가 보이고 다시 누를 수 있다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/components/SubmitButton.tsx`, `src/components/StateView.tsx`
제약: 오프라인 상태에서 요청을 쌓아두었다가 나중에 보내지 말 것

REQ-F-011

목표: 회원이 본인의 대기 신청을 취소한다. 완료 조건 =
① 이미 처리된 신청은 취소할 수 없고, 앱은 최신 상태를 다시 불러온다
② 다른 회원의 신청은 취소할 수 없다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/app/(tabs)/my.tsx`
제약: 처리된 신청의 상태를 되돌리지 말 것

REQ-NF-001

목표: 역할 검사를 서버 데이터 정책에서 수행한다. 완료 조건 =
① 회원이 본인 `role`·`organization_id`를 바꾸려 하면 거부된다
② 상태 변경은 역할을 검사하는 RPC 함수로만 가능하다
③ 부분 유니크 인덱스로 물품당 활성 대여 1건, 회원·물품당 대기 신청 1건을 보장한다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `supabase/migrations/0001_init.sql`
제약: service_role 키를 앱에 넣지 말 것

REQ-NF-002

목표: 접근성과 공통 상태 처리를 모든 데이터 화면에 적용한다. 완료 조건 =
① 모든 버튼에 읽을 수 있는 이름이 있다
② 상태는 색과 함께 텍스트로도 표시한다
③ 로딩·빈 목록·오류(재시도) 상태를 공통 컴포넌트로 처리한다
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — `src/components/*`
제약: 색만으로 상태를 구분하지 말 것
