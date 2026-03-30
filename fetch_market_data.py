"""
한국 주식 마켓맵 데이터 수집기
FinanceDataReader 사용 · KRX 시총 상위 종목 자동 분류
매일 장 마감 후 실행
"""

import json
import os
from datetime import datetime, timedelta
import FinanceDataReader as fdr
import pandas as pd

# ── 설정 ──────────────────────────────────────────────
OUTPUT_PATH = "./public/market_data.json"

PERIODS = {
    "1d":  1,
    "1w":  7,
    "1m":  30,
    "3m":  90,
    "6m":  180,
    "1y":  365,
}

# Industry → Sector 매핑
INDUSTRY_TO_SECTOR = {
    # 전기·전자
    "통신 및 방송 장비 제조업": "전기·전자",
    "반도체 제조업": "전기·전자",
    "전자부품 제조업": "전기·전자",
    "전동기, 발전기 및 전기 변환 · 공급 · 제어 장치 제조업": "전기·전자",
    "절연선 및 케이블 제조업": "전기·전자",
    "전기업": "전기·전자",
    # 운송장비·부품
    "자동차용 엔진 및 자동차 제조업": "운송장비·부품",
    "자동차 신품 부품 제조업": "운송장비·부품",
    "철도장비 제조업": "운송장비·부품",
    "고무제품 제조업": "운송장비·부품",
    # 조선·방산·운송
    "선박 및 보트 건조업": "조선·방산",
    "항공기,우주선 및 부품 제조업": "조선·방산",
    "무기 및 총포탄 제조업": "조선·방산",
    "해상 운송업": "조선·방산",
    "항공 여객 운송업": "조선·방산",
    "기타 운송관련 서비스업": "운송장비·부품",
    # 금융
    "기타 금융업": "금융",
    "금융 지원 서비스업": "금융",
    "보험업": "금융",
    "은행 및 저축기관": "금융",
    "신탁업 및 집합투자업": "금융",
    # 제약·바이오
    "기초 의약물질 제조업": "제약·바이오",
    "의약품 제조업": "제약·바이오",
    "자연과학 및 공학 연구개발업": "제약·바이오",
    # 기계·장비
    "일반 목적용 기계 제조업": "기계·장비",
    "특수 목적용 기계 제조업": "기계·장비",
    # IT·통신
    "자료처리, 호스팅, 포털 및 기타 인터넷 정보매개 서비스업": "IT서비스",
    "소프트웨어 개발 및 공급업": "IT서비스",
    "컴퓨터 프로그래밍, 시스템 통합 및 관리업": "IT서비스",
    "전기 통신업": "IT서비스",
    # 화학·에너지
    "기초 화학물질 제조업": "화학",
    "기타 화학제품 제조업": "화학",
    "석유 정제품 제조업": "화학",
    "일차전지 및 이차전지 제조업": "2차전지",
    # 철강·소재
    "1차 비철금속 제조업": "철강·소재",
    "1차 철강 제조업": "철강·소재",
    # 건설
    "토목 건설업": "건설",
    "건물 건설업": "건설",
    "건축기술, 엔지니어링 및 관련 기술 서비스업": "건설",
    # 기타 (유통·미디어·식품 등)
    "기타 전문 도매업": "유통·서비스",
    "상품 중개업": "유통·서비스",
    "오디오물 출판 및 원판 녹음업": "유통·서비스",
    "담배 제조업": "유통·서비스",
    "기타 식품 제조업": "유통·서비스",
}

# 섹터별 최대 종목 수
SECTOR_LIMITS = {
    "전기·전자": 12,
    "운송장비·부품": 8,
    "조선·방산": 8,
    "금융": 10,
    "제약·바이오": 6,
    "기계·장비": 5,
    "IT서비스": 8,
    "화학": 6,
    "2차전지": 5,
    "철강·소재": 4,
    "건설": 5,
    "유통·서비스": 5,
}

DEFAULT_LIMIT = 3
# ──────────────────────────────────────────────────────


def build_stock_list() -> dict[str, list[dict]]:
    """KRX 상장 종목에서 시총 상위 종목을 섹터별로 자동 분류"""
    print("KRX 종목 목록 로딩...")
    krx = fdr.StockListing("KRX")
    desc = fdr.StockListing("KRX-DESC")

    merged = krx.merge(desc[["Code", "Name", "Industry"]], on="Code", how="left", suffixes=("", "_desc"))
    # KOSPI 보통주만
    merged = merged[merged["Market"] == "KOSPI"]
    merged = merged[~merged["Name"].str.contains(r"우$|우B$|우C$|스팩", regex=True, na=False)]
    merged = merged[merged["Marcap"] > 0]
    merged = merged.sort_values("Marcap", ascending=False)

    sectors: dict[str, list[dict]] = {}

    for _, row in merged.iterrows():
        industry = row.get("Industry", "")
        sector = INDUSTRY_TO_SECTOR.get(industry)
        if sector is None:
            continue

        limit = SECTOR_LIMITS.get(sector, DEFAULT_LIMIT)
        if sector not in sectors:
            sectors[sector] = []
        if len(sectors[sector]) >= limit:
            continue

        sectors[sector].append({
            "code": row["Code"],
            "name": row["Name"],
            "marketCap": int(row["Marcap"]),
        })

    total = sum(len(v) for v in sectors.values())
    print(f"총 {total}개 종목 선정 ({len(sectors)}개 섹터)")
    for s, stocks in sectors.items():
        print(f"  {s}: {len(stocks)}개")

    return sectors


def fetch_stock_changes(code: str) -> dict | None:
    """종목 1개의 현재가 + 기간별 변동률 수집"""
    try:
        today = datetime.today()
        start = today - timedelta(days=400)

        df = fdr.DataReader(code, start=start.strftime("%Y-%m-%d"))
        if df.empty:
            return None

        latest = df.iloc[-1]
        current_price = float(latest["Close"])

        changes = {}
        for period_key, days in PERIODS.items():
            target_date = today - timedelta(days=days)
            past = df[df.index <= target_date]
            if past.empty:
                past_price = float(df.iloc[0]["Close"])
            else:
                past_price = float(past.iloc[-1]["Close"])

            if past_price > 0:
                changes[period_key] = round(
                    (current_price - past_price) / past_price * 100, 2
                )
            else:
                changes[period_key] = 0.0

        return {"price": int(current_price), "change": changes}

    except Exception as e:
        print(f"  [오류] {code}: {e}")
        return None


def fetch_all() -> dict:
    """전체 섹터 데이터 수집 후 JSON 구조 반환"""
    sector_stocks = build_stock_list()

    result = {
        "date": datetime.today().strftime("%Y-%m-%d"),
        "updated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "sectors": [],
    }

    for sector_name, stock_list in sector_stocks.items():
        print(f"\n[{sector_name}] 수집 중... ({len(stock_list)}개)")
        stocks = []
        for s in stock_list:
            data = fetch_stock_changes(s["code"])
            if data:
                stocks.append({
                    "code": s["code"],
                    "name": s["name"],
                    "price": data["price"],
                    "marketCap": s["marketCap"],
                    "change": data["change"],
                })
                print(
                    f"  ✓ {s['name']} ({s['code']}) — "
                    f"{data['price']:,}원 / {data['change']['1d']:+.2f}%"
                )
            else:
                print(f"  ✗ {s['name']} ({s['code']}) — 데이터 없음")

        if stocks:
            result["sectors"].append({"name": sector_name, "stocks": stocks})

    return result


def save(data: dict) -> None:
    os.makedirs(os.path.dirname(OUTPUT_PATH) or ".", exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n저장 완료 → {OUTPUT_PATH}")


if __name__ == "__main__":
    print(f"=== 마켓맵 데이터 수집 시작 ({datetime.now().strftime('%Y-%m-%d %H:%M')}) ===")
    data = fetch_all()
    save(data)
    total = sum(len(s["stocks"]) for s in data["sectors"])
    print(f"\n수집 완료 — 총 {total}개 종목, {len(data['sectors'])}개 섹터")
