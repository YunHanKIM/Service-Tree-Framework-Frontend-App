# Frontend-App — 디렉터리 구조

```
Service-Tree-Framework-Frontend-App/
├── app.json                  # Expo 설정(scheme=billim, expo-camera 플러그인)
├── src/
│   ├── app/                  # 라우트 전용(Expo Router). 파일 하나 = 화면 하나
│   │   ├── _layout.tsx       # Provider(QueryClient, Session) + Stack
│   │   ├── login.tsx         # 로그인·가입·비밀번호 재설정
│   │   ├── (tabs)/           # 로그인 후 하단 탭: 물품(index), 내 대여(my), 관리자(admin)
│   │   ├── scan.tsx          # QR 스캔
│   │   ├── item/[id].tsx     # 물품 상세·대여 신청·QR(관리자)
│   │   └── admin/            # 물품 등록·수정, 전체 기록
│   ├── domain/               # 순수 로직(React 의존 없음). TDD 1순위
│   ├── api/                  # API 계약(types.ts) + 데모/Supabase 구현 + 선택(index.ts)
│   ├── auth/                 # 세션 Provider
│   ├── hooks/                # 쿼리 훅, 스캔 디바운스 훅
│   └── components/           # 공통 UI(StateView, SubmitButton, StatusBadge 등)
├── supabase/migrations/      # 테이블·RLS·RPC SQL
└── docs/ai/                  # 이 하네스 문서
```

## 규칙

- `src/app/` 안에는 라우트 파일만 둔다. 컴포넌트·훅·유틸은 밖에 둔다(Expo Router가 모든 파일을 화면으로 인식).
- 테스트는 대상 옆 `__tests__/` 폴더에 `<대상>.test.ts(x)`로 둔다.
- `domain/`은 React·Expo를 import하지 않는다.
- 화면은 `api/`를 직접 부르지 않고 `hooks/queries.ts`의 훅을 거친다.
