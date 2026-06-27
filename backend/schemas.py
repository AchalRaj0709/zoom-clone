from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ParticipantBase(BaseModel):
    display_name: str

class ParticipantJoin(ParticipantBase):
    pass

class Participant(ParticipantBase):
    id: int
    meeting_id: int
    user_id: Optional[int] = None
    joined_at: datetime

    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int = 60

class MeetingCreate(MeetingBase):
    scheduled_at: Optional[datetime] = None

class Meeting(MeetingBase):
    id: int
    meeting_id: str
    host_id: int
    invite_link: str
    scheduled_at: Optional[datetime] = None
    status: str
    created_at: datetime
    participants: List[Participant] = []

    class Config:
        from_attributes = True
