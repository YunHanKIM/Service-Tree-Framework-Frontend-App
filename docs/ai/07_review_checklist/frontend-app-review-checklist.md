# Frontend-App — 제출 전 자가검토 체크리스트

- [ ] `npm test` 통과
- [ ] `npm run typecheck` 통과
- [ ] 새 로직에 테스트가 먼저 있는가(`test:` 커밋이 `feat:` 커밋보다 앞서는가)
- [ ] 기존 패턴(Expo Router, TanStack Query 훅, StateView/SubmitButton)과 일치하는가
- [ ] `src/app/` 안에 라우트가 아닌 파일을 두지 않았는가

## 빌림 전용 항목

- [ ] 상태 변경에 낙관적 업데이트를 쓰지 않았는가, 성공 후 관련 쿼리를 무효화하는가
- [ ] 변경 버튼이 처리 중 비활성화되는가(두 번 탭 → 요청 1회)
- [ ] 오류 문구를 `errorMessage()`로 만드는가(하드코딩 금지)
- [ ] 새 데이터 화면에 로딩·빈 목록·오류(재시도)가 모두 있는가
- [ ] 권한이 필요한 동작을 서버(데모 API·SQL RPC 양쪽)에서도 막는가
- [ ] 데모 API 규칙을 바꿨다면 `supabase/migrations`도 같이 바꿨는가(또는 반대)
- [ ] 누를 수 있는 요소에 접근성 이름이 있는가, 상태를 색만으로 표시하지 않는가
- [ ] 바뀐 화면 동작을 `06_page_playbooks/<page>.md`에 반영했는가
- [ ] 웹(`npx expo start --web`)에서 실제로 눌러 확인했는가
