"""
Patent Assessment Platform - Backend API
FastAPI application with AI-powered patent analysis
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import uuid
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

# Local imports
from database import get_db, init_db, Assessment, Document, AssessmentStatus, DocumentType, TechnicalField
from document_processor import DocumentProcessor
from ai_analyzer import AIPatentAnalyzer, PatentDraftGenerator
from google_patents import GooglePatentsAPI, PriorArtSearchResult, PatentResult

# Set up logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Patent Assessment Platform API",
    description="AI-powered patent potential assessment and document analysis",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API contracts
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str

class AssessmentRequest(BaseModel):
    project_title: str
    description: str
    technical_field: Optional[str] = None

class AssessmentResponse(BaseModel):
    assessment_id: str
    status: str
    novelty_score: float
    patentability_score: float
    confidence: float
    summary: str
    recommendations: List[str]

class PriorArtSearchRequest(BaseModel):
    invention_description: str
    technical_field: str
    keywords: Optional[List[str]] = None
    max_results: Optional[int] = 20

class PatentResultResponse(BaseModel):
    patent_id: str
    title: str
    abstract: str
    inventors: List[str]
    assignee: str
    filing_date: str
    publication_date: str
    patent_office: str
    classification: List[str]
    url: str
    similarity_score: float
    relevance_reason: str

class PriorArtSearchResponse(BaseModel):
    query: str
    total_results: int
    patents: List[PatentResultResponse]
    search_duration_ms: int
    search_timestamp: str
    confidence_score: float
    search_strategy: str

# API Routes

@app.get("/")
async def root():
    """Root endpoint with basic API information"""
    return {
        "message": "Patent Assessment Platform API",
        "version": "0.1.0",
        "status": "active",
        "docs": "/api/docs"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="0.1.0"
    )

@app.post("/api/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload and process patent assessment documents
    Supports: PDF, DOCX, TXT, and image files
    """
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/png",
        "image/jpeg",
        "image/jpg"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Supported: PDF, DOCX, TXT, PNG, JPG"
        )

    # File size validation (max 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size: 10MB")

    # Initialize document processor
    processor = DocumentProcessor()

    try:
        # Process document to extract text
        result = await processor.process_document(
            file_content=content,
            filename=file.filename,
            content_type=file.content_type
        )

        # Create document record in database
        doc_type_map = {
            "application/pdf": DocumentType.PDF,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocumentType.DOCX,
            "text/plain": DocumentType.TXT,
            "image/png": DocumentType.IMAGE,
            "image/jpeg": DocumentType.IMAGE,
            "image/jpg": DocumentType.IMAGE,
        }

        document = Document(
            id=uuid.uuid4(),
            filename=file.filename,
            file_type=doc_type_map[file.content_type],
            file_size_bytes=len(content),
            file_hash=result.get('file_hash'),
            extracted_text=result.get('extracted_text', ''),
            extracted_metadata=result.get('metadata', {}),
            processing_status=AssessmentStatus.COMPLETED if result['status'] == 'success' else AssessmentStatus.FAILED,
            processed_at=datetime.utcnow()
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # Preprocess text for analysis (background task)
        if result.get('extracted_text'):
            preprocessed = await processor.preprocess_text(result['extracted_text'])
            result['preprocessing'] = preprocessed

        return {
            "message": "File uploaded and processed successfully",
            "document_id": str(document.id),
            "filename": file.filename,
            "size": len(content),
            "content_type": file.content_type,
            "status": "completed",
            "statistics": result.get('statistics', {}),
            "preprocessing": result.get('preprocessing', {}),
            "processing_time": result.get('processing_time_seconds', 0)
        }

    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )

@app.post("/api/assess", response_model=AssessmentResponse)
async def create_assessment(
    request: AssessmentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create new patent assessment from project description using AI analysis
    """
    try:
        # Initialize AI analyzer
        analyzer = AIPatentAnalyzer()

        # Identify technical field if not provided
        technical_field_str = request.technical_field
        if not technical_field_str:
            technical_field_str = await analyzer.identify_technical_field(request.description)

        # Map string to enum
        field_map = {
            "software": TechnicalField.SOFTWARE,
            "electronics": TechnicalField.ELECTRONICS,
            "mechanical": TechnicalField.MECHANICAL,
            "chemical": TechnicalField.CHEMICAL,
            "biotech": TechnicalField.BIOTECH,
            "medical": TechnicalField.MEDICAL,
        }
        technical_field_enum = field_map.get(
            technical_field_str.lower().split('/')[0],
            TechnicalField.OTHER
        )

        # Perform AI analysis
        assessment_result = await analyzer.analyze_patent_potential(
            text=request.description,
            project_title=request.project_title,
            technical_field=technical_field_str
        )

        # Create assessment record in database
        assessment = Assessment(
            id=uuid.uuid4(),
            project_title=request.project_title,
            description=request.description,
            technical_field=technical_field_enum,
            status=AssessmentStatus.COMPLETED,
            novelty_score=assessment_result.novelty,
            non_obviousness_score=assessment_result.non_obviousness,
            utility_score=assessment_result.utility,
            enablement_score=assessment_result.enablement,
            overall_patentability_score=(
                assessment_result.novelty +
                assessment_result.non_obviousness +
                assessment_result.utility +
                assessment_result.enablement
            ) / 4,
            confidence_level=assessment_result.confidence,
            summary=assessment_result.summary,
            recommendations=assessment_result.recommendations,
            key_features=assessment_result.key_features,
            risk_factors=assessment_result.risk_factors,
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )

        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        # Return response
        return AssessmentResponse(
            assessment_id=str(assessment.id),
            status="completed",
            novelty_score=assessment.novelty_score,
            patentability_score=assessment.overall_patentability_score,
            confidence=assessment.confidence_level,
            summary=assessment.summary,
            recommendations=assessment.recommendations
        )

    except Exception as e:
        logger.error(f"Error creating assessment: {str(e)}")

        # Return mock response if AI fails
        return AssessmentResponse(
            assessment_id=str(uuid.uuid4()),
            status="error",
            novelty_score=0.0,
            patentability_score=0.0,
            confidence=0.0,
            summary=f"Assessment failed: {str(e)}",
            recommendations=["Please try again or contact support"]
        )

@app.get("/api/assess/{assessment_id}")
async def get_assessment(assessment_id: str):
    """
    Retrieve assessment results by ID
    """
    # TODO: Implement database retrieval
    return {
        "assessment_id": assessment_id,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
        "results": "Assessment data would be here"
    }

@app.post("/api/prior-art/search", response_model=PriorArtSearchResponse)
async def search_prior_art(request: PriorArtSearchRequest):
    """
    Search for prior art patents using Google Patents API

    This endpoint searches for existing patents that might be relevant
    to the provided invention description using multiple search strategies.
    """
    try:
        async with GooglePatentsAPI() as patents_api:
            # Perform prior art search
            search_result = await patents_api.search_prior_art(
                invention_description=request.invention_description,
                technical_field=request.technical_field,
                keywords=request.keywords,
                max_results=request.max_results or 20
            )

            # Convert PatentResult objects to PatentResultResponse
            patent_responses = []
            for patent in search_result.patents:
                patent_responses.append(PatentResultResponse(
                    patent_id=patent.patent_id,
                    title=patent.title,
                    abstract=patent.abstract,
                    inventors=patent.inventors,
                    assignee=patent.assignee,
                    filing_date=patent.filing_date,
                    publication_date=patent.publication_date,
                    patent_office=patent.patent_office,
                    classification=patent.classification,
                    url=patent.url,
                    similarity_score=patent.similarity_score,
                    relevance_reason=patent.relevance_reason
                ))

            return PriorArtSearchResponse(
                query=search_result.query,
                total_results=search_result.total_results,
                patents=patent_responses,
                search_duration_ms=search_result.search_duration_ms,
                search_timestamp=search_result.search_timestamp.isoformat(),
                confidence_score=search_result.confidence_score,
                search_strategy=search_result.search_strategy
            )

    except Exception as e:
        logger.error(f"Prior art search failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prior art search failed: {str(e)}"
        )

@app.post("/api/assess-with-prior-art")
async def create_assessment_with_prior_art(
    request: AssessmentRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create comprehensive patent assessment including prior art analysis

    This endpoint combines AI patent assessment with prior art search
    to provide a complete patentability evaluation.
    """
    try:
        # Start both assessments concurrently
        analyzer = AIPatentAnalyzer()

        # Get technical field
        technical_field_str = request.technical_field
        if not technical_field_str:
            technical_field_str = await analyzer.identify_technical_field(request.description)

        # Run AI assessment and prior art search concurrently
        assessment_task = analyzer.analyze_patent_potential(
            text=request.description,
            project_title=request.project_title,
            technical_field=technical_field_str
        )

        async with GooglePatentsAPI() as patents_api:
            prior_art_task = patents_api.search_prior_art(
                invention_description=request.description,
                technical_field=technical_field_str,
                max_results=10
            )

            # Wait for both to complete
            assessment_result, prior_art_result = await asyncio.gather(
                assessment_task,
                prior_art_task
            )

        # Analyze prior art impact on assessment
        prior_art_impact = await analyze_prior_art_impact(
            assessment_result,
            prior_art_result,
            request.description
        )

        # Map string to enum for database
        field_map = {
            "software": TechnicalField.SOFTWARE,
            "electronics": TechnicalField.ELECTRONICS,
            "mechanical": TechnicalField.MECHANICAL,
            "chemical": TechnicalField.CHEMICAL,
            "biotech": TechnicalField.BIOTECH,
            "medical": TechnicalField.MEDICAL,
        }
        technical_field_enum = field_map.get(
            technical_field_str.lower().split('/')[0],
            TechnicalField.OTHER
        )

        # Adjust scores based on prior art analysis
        adjusted_novelty = max(0.0, assessment_result.novelty - prior_art_impact['novelty_reduction'])
        adjusted_non_obviousness = max(0.0, assessment_result.non_obviousness - prior_art_impact['obviousness_increase'])

        # Create enhanced assessment record
        assessment = Assessment(
            id=uuid.uuid4(),
            project_title=request.project_title,
            description=request.description,
            technical_field=technical_field_enum,
            status=AssessmentStatus.COMPLETED,
            novelty_score=adjusted_novelty,
            non_obviousness_score=adjusted_non_obviousness,
            utility_score=assessment_result.utility,
            enablement_score=assessment_result.enablement,
            overall_patentability_score=(
                adjusted_novelty +
                adjusted_non_obviousness +
                assessment_result.utility +
                assessment_result.enablement
            ) / 4,
            confidence_level=min(assessment_result.confidence, prior_art_result.confidence_score),
            summary=f"{assessment_result.summary}\n\nPrior Art Analysis: {prior_art_impact['summary']}",
            recommendations=assessment_result.recommendations + prior_art_impact['recommendations'],
            key_features=assessment_result.key_features,
            risk_factors=assessment_result.risk_factors + prior_art_impact['risk_factors'],
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )

        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        # Convert prior art results
        prior_art_patents = []
        for patent in prior_art_result.patents:
            prior_art_patents.append({
                'patent_id': patent.patent_id,
                'title': patent.title,
                'similarity_score': patent.similarity_score,
                'url': patent.url,
                'relevance_reason': patent.relevance_reason
            })

        return {
            "assessment_id": str(assessment.id),
            "status": "completed",
            "novelty_score": adjusted_novelty,
            "non_obviousness_score": adjusted_non_obviousness,
            "utility_score": assessment_result.utility,
            "enablement_score": assessment_result.enablement,
            "overall_patentability_score": assessment.overall_patentability_score,
            "confidence": assessment.confidence_level,
            "summary": assessment.summary,
            "recommendations": assessment.recommendations,
            "key_features": assessment.key_features,
            "risk_factors": assessment.risk_factors,
            "prior_art": {
                "total_found": prior_art_result.total_results,
                "analyzed": len(prior_art_result.patents),
                "top_conflicts": prior_art_patents[:5],
                "search_confidence": prior_art_result.confidence_score,
                "impact_analysis": prior_art_impact
            }
        }

    except Exception as e:
        logger.error(f"Comprehensive assessment failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Assessment with prior art analysis failed: {str(e)}"
        )

async def analyze_prior_art_impact(assessment_result, prior_art_result, invention_description):
    """
    Analyze how prior art findings impact the patent assessment
    """
    if not prior_art_result.patents:
        return {
            'novelty_reduction': 0.0,
            'obviousness_increase': 0.0,
            'summary': 'No relevant prior art found.',
            'recommendations': ['Consider broader patent search before filing'],
            'risk_factors': []
        }

    # Calculate impact based on similarity scores
    high_similarity_patents = [p for p in prior_art_result.patents if p.similarity_score > 0.7]
    medium_similarity_patents = [p for p in prior_art_result.patents if 0.4 <= p.similarity_score <= 0.7]

    novelty_reduction = 0.0
    obviousness_increase = 0.0
    risk_factors = []
    recommendations = []

    if high_similarity_patents:
        novelty_reduction = min(0.4, len(high_similarity_patents) * 0.1)
        obviousness_increase = min(0.3, len(high_similarity_patents) * 0.08)

        risk_factors.append(f"Found {len(high_similarity_patents)} highly similar patents")
        recommendations.append("Conduct detailed patentability analysis against similar patents")

        for patent in high_similarity_patents[:3]:  # Top 3 similar patents
            risk_factors.append(f"Similar patent: {patent.patent_id} - {patent.title[:60]}...")

    elif medium_similarity_patents:
        novelty_reduction = min(0.2, len(medium_similarity_patents) * 0.05)
        obviousness_increase = min(0.15, len(medium_similarity_patents) * 0.04)

        recommendations.append("Review similar patents to strengthen differentiation")

    # Generate summary
    if high_similarity_patents:
        summary = f"Found {len(high_similarity_patents)} highly similar patents that may impact patentability"
    elif medium_similarity_patents:
        summary = f"Found {len(medium_similarity_patents)} moderately similar patents requiring review"
    else:
        summary = "Prior art search revealed low similarity with existing patents"

    if not risk_factors:
        risk_factors = ["Limited prior art conflicts identified"]

    if not recommendations:
        recommendations = ["Patent landscape appears favorable for filing"]

    return {
        'novelty_reduction': novelty_reduction,
        'obviousness_increase': obviousness_increase,
        'summary': summary,
        'recommendations': recommendations,
        'risk_factors': risk_factors
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)