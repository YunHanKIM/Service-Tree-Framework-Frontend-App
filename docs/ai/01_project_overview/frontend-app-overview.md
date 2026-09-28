# Frontend-App — 프로젝트 개요

서비스명: **빌림** — QR 기반 공동 물품 대여 관리 모바일 앱.
React Native(Expo) + TypeScript. 목표 직무(프론트엔드) 포트폴리오 프로젝트다.

- 정본 요구사항: `requirements-v1.1.md` (기획안 1.1)
- 요청문(TASK) 변환본: `task-requests.md` (REQ-F-001~011, REQ-NF-001~002)

## 목적

동아리·스터디가 공동 물품을 QR로 대여·반납하고, 누가 무엇을 가지고 있는지 추적한다.
포트폴리오상 다음 역량을 보여주는 데 집중한다.

- 카메라 권한·QR 인식과 예외 처리(권한 거부, 잘못된 QR, 연속 감지)
- 서버 상태 관리(TanStack Query 캐시·무효화), 동시 승인 충돌 처리
- 로딩·빈 목록·오류·재시도의 일관된 처리, 접근성
- TDD — `test:` → `feat:` 커밋 순서가 git 이력에 남는다

## 핵심 사용자 흐름

1. 회원이 목록에서 검색하거나 QR을 스캔해 물품 상세로 들어간다.
2. 반납 예정일을 골라 대여를 신청한다.
3. 관리자가 승인하면 대여가 시작되고, 같은 물품의 다른 대기 신청은 자동 거절된다.
4. 회원이 반납을 요청하고, 관리자가 실물을 확인해 반납 완료로 처리한다.

## 범위 (이 구현의 경계)

- **포함**: 요구사항 v1.1의 첫 버전 필수 범위 전체(FR01~FR11), 관리자 QR 표시.
- **제외**: 물품 사진 업로드, 푸시 알림, 여러 조직, 오프라인 작성 후 동기화, 예약 대기열.
- **백엔드**: 기본은 데모(메모리) 백엔드로 바로 실행된다. `EXPO_PUBLIC_SUPABASE_URL`·`EXPO_PUBLIC_SUPABASE_ANON_KEY`를
  설정하면 Supabase 구현을 쓴다(`12_known_issues` 참조 — 실제 Supabase 프로젝트 연결은 미검증).

## MSA 내 위치

Java-Service-Tree-Framework의 `tree/` 아래 형제 모듈이지만, Backend-Core(A-RMS) API와는 연동하지 않는
독립 앱이다. 원격 저장소: https://github.com/YunHanKIM/Service-Tree-Framework-Frontend-App
