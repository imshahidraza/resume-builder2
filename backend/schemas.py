from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class EducationItem(BaseModel):
    institution: str
    degree: str
    year: str


class ExperienceItem(BaseModel):
    company: str
    role: str
    duration: str
    description: str


class ProjectItem(BaseModel):
    name: str
    description: str
    technologies: str


class ResumeCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    dob: str
    summary: str
    education: List[EducationItem]
    experience: List[ExperienceItem]
    skills: List[str]
    projects: List[ProjectItem]


class ResumeResponse(BaseModel):
    resume_id: str
    full_name: str
    email: str
    phone: str
    dob: str
    summary: str
    education: str
    experience: str
    skills: str
    projects: str
    created_at: Optional[datetime] = None
    download_count: int = 0

    class Config:
        from_attributes = True


class ShareRequest(BaseModel):
    resume_id: str
    method: str
    recipient: str


class AdminSettingsUpdate(BaseModel):
    allow_download: bool
    allow_print: bool
    allow_email: bool
    allow_whatsapp: bool
    allow_password_protection: bool
