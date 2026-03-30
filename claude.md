# 한국 주식 트리맵 대시보드 구현

React + TypeScript + D3.js로 한국 주식 마켓맵 대시보드를 만들어줘.

## 기술 스택
- React + TypeScript (Vite)
- D3.js (d3-hierarchy treemap)
- CSS Modules 또는 Tailwind

## 데이터 구조
`/public/market_data.json` 파일을 fetch로 로드. 구조:
```json
{
  "date": "2026-03-30",
  "updated": "2026-03-30 16:10",
  "sectors": [
    {
      "name": "전기·전자",
      "stocks": [
        {
          "code": "005930",
          "name": "삼성전자",
          "price": 54800,
          "marketCap": 400000000000000,
          "change": {
            "1d": -2.67,
            "1w": -5.10,
            "1m": -8.20,
            "3m": -12.10,
            "6m": -15.30,
            "1y": -18.00
          }
        }
      ]
    }
  ]
}
```

## 구현 요구사항

### 트리맵
- D3 `treemap()` 2단계 계층: 섹터(그룹) > 종목(셀)
- 박스 크기: marketCap 기준
- 색상: 변동률 기준 파란색(하락) ↔ 빨간색(상승)
  - -3% 이하: #1a5da8 (진파랑)
  - -2%: #2f7fd4
  - -0.5%: #4a8fd4
  - 0% 근처: #3a3a4a (다크그레이)
  - +0.5%: #b03030
  - +2%: #d42020
  - +3% 이상: #a01818 (진빨강)
- 섹터 경계: paddingOuter=4, 섹터명 좌상단 표시
- 종목 셀: 종목명 + 변동률(%) 텍스트, 박스 크기에 따라 폰트 크기 조절
- 작은 박스는 텍스트 생략 처리

### UI 구성
- 상단 필터 버튼: 1일 / 1주 / 1개월 / 3개월 / 6개월 / 1년
- 필터 변경 시 색상 즉시 업데이트 (레이아웃은 marketCap 고정)
- 우하단 범례: -3% ─ 색상바 ─ +3%
- 우상단 업데이트 시각 표시 (data.updated 값)
- 마우스 호버 툴팁: 종목명, 현재가, 변동률, 시가총액, 섹터

### 코드 구조 (파일 분리)
```
src/
  components/
    Treemap.tsx       # D3 트리맵 렌더링
    Tooltip.tsx       # 호버 툴팁
    FilterBar.tsx     # 기간 필터 버튼
    Legend.tsx        # 색상 범례
  hooks/
    useMarketData.ts  # fetch + 로딩/에러 상태
  utils/
    colorScale.ts     # 변동률 → 색상 변환
    format.ts         # 숫자 포맷 (시가총액, 변동률)
  types/
    market.ts         # TypeScript 타입 정의
  App.tsx
```

### Mock 데이터
`/public/market_data.json`에 삼성전자, SK하이닉스, LG에너지솔루션, 현대차, 기아,
KB금융, 신한지주, 삼성바이오로직스, 셀트리온, NAVER, 카카오 등
15개 종목 Mock 데이터를 포함해서 만들어줘.

### 기타
- 화면 리사이즈 대응 (ResizeObserver)
- 로딩 스피너, 에러 메시지 처리
- `npm run dev`로 바로 실행되어야 함