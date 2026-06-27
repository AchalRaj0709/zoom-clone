import random
from sqlalchemy.orm import Session
from typing import Optional, List
from . import models, schemas

def generate_meeting_id(db: Session) -> str:
    while True:
        digits = "".join(random.choices("0123456789", k=9))
        meeting_id = f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
        # Check uniqueness
        exists = db.query(models.Meeting).filter(models.Meeting.meeting_id == meeting_id).first()
        if not exists:
            return meeting_id

def get_meeting_by_meeting_id(db: Session, meeting_id: str) -> Optional[models.Meeting]:
    return db.query(models.Meeting).filter(models.Meeting.meeting_id == meeting_id).first()

def get_meetings_for_host(db: Session, host_id: int) -> List[models.Meeting]:
    return db.query(models.Meeting).filter(models.Meeting.host_id == host_id).all()

def get_upcoming_meetings(db: Session) -> List[models.Meeting]:
    return (
        db.query(models.Meeting)
        .filter(models.Meeting.status == "scheduled")
        .order_by(models.Meeting.scheduled_at.asc())
        .all()
    )

def get_recent_meetings(db: Session) -> List[models.Meeting]:
    return (
        db.query(models.Meeting)
        .filter(models.Meeting.status == "ended")
        .order_by(models.Meeting.created_at.desc())
        .limit(5)
        .all()
    )

def create_instant_meeting(db: Session, host_id: int) -> models.Meeting:
    meeting_id = generate_meeting_id(db)
    db_meeting = models.Meeting(
        meeting_id=meeting_id,
        title="Instant Meeting",
        description="Instant Zoom meeting",
        host_id=host_id,
        invite_link=f"/join/{meeting_id}",
        scheduled_at=None,
        duration_minutes=60,
        status="active"
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    # Add host as participant
    host = db.query(models.User).filter(models.User.id == host_id).first()
    display_name = host.name if host else "Achal Raj"
    db_participant = models.Participant(
        meeting_id=db_meeting.id,
        user_id=host_id,
        display_name=display_name
    )
    db.add(db_participant)
    db.commit()
    db.refresh(db_meeting)
    
    return db_meeting

def create_scheduled_meeting(db: Session, meeting_in: schemas.MeetingCreate, host_id: int) -> models.Meeting:
    meeting_id = generate_meeting_id(db)
    db_meeting = models.Meeting(
        meeting_id=meeting_id,
        title=meeting_in.title,
        description=meeting_in.description,
        host_id=host_id,
        invite_link=f"/join/{meeting_id}",
        scheduled_at=meeting_in.scheduled_at,
        duration_minutes=meeting_in.duration_minutes,
        status="scheduled"
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

def join_meeting(db: Session, meeting_id_str: str, display_name: str, user_id: Optional[int] = None) -> Optional[models.Meeting]:
    meeting = get_meeting_by_meeting_id(db, meeting_id_str)
    if not meeting:
        return None
    
    # Check if participant already exists in the meeting (deduplicate only by user_id if present)
    existing_participant = None
    if user_id is not None:
        existing_participant = db.query(models.Participant).filter(
            models.Participant.meeting_id == meeting.id,
            models.Participant.user_id == user_id
        ).first()
    
    if not existing_participant:
        db_participant = models.Participant(
            meeting_id=meeting.id,
            user_id=user_id,
            display_name=display_name
        )
        db.add(db_participant)
    
    if meeting.status == "scheduled":
        meeting.status = "active"
        db.add(meeting)
        
    db.commit()
    db.refresh(meeting)
    return meeting
