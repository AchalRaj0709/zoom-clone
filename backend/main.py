import os
import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from . import models, schemas, crud

app = FastAPI(title="Zoom Clone API")

# Configure CORS dynamically from environment variables
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seeding Logic inside FastAPI startup event
@app.on_event("startup")
def seed_database():
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    from .database import SessionLocal
    db = SessionLocal()
    try:
        # 1. Seed default user if not exists
        default_user = db.query(models.User).filter(models.User.id == 1).first()
        if not default_user:
            default_user = models.User(
                id=1,
                name="Achal Raj",
                email="achal@zoom.local",
                avatar_url=None,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)

        # 2. Seed meetings if the database is empty
        meeting_count = db.query(models.Meeting).count()
        if meeting_count == 0:
            # Seed 3 past meetings (ended status)
            past_meetings = [
                ("Team Standup", 30),
                ("Design Review", 60),
                ("Sprint Planning", 90)
            ]
            for i, (title, duration) in enumerate(past_meetings):
                digits = f"99988877{i}"
                meeting_id = f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
                db_meeting = models.Meeting(
                    meeting_id=meeting_id,
                    title=title,
                    description=f"Seeded past meeting: {title}",
                    host_id=1,
                    invite_link=f"/join/{meeting_id}",
                    scheduled_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=i+1, hours=i),
                    duration_minutes=duration,
                    status="ended",
                    created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=i+1, hours=i)
                )
                db.add(db_meeting)
                db.commit()
                db.refresh(db_meeting)
                
                # Host joins the ended meeting
                db_participant_host = models.Participant(
                    meeting_id=db_meeting.id,
                    user_id=1,
                    display_name="Achal Raj",
                    joined_at=db_meeting.created_at
                )
                # A guest also joins the ended meeting
                db_participant_guest = models.Participant(
                    meeting_id=db_meeting.id,
                    user_id=None,
                    display_name=f"Guest Developer {i+1}",
                    joined_at=db_meeting.created_at + datetime.timedelta(minutes=2)
                )
                db.add(db_participant_host)
                db.add(db_participant_guest)
                db.commit()

            # Seed 2 upcoming scheduled meetings (scheduled status)
            upcoming_meetings = [
                ("1on1 with Manager", 45, datetime.timedelta(days=1, hours=2)),
                ("Product Architecture Demo", 60, datetime.timedelta(days=2, hours=4))
            ]
            for i, (title, duration, offset) in enumerate(upcoming_meetings):
                digits = f"11122233{i}"
                meeting_id = f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
                scheduled_time = datetime.datetime.now(datetime.timezone.utc) + offset
                db_meeting = models.Meeting(
                    meeting_id=meeting_id,
                    title=title,
                    description=f"Seeded upcoming meeting: {title}",
                    host_id=1,
                    invite_link=f"/join/{meeting_id}",
                    scheduled_at=scheduled_time,
                    duration_minutes=duration,
                    status="scheduled",
                    created_at=datetime.datetime.now(datetime.timezone.utc)
                )
                db.add(db_meeting)
                db.commit()
    finally:
        db.close()

# Routes
# IMPORTANT: Specific routes (/upcoming, /recent, /instant, /schedule) MUST be
# defined before the /{meeting_id} wildcard route, otherwise FastAPI will treat
# "upcoming" and "recent" as meeting_id strings and hit the wrong handler.

@app.get("/api/meetings", response_model=List[schemas.Meeting])
def get_all_meetings(db: Session = Depends(get_db)):
    """List all meetings where default user is host (host_id=1)"""
    return crud.get_meetings_for_host(db, host_id=1)

@app.get("/api/meetings/upcoming", response_model=List[schemas.Meeting])
def get_upcoming_meetings(db: Session = Depends(get_db)):
    """Get upcoming meetings with status='scheduled' ordered by scheduled_at"""
    return crud.get_upcoming_meetings(db)

@app.get("/api/meetings/recent", response_model=List[schemas.Meeting])
def get_recent_meetings(db: Session = Depends(get_db)):
    """Get recent meetings with status='ended' ordered by created_at DESC limit 5"""
    return crud.get_recent_meetings(db)

@app.post("/api/meetings/instant", response_model=schemas.Meeting)
def create_instant_meeting(db: Session = Depends(get_db)):
    """Create instant meeting, return meeting_id + invite_link"""
    return crud.create_instant_meeting(db, host_id=1)

@app.post("/api/meetings/schedule", response_model=schemas.Meeting)
def create_scheduled_meeting(meeting: schemas.MeetingCreate, db: Session = Depends(get_db)):
    """Create scheduled meeting"""
    return crud.create_scheduled_meeting(db, meeting, host_id=1)

# Wildcard routes AFTER specific routes
@app.get("/api/meetings/{meeting_id}", response_model=schemas.Meeting)
def get_meeting_details(meeting_id: str, db: Session = Depends(get_db)):
    """Get meeting details by meeting_id string"""
    meeting = crud.get_meeting_by_meeting_id(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@app.post("/api/meetings/{meeting_id}/join", response_model=schemas.Meeting)
def join_meeting(meeting_id: str, participant: schemas.ParticipantJoin, db: Session = Depends(get_db)):
    """Join a meeting (save participant), return meeting data"""
    user_id = 1 if participant.display_name == "Achal Raj" else None
    meeting = crud.join_meeting(db, meeting_id, participant.display_name, user_id=user_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@app.post("/api/meetings/{meeting_id}/end", response_model=schemas.Meeting)
def end_meeting(meeting_id: str, db: Session = Depends(get_db)):
    """End a meeting (set status to ended)"""
    meeting = crud.get_meeting_by_meeting_id(db, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting.status = "ended"
    db.commit()
    db.refresh(meeting)
    return meeting


