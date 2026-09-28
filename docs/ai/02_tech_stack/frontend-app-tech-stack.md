# Frontend-App — 기술 스택

`package.json` 기준(2026-09-28). 버전을 올릴 때는 `npx expo install`로 SDK 호환 버전을 받는다.

| 구분 | 패키지 | 버전 | 비고 |
|------|--------|------|------|
| 런타임 | expo | ~57.0 | SDK 57. 학습 데이터 기억 대신 `docs.expo.dev/versions/v57.0.0/` 확인 |
| | react-native / react | 0.86.3 / 19.2.3 | |
| 언어 | typescript | ~6.0 | `tsconfig.json`에 `types: ["jest","node"]` 명시 필요(아래 참조) |
| 라우팅 | expo-router | ~57.0 | 파일 기반, 라우트는 `src/app/` |
| 카메라 | expo-camera | ~57.0 | `CameraView` + `useCameraPermissions`, 바코드 `qr`만 |
| 서버 상태 | @tanstack/react-query | ^5 | 조회 캐시·무효화. 변경은 낙관적 업데이트 없이 성공 후 무효화 |
| 백엔드 | @supabase/supabase-js | ^2 | 세션 저장은 `@react-native-async-storage/async-storage` |
| QR 표시 | react-native-qrcode-svg + react-native-svg | | 관리자 물품 QR |
| 웹 | react-native-web, react-dom | | `npx expo start --web`으로 화면 확인 |
| 테스트 | jest-expo, jest 29 | ~57 / ~29.7 | preset `jest-expo` |
| | @testing-library/react-native | ^14 | **v14부터 `render`·`renderHook`이 Promise** — 반드시 `await` |
| | test-renderer | ^1 | RNTL 14의 peer dependency |

## 알아야 할 것

- TypeScript 6은 `@types/*`를 자동으로 포함하지 않는 설정이 있어 `describe`/`expect`를 못 찾는다 →
  `tsconfig.json`의 `compilerOptions.types`에 `jest`, `node`를 명시했다.
- Windows에서 `npx expo install <pkg> -- --dev`는 Git Bash에서 인자가 먹지 않아 dependencies로 들어갔다.
  테스트 패키지는 `devDependencies`로 옮겨 두었다.
