from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(String, unique=True, index=True)  # RES-2026-1001
    full_name = Column(String)
    email = Column(String)
    phone = Column(String)
    dob = Column(String)
    summary = Column(Text)
    education = Column(Text)   # stored as JSON string
    experience = Column(Text)  # stored as JSON string
    skills = Column(Text)      # stored as JSON string
    projects = Column(Text)    # stored as JSON string
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    download_count = Column(Integer, default=0)
    is_expired = Column(Boolean, default=False)


class ShareHistory(Base):
    __tablename__ = "share_history"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(String)
    method = Column(String)       # Email or WhatsApp
    recipient = Column(String)
    timestamp = Column(DateTime, default=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(String)
    action = Column(String)       # created, downloaded, shared
    timestamp = Column(DateTime, default=func.now())


class AdminSettings(Base):
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True, index=True)
    allow_download = Column(Boolean, default=True)
    allow_print = Column(Boolean, default=True)
    allow_email = Column(Boolean, default=True)
    allow_whatsapp = Column(Boolean, default=True)
    allow_password_protection = Column(Boolean, default=True)