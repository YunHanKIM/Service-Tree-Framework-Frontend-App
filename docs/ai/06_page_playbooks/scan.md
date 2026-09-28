# 페이지 플레이북 — QR 스캔 (`src/app/scan.tsx`)

관련 요청문: REQ-F-003, REQ-F-004

## 흐름

1. `useCameraPermissions()` — 권한 정보를 아직 모르면 진행 표시.
2. 권한 없음 → `CameraPermissionView`
   - `canAskAgain = true`: "카메라 권한 허용" 버튼
   - `canAskAgain = false`: 설정 안내 + "설정 열기"(`Linking.openSettings`)
   - 두 경우 모두 "목록에서 검색하기"(뒤로 가기)
3. 권한 있음 → `CameraView`(바코드 `qr`만). 감지 시 `useScanOnce.handle` → 잠금.
4. `parseItemQr` 실패 → 원인별 문구(빌림 QR 아님 / 손상된 QR). 성공 → `api.getItem`으로 등록 여부 확인 →
   `NOT_FOUND`면 "등록되지 않은 물품", 있으면 `router.replace('/item/[id]')`.
5. 오류 패널의 "다시 스캔"이 `scan.reset()`으로 잠금을 푼다.

## 알아야 할 것

- 잠금 중에는 `onBarcodeScanned`를 `undefined`로 넘겨 카메라 콜백 자체를 끈다. 잠금은 ref 기준이라
  렌더 전 연속 호출도 막힌다(`useScanOnce` 테스트).
- 웹에서는 브라우저 카메라 권한 정책을 따른다(localhost 또는 HTTPS).
