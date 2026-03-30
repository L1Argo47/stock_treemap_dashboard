"""
자동 스케줄러 — 매일 오후 4시 실행 (장 마감 30분 후)
실행: python scheduler.py
"""

import schedule
import time
import subprocess
from datetime import datetime


def job():
    print(f"\n[{datetime.now()}] 데이터 수집 시작...")
    subprocess.run(["python", "fetch_market_data.py"])


# 매일 오후 4시 실행 (KST 기준)
schedule.every().day.at("16:00").do(job)

# 평일만 실행하고 싶다면:
# schedule.every().monday.at("16:00").do(job)
# schedule.every().tuesday.at("16:00").do(job)
# ... (월~금 반복)

print("스케줄러 시작 — 매일 16:00에 데이터 수집")
print("종료: Ctrl+C\n")

# 시작 시 즉시 1회 실행 (주석 해제하면 활성화)
# job()

while True:
    schedule.run_pending()
    time.sleep(60)