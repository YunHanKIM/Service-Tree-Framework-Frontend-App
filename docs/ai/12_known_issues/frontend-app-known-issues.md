# Frontend-App — 함정·안티패턴

## 의도된 단순화 (포트폴리오 범위)

- **기본 백엔드는 데모(메모리) 구현이다.** 설치 즉시 화면을 볼 수 있게 하려는 선택이다. 앱을 새로고침하면
  데이터가 시드 상태로 돌아간다. 데모 계정: `member@billim.dev`, `member2@billim.dev`, `admin@billim.dev`
  (비밀번호 `demo1234`).
- **Supabase 구현은 실제 프로젝트(ap-northeast-2)에서 검증했다(2026-09-28).** `npm run test:supabase` 통합 테스트
  10개가 역할 상승 차단·RLS 가시성·중복 신청·자동 거절·동시 승인·반납·취소를 실서버로 확인한다. 두 구현의 규칙은
  `demoApi.test.ts`(데모)와 `supabaseApi.integration.test.ts`(실서버)가 같은 시나리오로 고정한다.
- **물품 사진 업로드는 제외했다**(요구사항상 선택 범위). `image_path` 컬럼만 있다.

## 함정

- **RNTL 14의 `render`·`renderHook`은 Promise다.** `await` 없이 쓰면 화면이 비어 있는 채로 단언이 실행된다.
- **TypeScript 6 + jest 타입**: `tsconfig.json`의 `types`에 `jest`를 넣지 않으면 테스트 파일에서 `describe`를 못 찾는다.
- **expo-camera의 연속 감지**: `onBarcodeScanned`는 같은 QR을 프레임마다 호출한다. `useScanOnce`로 잠그지 않으면
  화면 이동이 여러 번 일어난다.
- **데모 API의 원자성**: `await delay()` 뒤의 검사와 변경 사이에 `await`를 넣으면 동시 승인 테스트가 깨진다.
  검사·변경은 반드시 같은 동기 구간에 둔다.
- **자동 거절 판별은 사유 문자열로 한다.** `approve_request`가 `CONFLICT`와 `ALREADY_PROCESSED`를 구분할 때
  `reject_reason`이 자동 거절 문구인지 본다. 문구를 바꾸면 `demoApi.ts`의 `AUTO_REJECT_REASON`과 SQL 두 곳을 같이 바꿀 것.
- **데모 백엔드는 브라우저 탭·기기마다 따로다.** 두 기기 동시 승인은 데모 앱으로 재현되지 않는다 — `demoApi.test.ts`로 검증한다.
- **시드 물품 id는 고정값이다(`b1110000-0000-4000-8000-00000000000N`).** 처음에는 무작위 uuid였는데, PC 브라우저에
  띄운 관리자 QR을 휴대폰 Expo Go로 스캔하면 두 기기의 id가 달라 "등록되지 않은 물품"이 떴다(2026-09-28 사용자 보고).
  고정 id로 바꿔 시드 물품 6개는 어느 기기에서 띄운 QR이든 인식된다. **단, 데모 모드에서 관리자가 새로 등록한 물품은
  그 기기에만 있으므로** 다른 기기로 스캔하면 여전히 인식되지 않는다 — 기기 간 공유는 Supabase 연결 시에만 된다.
- **CI 모드 개발 서버는 코드 변경을 다시 읽지 않는다.** `CI=1 npx expo start`는 watch가 꺼져 있다. 코드를 바꾼 뒤 화면을
  확인하려면 서버 프로세스를 완전히 종료하고(포트 8081 점유 확인) 다시 띄울 것.
- **테스트 환경 설정(`jest.setup.js`)**: AsyncStorage 네이티브 모듈 목, TanStack Query 알림 스케줄러를 동기로 바꿔
  act() 경고를 없앴다.
- **jest-expo는 전역 `fetch`를 Expo 스텁으로 바꾼다.** `@jest-environment node`를 붙여도 setup 파일이 먼저 교체하므로
  실제 HTTP가 필요한 테스트는 `jest.integration.config.js`(Node 환경, jest-expo 미사용)로 돌린다. 증상은
  `"undefined" is not valid JSON`(auth-js가 응답 본문을 못 읽음).
- **React Native에서는 탭을 오가도 쿼리가 다시 조회되지 않는다.** 다른 기기의 승인이 이미 열린 화면에 반영되지 않아
  `useRefreshOnFocus`(화면 포커스)와 `AppState → focusManager`(앱 포그라운드)를 넣었다. 새 데이터 화면에도 적용할 것.
  `useRefreshOnFocus`에 넘기는 함수가 렌더마다 새로 만들어져도 되도록 훅이 ref로 들고 있다.
- **Supabase 직접 접속 주소(`db.<ref>.supabase.co`)는 IPv6 전용이다.** IPv4 네트워크에서는 ENOTFOUND — SQL 실행은
  Session pooler 주소(`aws-0-<region>.pooler.supabase.com`, 사용자 `postgres.<ref>`)로 한다.
- **개발 PC에 Android SDK가 없다.** 화면 확인은 웹(`--web`)이나 휴대폰 Expo Go로 한다. 웹에서는 카메라 권한
  흐름이 브라우저 정책을 따른다(HTTPS 또는 localhost 필요).
