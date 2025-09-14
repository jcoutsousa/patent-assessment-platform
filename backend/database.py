"""
Database configuration and models for Patent Assessment Platform
"""

from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, JSON, ForeignKey, Enum, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
import os

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://patent_user:patent_dev_password@localhost:5432/patent_assessment")

# Create engine and session
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Enums for status tracking
class AssessmentStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class DocumentType(enum.Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    IMAGE = "image"

class TechnicalField(enum.Enum):
    SOFTWARE = "software"
    ELECTRONICS = "electronics"
    MECHANICAL = "mechanical"
    CHEMICAL = "chemical"
    BIOTECH = "biotech"
    MEDICAL = "medical"
    OTHER = "other"

# Database Models

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    organization = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assessments = relationship("Assessment", back_populates="user")
    documents = relationship("Document", back_populates="user")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    project_title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    technical_field = Column(Enum(TechnicalField))
    status = Column(Enum(AssessmentStatus), default=AssessmentStatus.PENDING)

    # Assessment scores
    novelty_score = Column(Float)
    non_obviousness_score = Column(Float)
    utility_score = Column(Float)
    enablement_score = Column(Float)
    overall_patentability_score = Column(Float)
    confidence_level = Column(Float)

    # Analysis results
    summary = Column(Text)
    recommendations = Column(JSON)  # List of recommendations
    prior_art_found = Column(JSON)  # List of prior art references
    key_features = Column(JSON)  # Extracted key technical features
    risk_factors = Column(JSON)  # Identified risks

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    processing_time_seconds = Column(Integer)

    # Relationships
    user = relationship("User", back_populates="assessments")
    documents = relationship("Document", back_populates="assessment")
    prior_art_searches = relationship("PriorArtSearch", back_populates="assessment")

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"))

    filename = Column(String(500), nullable=False)
    file_type = Column(Enum(DocumentType), nullable=False)
    file_size_bytes = Column(Integer)
    file_hash = Column(String(64))  # SHA-256 hash for deduplication

    # Extracted content
    extracted_text = Column(Text)
    extracted_metadata = Column(JSON)
    technical_drawings_count = Column(Integer, default=0)

    # Processing status
    processing_status = Column(Enum(AssessmentStatus), default=AssessmentStatus.PENDING)
    processing_errors = Column(JSON)

    # Storage
    storage_path = Column(String(1000))  # Path in object storage

    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="documents")
    assessment = relationship("Assessment", back_populates="documents")

class PriorArtSearch(Base):
    __tablename__ = "prior_art_searches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"))

    # Search parameters
    search_query = Column(Text, nullable=False)
    search_database = Column(String(100))  # google_patents, uspto, epo, etc.
    search_filters = Column(JSON)  # Date ranges, classifications, etc.

    # Results
    total_results_count = Column(Integer)
    relevant_results_count = Column(Integer)
    results = Column(JSON)  # Structured search results

    # Analysis
    similarity_scores = Column(JSON)  # Similarity to submitted invention
    top_relevant_patents = Column(JSON)  # Most relevant patents found

    # Timestamps
    searched_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assessment = relationship("Assessment", back_populates="prior_art_searches")

class PatentDraft(Base):
    __tablename__ = "patent_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"))

    # Draft sections
    title = Column(String(500))
    abstract = Column(Text)
    background = Column(Text)
    summary = Column(Text)
    detailed_description = Column(Text)
    claims = Column(JSON)  # List of claim texts

    # Metadata
    draft_version = Column(Integer, default=1)
    draft_status = Column(String(50))  # draft, reviewed, finalized

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    assessment = relationship("Assessment")

# Database initialization
def init_db():
    """Initialize database with tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables if running directly
    init_db()
    print("Database tables created successfully!")