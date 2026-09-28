# Frontend-App — 실행·배포 절차

## 로컬 실행

```bash
npm install
npm test              # 단위·컴포넌트 테스트(서버 불필요)
npm run typecheck     # 타입 검사
npx expo start        # 개발 서버
```

`.env.local`이 있으면 Supabase 모드, 없으면 데모(메모리) 모드로 실행된다. 로그인 화면 하단에 현재 백엔드가 표시된다.
**`.env.local`을 만들거나 바꾸면 개발 서버를 재시작해야 한다**(`EXPO_PUBLIC_*`는 번들할 때 값이 들어간다).

## 화면 확인 방법

| 방법 | 명령 | 비고 |
|------|------|------|
| 브라우저 | `npx expo start --web` → http://localhost:8081 | 개발자 도구에서 모바일 크기(예: 390×844)로 보면 휴대폰 화면과 비슷하다 |
| 휴대폰(Expo Go) | `npx expo start` → 터미널 QR을 Expo Go(Android) 또는 카메라(iOS)로 스캔 | PC와 휴대폰이 같은 와이파이에 있어야 한다. 안 되면 `npx expo start --tunnel` |
| Android 에뮬레이터 | `npx expo start --android` | Android Studio(SDK·에뮬레이터) 설치 필요 — 현재 개발 PC에는 없음 |

QR 스캔 시연: PC 브라우저에서 관리자로 로그인해 물품 상세의 QR을 띄우고, 휴대폰 Expo Go에서 회원으로 로그인해 스캔한다.
Supabase 모드에서는 새로 등록한 물품도 기기 간에 공유된다.

## Supabase 연결

1. Supabase 프로젝트 생성. Authentication → Sign In / Providers → Email의 **Confirm email을 끈다**(시연용 — 켜 두면
   확인 메일 링크가 localhost로 가서 휴대폰에서 열리지 않는다).
2. SQL 적용: SQL Editor에 붙여 넣거나, Session pooler 주소로 접속해 실행한다(직접 접속 주소는 IPv6 전용).
   - `supabase/migrations/0001_init.sql` — 스키마·RLS·RPC
   - `supabase/migrations/0002_seed_items.sql` — 시드 물품 6개(데모와 같은 고정 id)
3. 데모 계정: 앱에서 `admin@billim.dev`, `member@billim.dev`, `member2@billim.dev`(비밀번호 `demo1234`)로 가입한 뒤
   `update public.profiles set role = 'admin' where email = 'admin@billim.dev';`
4. `.env.example`을 `.env.local`로 복사해 Project URL과 anon(publishable) 키를 넣는다. **service_role 키 금지.**
5. 통합 테스트:
   ```bash
   SUPABASE_TEST_URL=<url> SUPABASE_TEST_ANON_KEY=<key> npm run test:supabase
   ```
   테스트가 만든 물품은 이름이 `[테스트]`로 시작한다. 삭제 정책이 없으므로 SQL로 정리한다:
   ```sql
   delete from public.loans where item_id in (select id from public.items where name like '[테스트]%');
   delete from public.requests where item_id in (select id from public.items where name like '[테스트]%');
   delete from public.items where name like '[테스트]%';
   ```

## 설치 빌드 (EAS, 선택)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

`eas.json`은 아직 없다. 처음 실행하면 CLI가 만들어 준다. 빌드에 Supabase 값을 넣으려면 EAS 환경변수로 등록한다.
