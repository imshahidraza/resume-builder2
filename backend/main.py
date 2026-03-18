import os
import json
import uuid
import smtplib
from datetime import datetime, timedelta
from typing import List, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
import schemas
from database import engine, get_db, Base

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.units import inch
import pypdf

load_dotenv()

# ============================
# APP SETUP
# ============================
app = FastAPI(title="Resume Builder API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "admin123")
APP_START_TIME = None
ACCESS_DURATION = timedelta(minutes=20)
PDF_DIR = "generated_pdfs"
os.makedirs(PDF_DIR, exist_ok=True)


# ============================
# HELPERS
# ============================
def get_or_set_start_time():
    global APP_START_TIME
    env_path = ".env"
    if APP_START_TIME:
        return APP_START_TIME

    with open(env_path, "r") as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        if line.startswith("APP_START_TIME="):
            val = line.strip().split("=", 1)[1]
            if val:
                APP_START_TIME = datetime.fromisoformat(val)
                return APP_START_TIME
            else:
                APP_START_TIME = datetime.utcnow()
                lines[i] = f"APP_START_TIME={APP_START_TIME.isoformat()}\n"
                with open(env_path, "w") as f:
                    f.writelines(lines)
                return APP_START_TIME

    APP_START_TIME = datetime.utcnow()
    return APP_START_TIME


def is_access_allowed():
    return True


def generate_resume_id(db: Session):
    year = datetime.utcnow().year
    count = db.query(models.Resume).count() + 1
    return f"RES-{year}-{1000 + count}"


def generate_password(full_name: str, dob: str):
    name_part = full_name.strip().split()[0]
    dob_part = dob.replace("-", "").replace("/", "")
    return f"{name_part}-{dob_part}"


def log_activity(db: Session, resume_id: str, action: str):
    log = models.ActivityLog(resume_id=resume_id, action=action)
    db.add(log)
    db.commit()


def generate_pdf(resume: models.Resume, password: Optional[str] = None) -> str:
    data = {
        "full_name": resume.full_name,
        "email": resume.email,
        "phone": resume.phone,
        "dob": resume.dob,
        "summary": resume.summary,
        "education": json.loads(resume.education),
        "experience": json.loads(resume.experience),
        "skills": json.loads(resume.skills),
        "projects": json.loads(resume.projects),
    }

    filename = f"{PDF_DIR}/{resume.resume_id}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4,
                            rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    name_style = ParagraphStyle('Name', fontSize=22, fontName='Helvetica-Bold',
                                 textColor=colors.HexColor('#1a1a2e'), spaceAfter=4)
    contact_style = ParagraphStyle('Contact', fontSize=9, textColor=colors.grey, spaceAfter=12)
    section_style = ParagraphStyle('Section', fontSize=12, fontName='Helvetica-Bold',
                                    textColor=colors.HexColor('#1a1a2e'), spaceBefore=12, spaceAfter=4)
    body_style = ParagraphStyle('Body', fontSize=9, leading=14, spaceAfter=4)
    sub_style = ParagraphStyle('Sub', fontSize=9, fontName='Helvetica-Bold', spaceAfter=2)

    story = []

    # Header
    story.append(Paragraph(data['full_name'], name_style))
    story.append(Paragraph(f"{data['email']}  |  {data['phone']}", contact_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1a1a2e')))

    # Summary
    story.append(Paragraph("SUMMARY", section_style))
    story.append(Paragraph(data['summary'], body_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))

    # Experience
    story.append(Paragraph("EXPERIENCE", section_style))
    for exp in data['experience']:
        story.append(Paragraph(f"{exp['role']} — {exp['company']}", sub_style))
        story.append(Paragraph(exp['duration'], ParagraphStyle('dur', fontSize=8, textColor=colors.grey)))
        story.append(Paragraph(exp['description'], body_style))

    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))

    # Education
    story.append(Paragraph("EDUCATION", section_style))
    for edu in data['education']:
        story.append(Paragraph(f"{edu['degree']} — {edu['institution']}", sub_style))
        story.append(Paragraph(edu['year'], ParagraphStyle('yr', fontSize=8, textColor=colors.grey)))

    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))

    # Skills
    story.append(Paragraph("SKILLS", section_style))
    story.append(Paragraph(", ".join(data['skills']), body_style))

    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))

    # Projects
    story.append(Paragraph("PROJECTS", section_style))
    for proj in data['projects']:
        story.append(Paragraph(proj['name'], sub_style))
        story.append(Paragraph(f"Tech: {proj['technologies']}", ParagraphStyle('tech', fontSize=8, textColor=colors.grey)))
        story.append(Paragraph(proj['description'], body_style))

    doc.build(story)

    # Password protect
    if password:
        protected = f"{PDF_DIR}/{resume.resume_id}_protected.pdf"
        reader = pypdf.PdfReader(filename)
        writer = pypdf.PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        writer.encrypt(password)
        with open(protected, "wb") as f:
            writer.write(f)
        return protected

    return filename


# ============================
# ROUTES
# ============================

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/time-status")
def time_status():
    start = get_or_set_start_time()
    elapsed = datetime.utcnow() - start
    remaining = ACCESS_DURATION - elapsed
    allowed = is_access_allowed()
    return {
        "allowed": allowed,
        "remaining_seconds": max(0, int(remaining.total_seconds())),
        "start_time": start.isoformat(),
    }


@app.get("/admin/settings")
def get_admin_settings(db: Session = Depends(get_db)):
    settings = db.query(models.AdminSettings).first()
    if not settings:
        settings = models.AdminSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@app.put("/admin/settings")
def update_admin_settings(
    data: schemas.AdminSettingsUpdate,
    secret: str = Header(...),
    db: Session = Depends(get_db)
):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    settings = db.query(models.AdminSettings).first()
    if not settings:
        settings = models.AdminSettings()
        db.add(settings)
    settings.allow_download = data.allow_download
    settings.allow_print = data.allow_print
    settings.allow_email = data.allow_email
    settings.allow_whatsapp = data.allow_whatsapp
    settings.allow_password_protection = data.allow_password_protection
    db.commit()
    return {"message": "Settings updated"}


@app.post("/resume", response_model=schemas.ResumeResponse)
def create_resume(data: schemas.ResumeCreate, db: Session = Depends(get_db)):
    if not is_access_allowed():
        raise HTTPException(status_code=403, detail="Resume submission time has expired.")

    resume_id = generate_resume_id(db)
    resume = models.Resume(
        resume_id=resume_id,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        dob=data.dob,
        summary=data.summary,
        education=json.dumps([e.dict() for e in data.education]),
        experience=json.dumps([e.dict() for e in data.experience]),
        skills=json.dumps(data.skills),
        projects=json.dumps([p.dict() for p in data.projects]),
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    log_activity(db, resume_id, "Resume created")
    return resume


@app.get("/resume/{resume_id}", response_model=schemas.ResumeResponse)
def get_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.resume_id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume


@app.put("/resume/{resume_id}", response_model=schemas.ResumeResponse)
def update_resume(resume_id: str, data: schemas.ResumeCreate, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.resume_id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume.full_name = data.full_name
    resume.email = data.email
    resume.phone = data.phone
    resume.dob = data.dob
    resume.summary = data.summary
    resume.education = json.dumps([e.dict() for e in data.education])
    resume.experience = json.dumps([e.dict() for e in data.experience])
    resume.skills = json.dumps(data.skills)
    resume.projects = json.dumps([p.dict() for p in data.projects])
    db.commit()
    db.refresh(resume)
    log_activity(db, resume_id, "Resume updated")
    return resume


@app.delete("/resume/{resume_id}")
def delete_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.resume_id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()
    log_activity(db, resume_id, "Resume deleted")
    return {"message": f"{resume_id} deleted"}


@app.get("/resume/{resume_id}/download")
def download_resume(resume_id: str, db: Session = Depends(get_db)):
    settings = db.query(models.AdminSettings).first()
    if settings and not settings.allow_download:
        raise HTTPException(status_code=403, detail="Downloads are disabled by admin")

    resume = db.query(models.Resume).filter(models.Resume.resume_id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.is_expired:
        raise HTTPException(status_code=403, detail="This resume link has expired. Please generate again.")

    created = resume.created_at
    if datetime.utcnow() - created > timedelta(hours=24):
        resume.is_expired = True
        db.commit()
        raise HTTPException(status_code=403, detail="This resume link has expired. Please generate again.")

    settings = db.query(models.AdminSettings).first()
    password = None
    if settings and settings.allow_password_protection:
        password = generate_password(resume.full_name, resume.dob)

    pdf_path = generate_pdf(resume, password=password)
    resume.download_count += 1
    db.commit()
    log_activity(db, resume_id, "Downloaded")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"{resume_id}.pdf",
        headers={"X-PDF-Password": password or "none"}
    )


@app.post("/resume/{resume_id}/share")
def share_resume(resume_id: str, req: schemas.ShareRequest, db: Session = Depends(get_db)):
    settings = db.query(models.AdminSettings).first()
    resume = db.query(models.Resume).filter(models.Resume.resume_id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    password = generate_password(resume.full_name, resume.dob)
    pdf_path = generate_pdf(resume, password=password)

    if req.method == "Email":
        if settings and not settings.allow_email:
            raise HTTPException(status_code=403, detail="Email sharing disabled by admin")
        if GMAIL_USER == "mock":
            log_activity(db, resume_id, "Shared via Email (mock)")
        else:
            try:
                msg = MIMEMultipart()
                msg['From'] = GMAIL_USER
                msg['To'] = req.recipient
                msg['Subject'] = f"Your Resume - {resume.full_name}"
                body = f"Please find your resume attached.\n\nPDF Password: {password}"
                msg.attach(MIMEText(body, 'plain'))
                with open(pdf_path, "rb") as f:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header('Content-Disposition', f'attachment; filename="{resume_id}.pdf"')
                    msg.attach(part)
                with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
                    server.login(GMAIL_USER, GMAIL_PASSWORD)
                    server.sendmail(GMAIL_USER, req.recipient, msg.as_string())
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Email failed: {e}")

    elif req.method == "WhatsApp":
        if settings and not settings.allow_whatsapp:
            raise HTTPException(status_code=403, detail="WhatsApp sharing disabled by admin")
        log_activity(db, resume_id, "Shared via WhatsApp")

    history = models.ShareHistory(
        resume_id=resume_id,
        method=req.method,
        recipient=req.recipient
    )
    db.add(history)
    db.commit()

    return {
        "message": f"Shared via {req.method}",
        "password": password,
        "whatsapp_url": f"https://wa.me/{req.recipient}?text=Your+resume+password+is+{password}" if req.method == "WhatsApp" else None
    }


@app.get("/admin/resumes")
def admin_get_all_resumes(secret: str = Header(...), db: Session = Depends(get_db)):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    return db.query(models.Resume).all()


@app.get("/admin/logs")
def admin_get_logs(secret: str = Header(...), db: Session = Depends(get_db)):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    return db.query(models.ActivityLog).all()


@app.get("/admin/share-history")
def admin_share_history(secret: str = Header(...), db: Session = Depends(get_db)):
    if secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    return db.query(models.ShareHistory).all()