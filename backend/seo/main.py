from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import io, csv, asyncio, json, uuid

from database import Base, engine, get_db
from models import AnalysisRecord, AnalyzeRequest, AnalyzeResponse, SummaryResponse, KPI, IssueCounts
from analysis import analyze_url

Base.metadata.create_all(bind=engine)

app = FastAPI(title="RankPro SEO Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory progress map
progress = {}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.websocket("/ws/progress")
async def ws_progress(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            msg = await ws.receive_text()
            data = json.loads(msg)
            job_id = data.get("job_id")
            pct = progress.get(job_id, 0)
            await ws.send_json({"job_id": job_id, "progress": pct})
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        return

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest, db: Session = Depends(get_db)):
    job_id = str(uuid.uuid4())
    progress[job_id] = 5

    # Pretend multi-phase job to make WebSocket updates meaningful
    progress[job_id] = 10
    result = await analyze_url(req.url)
    progress[job_id] = 70

    # Save per-category records
    created_at = datetime.utcnow().isoformat()
    for cat in req.categories:
        rec = AnalysisRecord(
            url=req.url,
            category=cat,
            summary=result["kpis"],
            issues=result["issues"],
            rankings=result["rankings"],
        )
        db.add(rec)
    db.commit()
    progress[job_id] = 100

    response = AnalyzeResponse(
        url=req.url,
        kpis=KPI(**result["kpis"]),
        issues=IssueCounts(**result["issues"]),
        rankings=result["rankings"],
        created_at=created_at,
    )
    # Include job_id header so frontend can open ws
    headers = {"X-Job-Id": job_id}
    return JSONResponse(content=json.loads(response.model_dump_json()), headers=headers)

@app.get("/api/summary", response_model=SummaryResponse)
def summary(url: str, category: str = "seo", days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    q = db.query(AnalysisRecord).filter(
        AnalysisRecord.url == url,
        AnalysisRecord.category == category,
        AnalysisRecord.created_at >= since
    ).order_by(AnalysisRecord.created_at.asc()).all()

    # Aggregate
    if not q:
        k = {"seo_score": 0, "organic_traffic": 0, "keyword_rankings": 0, "backlinks": 0}
        trend = []
    else:
        k = {"seo_score": 0, "organic_traffic": 0, "keyword_rankings": 0, "backlinks": 0}
        trend = []
        for rec in q:
            for key in k:
                k[key] += int(rec.summary.get(key, 0))
            trend.append({
                "date": rec.created_at.isoformat(),
                "seo": int(rec.summary.get("seo_score", 0)),
                "brand": int(rec.summary.get("keyword_rankings", 0)),
                "social": int(rec.summary.get("backlinks", 0))
            })
        for key in k:
            k[key] = int(k[key] / max(1, len(q)))

    return SummaryResponse(
        url=url,
        period_days=days,
        category=category,
        totals=k,
        trend=trend
    )

@app.get("/api/issues")
def get_issues(url: str, days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    rec = db.query(AnalysisRecord).filter(
        AnalysisRecord.url == url,
        AnalysisRecord.created_at >= since
    ).order_by(AnalysisRecord.created_at.desc()).first()
    return rec.issues if rec else {}

@app.get("/api/rankings")
def get_rankings(url: str, q: str = Query(default=None, alias="query"), db: Session = Depends(get_db)):
    rec = db.query(AnalysisRecord).filter(
        AnalysisRecord.url == url
    ).order_by(AnalysisRecord.created_at.desc()).first()
    detailed = rec.rankings.get("detailed", []) if rec else []
    if q:
        detailed = [r for r in detailed if q.lower() in r["keyword"].lower()]
    return {"items": detailed}

@app.get("/api/trends")
def get_trends(url: str, days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    q = db.query(AnalysisRecord).filter(
        AnalysisRecord.url == url,
        AnalysisRecord.created_at >= since
    ).order_by(AnalysisRecord.created_at.asc()).all()
    trend = []
    for rec in q:
        trend.append({
            "date": rec.created_at.isoformat(),
            "seo": int(rec.summary.get("seo_score", 0)),
            "brand": int(rec.summary.get("keyword_rankings", 0)),
            "social": int(rec.summary.get("backlinks", 0))
        })
    return {"items": trend}

@app.get("/api/export/json")
def export_json(url: str, db: Session = Depends(get_db)):
    rec = db.query(AnalysisRecord).filter(AnalysisRecord.url == url).order_by(AnalysisRecord.created_at.desc()).first()
    if not rec:
        return JSONResponse({"error": "No data"}, status_code=404)
    return rec.summary | {"issues": rec.issues, "rankings": rec.rankings}

@app.get("/api/export/csv")
def export_csv(url: str, db: Session = Depends(get_db)):
    rec = db.query(AnalysisRecord).filter(AnalysisRecord.url == url).order_by(AnalysisRecord.created_at.desc()).first()
    if not rec:
        return JSONResponse({"error": "No data"}, status_code=404)
    # CSV with KPIs and issue counts
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["metric","value"])
    for k,v in rec.summary.items():
        writer.writerow([k, v])
    for k,v in rec.issues.items():
        writer.writerow([k, v])
    buf.seek(0)
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=rankpro_export.csv"
    })
