from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base


class Complaint(Base):
    __tablename__ = 'complaints'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(150), nullable=False, index=True)
    phone = Column(String(30), nullable=False)
    category = Column(String(80), nullable=False, index=True)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    incident_date = Column(String(20), nullable=False)
    evidence = Column(Text, nullable=True)
    status = Column(String(30), default='Pending', nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'category': self.category,
            'subject': self.subject,
            'description': self.description,
            'incident_date': self.incident_date,
            'evidence': self.evidence or '',
            'status': self.status,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None,
        }
