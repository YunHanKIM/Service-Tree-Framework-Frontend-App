# Frontend-App — 변경 이력

## [Unreleased]

### 빌림 v0.1 — 첫 구현 (2026-09-28)

- Expo SDK 57 + TypeScript 프로젝트 생성, Expo Router·expo-camera·TanStack Query·Supabase·Jest/RNTL 설정.
- 요구사항 정의서 v1.1을 `요구사항_TASK_전환_Format` 규칙으로 요청문 13건(REQ-F-001~011, REQ-NF-001~002)으로 변환.
- TDD로 도메인 로직 구현: QR 해석(`parseItemQr`), 물품 상태 계산(`deriveItemStatus`), 반납 예정일 검증(한국 시간), 오류 문구.
- API 계약(`Api`)과 데모(메모리) 백엔드 구현. 권한·중복 신청·동시 승인·반납 규칙을 테스트 21건으로 고정.
- `docs/ai` 하네스 문서(01~13) 작성 — Frontend-Web과 같은 구조.
