# Frontend-App — 프롬프트 템플릿

## 1. 요청문(TASK) — `요구사항_TASK_전환_Format.md` 규칙

```text
REQ-F-0NN

목표: <무엇이 되어 있으면 끝인지>. 완료 조건 =
① <검증 가능한 조건>
② <검증 가능한 조건>
성격: 코드 구현
target_repo: {Service-Tree-Framework-Frontend-App}
write_scope: none
워커: 생산=Claude Code(Orchestrator), 리뷰=codex-critic
산출물: 소스(커밋) — <주요 파일>
제약: <Do NOT만>
```

## 2. codex-critic 리뷰 brief (비평 모드)

MultiAgent 루트 `tasks/<task>/workers/codex-critic/brief.md`에 둔다(1200자 이내, 파일 내용 inline 금지).

```text
비평 모드. 쓰기 금지.
target_repo: <절대경로>
write_scope: none
Objective: <리뷰 범위 커밋/파일>이 요청문 <REQ-ID>와 docs/ai/04·06·09를 지키는지 비평
Input: docs/ai/01_project_overview/task-requests.md, <파일 경로들>
Output: 심각도(High/Medium/Low)별 지적 — 파일:줄, 실패 시나리오, 수정 제안. 없으면 "없음"
Do NOT: 스타일 취향 지적, 요청 범위 밖 기능 제안
```

## 3. 화면 추가

```text
<화면명> 화면을 추가한다. 06_page_playbooks/<page>.md를 먼저 작성하고,
수용 기준을 RNTL 테스트로 먼저 쓴 뒤 구현한다. StateView·SubmitButton을 재사용한다.
```
