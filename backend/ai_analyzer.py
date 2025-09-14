"""
AI-Powered Patent Analysis Module
Uses Google Gemini Pro for comprehensive patent assessment
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
import asyncio

import google.generativeai as genai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PatentAssessmentCriteria:
    """Data class for patent assessment criteria"""
    novelty: float  # 0.0 to 1.0
    non_obviousness: float  # 0.0 to 1.0
    utility: float  # 0.0 to 1.0
    enablement: float  # 0.0 to 1.0
    confidence: float  # 0.0 to 1.0
    summary: str
    recommendations: List[str]
    key_features: List[str]
    risk_factors: List[str]


class AIPatentAnalyzer:
    """
    Main AI analyzer for patent assessment using Google Gemini Pro
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the AI analyzer with Gemini Pro configuration

        Args:
            api_key: Google API key (uses env variable if not provided)
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key is required")

        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro')
        self.temperature = 0.3  # Lower for more consistent analysis

        # Initialize text splitter for long documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=30000,  # Gemini has larger context window
            chunk_overlap=200,
            length_function=len
        )

    async def _generate_response(self, system_prompt: str, user_prompt: str, require_json: bool = True) -> str:
        """Helper method to generate response using Gemini"""
        try:
            # Combine system and user prompts for Gemini
            full_prompt = f"{system_prompt}\n\nUser Request:\n{user_prompt}"
            if require_json:
                full_prompt += "\n\nPlease respond with valid JSON format."

            response = await asyncio.to_thread(
                self.model.generate_content,
                full_prompt
            )

            return response.text.strip()
        except Exception as e:
            logger.error(f"Error generating response with Gemini: {e}")
            raise

    async def analyze_patent_potential(
        self,
        text: str,
        project_title: str,
        technical_field: Optional[str] = None
    ) -> PatentAssessmentCriteria:
        """
        Analyze patent potential of the provided text

        Args:
            text: Extracted document text
            project_title: Title of the project/invention
            technical_field: Technical domain (optional)

        Returns:
            PatentAssessmentCriteria with scores and analysis
        """
        try:
            # Split text if too long
            if len(text) > 10000:
                chunks = self.text_splitter.split_text(text)
                # Analyze first few chunks for now (can be improved)
                text = " ".join(chunks[:3])

            # Create the analysis prompt
            prompt = self._create_analysis_prompt(text, project_title, technical_field)

            # Call Gemini API
            response_text = await self._generate_response(
                system_prompt=self._get_system_prompt(),
                user_prompt=prompt,
                require_json=True
            )

            # Parse the response
            result = json.loads(response_text)

            # Create assessment object
            assessment = PatentAssessmentCriteria(
                novelty=float(result.get("novelty_score", 0.0)),
                non_obviousness=float(result.get("non_obviousness_score", 0.0)),
                utility=float(result.get("utility_score", 0.0)),
                enablement=float(result.get("enablement_score", 0.0)),
                confidence=float(result.get("confidence_level", 0.0)),
                summary=result.get("summary", ""),
                recommendations=result.get("recommendations", []),
                key_features=result.get("key_features", []),
                risk_factors=result.get("risk_factors", [])
            )

            logger.info(f"Successfully analyzed patent potential for: {project_title}")
            return assessment

        except Exception as e:
            logger.error(f"Error in patent analysis: {str(e)}")
            raise

    def _get_system_prompt(self) -> str:
        """
        Get the system prompt for patent analysis

        Returns:
            System prompt string
        """
        return """You are an expert patent analyst and intellectual property specialist with deep knowledge
of patent law, technical innovation assessment, and prior art analysis. Your role is to evaluate
inventions for their patentability potential based on the four key criteria:

1. **Novelty**: Is this invention truly new and not disclosed in prior art?
2. **Non-obviousness**: Would this invention be non-obvious to a person skilled in the art?
3. **Utility**: Does this invention have practical application and solve a real problem?
4. **Enablement**: Is the invention described in enough detail for reproduction?

Provide detailed analysis with scores from 0.0 to 1.0 for each criterion, where:
- 0.0-0.3: Poor potential
- 0.4-0.6: Moderate potential
- 0.7-0.8: Good potential
- 0.9-1.0: Excellent potential

Always respond in valid JSON format with the specified structure."""

    def _create_analysis_prompt(
        self,
        text: str,
        project_title: str,
        technical_field: Optional[str] = None
    ) -> str:
        """
        Create the analysis prompt for the invention

        Args:
            text: Document text
            project_title: Project title
            technical_field: Technical field

        Returns:
            Formatted prompt string
        """
        field_context = f"Technical Field: {technical_field}\n" if technical_field else ""

        return f"""Analyze the following invention for patent potential:

Project Title: {project_title}
{field_context}

Invention Description:
{text[:8000]}  # Limit text to avoid token issues

Please provide a comprehensive patent assessment in JSON format with the following structure:
{{
    "novelty_score": 0.0-1.0,
    "non_obviousness_score": 0.0-1.0,
    "utility_score": 0.0-1.0,
    "enablement_score": 0.0-1.0,
    "confidence_level": 0.0-1.0,
    "summary": "2-3 sentence executive summary of the patent potential",
    "recommendations": [
        "Specific recommendation 1",
        "Specific recommendation 2",
        "Specific recommendation 3"
    ],
    "key_features": [
        "Novel feature 1",
        "Novel feature 2",
        "Novel feature 3"
    ],
    "risk_factors": [
        "Risk or weakness 1",
        "Risk or weakness 2"
    ]
}}

Ensure all scores are numeric values between 0.0 and 1.0.
Provide specific, actionable recommendations.
Identify the most novel and valuable features of the invention.
Be honest about risks and potential prior art concerns."""

    async def analyze_claims(self, text: str) -> Dict[str, Any]:
        """
        Analyze and suggest patent claims based on the invention

        Args:
            text: Invention description

        Returns:
            Dictionary with suggested claims
        """
        try:
            prompt = f"""Based on the following invention description, suggest patent claims:

{text[:4000]}

Generate patent claims in JSON format:
{{
    "independent_claims": [
        "1. A system/method/apparatus comprising...",
        "2. ..."
    ],
    "dependent_claims": [
        "3. The system of claim 1, wherein...",
        "4. ..."
    ],
    "claim_strategy": "Brief explanation of the claim strategy"
}}"""

            response_text = await self._generate_response(
                system_prompt="You are a patent attorney skilled in drafting patent claims.",
                user_prompt=prompt,
                require_json=True
            )

            return json.loads(response_text)

        except Exception as e:
            logger.error(f"Error generating claims: {str(e)}")
            return {"error": str(e)}

    async def identify_technical_field(self, text: str) -> str:
        """
        Identify the technical field of the invention

        Args:
            text: Invention description

        Returns:
            Technical field classification
        """
        try:
            prompt = f"""Classify the following invention into one of these technical fields:
- Software/Computing
- Electronics/Hardware
- Mechanical/Manufacturing
- Chemical/Materials
- Biotechnology/Medical
- Telecommunications
- Energy/Environmental
- Other

Invention: {text[:2000]}

Respond with just the field name."""

            response_text = await self._generate_response(
                system_prompt="You are a patent classification expert.",
                user_prompt=prompt,
                require_json=False
            )

            return response_text

        except Exception as e:
            logger.error(f"Error identifying technical field: {str(e)}")
            return "Other"

    async def compare_with_prior_art(
        self,
        invention_text: str,
        prior_art_texts: List[str]
    ) -> Dict[str, Any]:
        """
        Compare invention with prior art documents

        Args:
            invention_text: The invention description
            prior_art_texts: List of prior art document texts

        Returns:
            Comparison analysis
        """
        try:
            # Limit prior art texts to avoid token issues
            prior_art_summary = "\n\n".join([
                f"Prior Art {i+1}: {text[:500]}..."
                for i, text in enumerate(prior_art_texts[:3])
            ])

            prompt = f"""Compare the following invention with prior art:

INVENTION:
{invention_text[:2000]}

PRIOR ART DOCUMENTS:
{prior_art_summary}

Analyze in JSON format:
{{
    "novelty_assessment": "How the invention differs from prior art",
    "similarity_score": 0.0-1.0,
    "differentiating_features": ["Feature 1", "Feature 2"],
    "potential_conflicts": ["Conflict 1", "Conflict 2"],
    "recommendation": "Clear recommendation on patentability"
}}"""

            response_text = await self._generate_response(
                system_prompt="You are an expert in prior art analysis and patent examination.",
                user_prompt=prompt,
                require_json=True
            )

            return json.loads(response_text)

        except Exception as e:
            logger.error(f"Error in prior art comparison: {str(e)}")
            return {"error": str(e)}


class PatentDraftGenerator:
    """
    Generate patent application drafts using AI
    """

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the draft generator"""
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = "gpt-4-turbo-preview"

    async def generate_abstract(
        self,
        invention_text: str,
        key_features: List[str]
    ) -> str:
        """
        Generate a patent abstract

        Args:
            invention_text: Full invention description
            key_features: List of key features

        Returns:
            Patent abstract text
        """
        try:
            features_text = ", ".join(key_features)
            prompt = f"""Write a patent abstract (150-250 words) for the following invention:

Key Features: {features_text}

Invention Description:
{invention_text[:2000]}

The abstract should:
1. Briefly describe the technical field
2. State the problem being solved
3. Summarize the solution
4. Highlight key advantages"""

            response_text = await self._generate_response(
                system_prompt="You are a patent attorney writing formal patent abstracts.",
                user_prompt=prompt,
                require_json=False
            )

            return response_text

        except Exception as e:
            logger.error(f"Error generating abstract: {str(e)}")
            return ""

    async def generate_background(
        self,
        invention_text: str,
        technical_field: str
    ) -> str:
        """
        Generate patent background section

        Args:
            invention_text: Invention description
            technical_field: Technical field

        Returns:
            Background section text
        """
        try:
            prompt = f"""Write a patent background section for an invention in {technical_field}:

{invention_text[:1500]}

The background should:
1. Describe the technical field
2. Discuss existing solutions and their limitations
3. Establish the need for the invention
4. Be 200-300 words"""

            response_text = await self._generate_response(
                system_prompt="You are writing formal patent application sections.",
                user_prompt=prompt,
                require_json=False
            )

            return response_text

        except Exception as e:
            logger.error(f"Error generating background: {str(e)}")
            return ""


# Utility function for quick analysis
async def quick_patent_assessment(
    text: str,
    title: str = "Untitled Invention"
) -> Dict[str, Any]:
    """
    Quick patent assessment utility function

    Args:
        text: Invention description
        title: Project title

    Returns:
        Assessment dictionary
    """
    analyzer = AIPatentAnalyzer()
    assessment = await analyzer.analyze_patent_potential(text, title)

    return {
        "scores": {
            "novelty": assessment.novelty,
            "non_obviousness": assessment.non_obviousness,
            "utility": assessment.utility,
            "enablement": assessment.enablement,
            "overall": (assessment.novelty + assessment.non_obviousness +
                       assessment.utility + assessment.enablement) / 4
        },
        "confidence": assessment.confidence,
        "summary": assessment.summary,
        "recommendations": assessment.recommendations,
        "key_features": assessment.key_features,
        "risk_factors": assessment.risk_factors
    }