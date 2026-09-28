# Frontend-App — 함정·안티패턴

## 의도된 단순화 (포트폴리오 범위)

- **기본 백엔드는 데모(메모리) 구현이다.** 설치 즉시 화면을 볼 수 있게 하려는 선택이다. 앱을 새로고침하면
  데이터가 시드 상태로 돌아간다. 데모 계정: `member@billim.dev`, `member2@billim.dev`, `admin@billim.dev`
  (비밀번호 `demo1234`).
- **Supabase 구현은 실제 프로젝트에 연결해 검증하지 않았다.** 개발 환경에 Supabase 프로젝트·Docker가 없어
  SQL과 `supabaseApi.ts`는 코드 리뷰(codex-critic)까지만 거쳤다. 연결 절차는 `13_deploy_runbook` 참조.
  두 구현의 규칙이 같은지는 `demoApi.test.ts` 시나리오를 기준으로 맞춘다.
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
- **CI 모드 개발 서버는 코드 변경을 다시 읽지 않는다.** `CI=1 npx expo start`는 watch가 꺼져 있다. 코드를 바꾼 뒤 화면을
  확인하려면 서버 프로세스를 완전히 종료하고(포트 8081 점유 확인) 다시 띄울 것.
- **테스트 환경 설정(`jest.setup.js`)**: AsyncStorage 네이티브 모듈 목, TanStack Query 알림 스케줄러를 동기로 바꿔
  act() 경고를 없앴다.
- **개발 PC에 Android SDK가 없다.** 화면 확인은 웹(`--web`)이나 휴대폰 Expo Go로 한다. 웹에서는 카메라 권한
  흐름이 브라우저 정책을 따른다(HTTPS 또는 localhost 필요).
