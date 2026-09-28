# Frontend-App — AI 하네스

이 폴더는 AI 워커(오케스트레이터, codex-critic 등)가 Frontend-App("빌림") 작업 전에 읽는 정본 문서 모음이다.
구조는 형제 모듈 `Java-Service-Tree-Framework-Frontend-Web/docs/ai`와 같다.

| 폴더 | 용도 | 상태 |
|------|------|------|
| `01_project_overview/` | 프로젝트 목적·범위, 요구사항 정의서 v1.1, 요청문(TASK) 변환본 | 확정 |
| `02_tech_stack/` | 언어·프레임워크·버전 | 확정 |
| `03_directory_structure/` | 디렉터리 배치 규약 | 확정 |
| `04_coding_standards/` | 코딩·테스트(TDD) 규칙 | 확정 |
| `05_prompt_templates/` | 요청문·codex 리뷰 brief 템플릿 | 초안 |
| `06_domain_playbooks/` | 도메인별 작업 규칙(대여 상태 전이) | 확정 |
| `06_page_playbooks/` | 화면별 작업 규칙(6개 화면) | 확정 |
| `07_review_checklist/` | 제출 전 자가검토 체크리스트 | 확정 |
| `08_domain_glossary/` | 용어 단일 출처 | 확정 |
| `09_api_contract/` | 앱 ↔ 백엔드 API 계약, 오류 코드 | 확정 |
| `10_data_model/` | DB 테이블·클라이언트 타입 | 확정 |
| `11_changelog/` | 변경 이력(codex 리뷰 반영 포함) | 확정 |
| `12_known_issues/` | 함정·의도된 단순화 | 확정 |
| `13_deploy_runbook/` | 실행·화면 확인·빌드 절차 | 초안 |

> 불일치 발견 시: 실제 코드를 따르고 불일치를 보고한다. 문서를 임의로 고치지 않는다.
