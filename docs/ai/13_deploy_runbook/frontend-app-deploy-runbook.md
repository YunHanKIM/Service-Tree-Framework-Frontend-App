# Frontend-App — 실행·배포 절차

## 로컬 실행

```bash
npm install
npm test              # 단위·컴포넌트 테스트
npm run typecheck     # 타입 검사
npx expo start        # 개발 서버
```

## 화면 확인 방법

| 방법 | 명령 | 비고 |
|------|------|------|
| 브라우저 | `npx expo start --web` → http://localhost:8081 | 개발자 도구에서 모바일 크기(예: 390×844)로 보면 휴대폰 화면과 비슷하다 |
| 휴대폰(Expo Go) | `npx expo start` → 터미널 QR을 Expo Go(Android) 또는 카메라(iOS)로 스캔 | PC와 휴대폰이 같은 와이파이에 있어야 한다. 안 되면 `npx expo start --tunnel` |
| Android 에뮬레이터 | `npx expo start --android` | Android Studio(SDK·에뮬레이터) 설치 필요 — 현재 개발 PC에는 없음 |

QR 스캔은 실제 카메라가 필요하다. 관리자 계정으로 물품 상세에 들어가면 QR 이미지가 나오므로, 다른 화면에 띄워 두고 휴대폰으로 스캔한다.

## Supabase 연결 (선택)

1. Supabase 프로젝트 생성 → SQL Editor에서 `supabase/migrations/0001_init.sql` 실행
2. 관리자 계정: 앱에서 가입 후 SQL Editor에서 `update profiles set role='admin' where email='<이메일>';`
3. `.env.local` 작성(커밋 금지):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
4. `npx expo start` 재시작 → 로그인 화면 하단 표시가 "Supabase"로 바뀌는지 확인

## 설치 빌드 (EAS, 선택)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

`eas.json`은 아직 없다. 처음 실행하면 CLI가 만들어 준다.
