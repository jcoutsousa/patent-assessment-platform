"""
Google Patents API Integration

This module provides functionality to search for prior art using Google's Patents API
and Custom Search Engine for comprehensive patent prior art research.
"""

import os
import asyncio
import aiohttp
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from urllib.parse import quote_plus
import json

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class PatentResult:
    """Represents a single patent search result"""
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
    similarity_score: float = 0.0
    relevance_reason: str = ""

@dataclass
class PriorArtSearchResult:
    """Represents the complete prior art search result"""
    query: str
    total_results: int
    patents: List[PatentResult]
    search_duration_ms: int
    search_timestamp: datetime
    confidence_score: float
    search_strategy: str

class GooglePatentsAPI:
    """
    Google Patents API client for prior art searches

    Uses both Google Patents Public Data and Custom Search Engine
    to find relevant prior art patents.
    """

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_PATENTS_API_KEY")
        self.search_engine_id = os.getenv("GOOGLE_CUSTOM_SEARCH_ENGINE_ID")

        # API endpoints
        self.custom_search_url = "https://customsearch.googleapis.com/customsearch/v1"
        self.patents_base_url = "https://patents.googleapis.com/v1"

        # Search configuration
        self.max_results_per_query = 20
        self.timeout_seconds = 30

        # Initialize session
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout_seconds)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()

    async def search_prior_art(
        self,
        invention_description: str,
        technical_field: str,
        keywords: Optional[List[str]] = None,
        date_range: Optional[Tuple[str, str]] = None,
        max_results: int = 50
    ) -> PriorArtSearchResult:
        """
        Search for prior art patents using multiple strategies

        Args:
            invention_description: Detailed description of the invention
            technical_field: Technical field/domain of the invention
            keywords: Additional specific keywords to search for
            date_range: Tuple of (start_date, end_date) in YYYY-MM-DD format
            max_results: Maximum number of results to return

        Returns:
            PriorArtSearchResult containing found patents and metadata
        """
        start_time = datetime.now()

        try:
            # Generate search queries using different strategies
            queries = self._generate_search_queries(
                invention_description,
                technical_field,
                keywords
            )

            # Execute searches concurrently
            all_patents = []
            total_results = 0

            for query in queries[:3]:  # Limit to top 3 queries to avoid rate limits
                try:
                    results = await self._search_patents(
                        query,
                        date_range,
                        min(max_results // len(queries), self.max_results_per_query)
                    )

                    if results:
                        all_patents.extend(results)
                        total_results += len(results)

                except Exception as e:
                    logger.warning(f"Search query failed: {query}. Error: {str(e)}")
                    continue

            # Remove duplicates and rank by relevance
            unique_patents = self._deduplicate_and_rank(
                all_patents,
                invention_description,
                max_results
            )

            # Calculate search confidence
            confidence_score = self._calculate_search_confidence(
                len(unique_patents),
                total_results,
                len(queries)
            )

            search_duration = int((datetime.now() - start_time).total_seconds() * 1000)

            return PriorArtSearchResult(
                query=f"Multi-strategy search: {technical_field}",
                total_results=total_results,
                patents=unique_patents,
                search_duration_ms=search_duration,
                search_timestamp=start_time,
                confidence_score=confidence_score,
                search_strategy="multi_query_deduplication"
            )

        except Exception as e:
            logger.error(f"Prior art search failed: {str(e)}")
            raise Exception(f"Failed to search for prior art: {str(e)}")

    def _generate_search_queries(
        self,
        description: str,
        technical_field: str,
        keywords: Optional[List[str]] = None
    ) -> List[str]:
        """
        Generate multiple search queries using different strategies

        Returns list of search queries optimized for patent searching
        """
        queries = []

        # Extract key technical terms from description
        tech_terms = self._extract_technical_terms(description)

        # Strategy 1: Technical field + key terms
        if tech_terms:
            field_query = f"{technical_field} {' '.join(tech_terms[:5])}"
            queries.append(field_query)

        # Strategy 2: Problem-solution based
        problem_terms = self._extract_problem_terms(description)
        if problem_terms:
            problem_query = f"method system apparatus {' '.join(problem_terms[:3])}"
            queries.append(problem_query)

        # Strategy 3: Technology + function combination
        function_terms = self._extract_function_terms(description)
        if function_terms:
            function_query = f"{technical_field.split('/')[0]} {' '.join(function_terms[:3])}"
            queries.append(function_query)

        # Strategy 4: User-provided keywords
        if keywords:
            keyword_query = ' '.join(keywords[:5])
            queries.append(keyword_query)

        # Strategy 5: Broad technical field search
        queries.append(technical_field)

        # Clean and deduplicate queries
        cleaned_queries = []
        for query in queries:
            cleaned = self._clean_search_query(query)
            if cleaned and cleaned not in cleaned_queries:
                cleaned_queries.append(cleaned)

        return cleaned_queries[:5]  # Return top 5 queries

    def _extract_technical_terms(self, description: str) -> List[str]:
        """Extract technical terms from invention description"""
        # Common technical term patterns
        tech_patterns = [
            r'\b\w*(?:system|method|apparatus|device|process|algorithm|protocol)\b',
            r'\b\w*(?:network|database|interface|module|engine|framework)\b',
            r'\b\w*(?:analysis|processing|detection|recognition|optimization)\b'
        ]

        import re
        terms = set()

        for pattern in tech_patterns:
            matches = re.findall(pattern, description.lower())
            terms.update(matches)

        # Filter out common words
        common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        technical_terms = [term for term in terms if term not in common_words and len(term) > 3]

        return sorted(technical_terms, key=len, reverse=True)[:10]

    def _extract_problem_terms(self, description: str) -> List[str]:
        """Extract problem/challenge related terms"""
        problem_indicators = ['problem', 'challenge', 'difficulty', 'limitation', 'issue', 'need']

        words = description.lower().split()
        problem_terms = []

        for i, word in enumerate(words):
            if any(indicator in word for indicator in problem_indicators):
                # Get surrounding context
                start = max(0, i - 2)
                end = min(len(words), i + 3)
                context_terms = [w for w in words[start:end] if len(w) > 3]
                problem_terms.extend(context_terms)

        return list(set(problem_terms))[:5]

    def _extract_function_terms(self, description: str) -> List[str]:
        """Extract functional/action terms"""
        function_patterns = [
            r'\b(?:detect|analyze|process|generate|create|optimize|improve|enhance|reduce)\w*\b',
            r'\b(?:calculate|determine|identify|classify|predict|estimate|measure)\w*\b',
            r'\b(?:control|manage|monitor|track|observe|record|store|retrieve)\w*\b'
        ]

        import re
        functions = set()

        for pattern in function_patterns:
            matches = re.findall(pattern, description.lower())
            functions.update(matches)

        return sorted(list(functions))[:5]

    def _clean_search_query(self, query: str) -> str:
        """Clean and optimize search query for patent searching"""
        # Remove special characters and normalize
        import re
        cleaned = re.sub(r'[^\w\s-]', ' ', query)
        cleaned = ' '.join(cleaned.split())  # Remove extra whitespace

        # Limit query length (Google Custom Search has limits)
        if len(cleaned) > 100:
            words = cleaned.split()
            cleaned = ' '.join(words[:15])  # Keep first 15 words

        return cleaned.strip()

    async def _search_patents(
        self,
        query: str,
        date_range: Optional[Tuple[str, str]] = None,
        max_results: int = 20
    ) -> List[PatentResult]:
        """
        Search patents using Google Custom Search Engine
        """
        if not self.api_key or not self.search_engine_id:
            logger.warning("Google Patents API key or Search Engine ID not configured")
            return []

        try:
            # Build search parameters
            params = {
                'key': self.api_key,
                'cx': self.search_engine_id,
                'q': query,
                'num': min(max_results, 10),  # Google CSE limit is 10 per request
                'start': 1,
                'fileType': 'pdf',  # Focus on patent PDFs
                'siteSearch': 'patents.google.com',
                'siteSearchFilter': 'i'  # Include only patents.google.com
            }

            # Add date range if specified
            if date_range:
                start_date, end_date = date_range
                params['sort'] = f'date:r:{start_date}:{end_date}'

            patents = []

            # Make multiple requests if needed (Google CSE returns max 10 per request)
            for start_index in range(1, min(max_results + 1, 101), 10):  # Max 100 results
                params['start'] = start_index

                async with self.session.get(self.custom_search_url, params=params) as response:
                    if response.status != 200:
                        logger.warning(f"Google CSE request failed: {response.status}")
                        break

                    data = await response.json()

                    if 'items' not in data:
                        break

                    # Process search results
                    for item in data['items']:
                        try:
                            patent = await self._parse_patent_result(item)
                            if patent:
                                patents.append(patent)
                        except Exception as e:
                            logger.warning(f"Failed to parse patent result: {str(e)}")
                            continue

                    # Check if we have more results
                    if len(data['items']) < 10:
                        break

                # Add delay between requests to respect rate limits
                await asyncio.sleep(0.1)

            return patents

        except Exception as e:
            logger.error(f"Patent search failed for query '{query}': {str(e)}")
            return []

    async def _parse_patent_result(self, item: Dict[str, Any]) -> Optional[PatentResult]:
        """
        Parse a single patent search result from Google CSE
        """
        try:
            # Extract patent ID from URL
            patent_url = item.get('link', '')
            patent_id = self._extract_patent_id_from_url(patent_url)

            if not patent_id:
                return None

            # Extract basic information
            title = item.get('title', '').replace(' - Google Patents', '')
            snippet = item.get('snippet', '')

            # Try to extract structured data from the page metadata
            page_map = item.get('pagemap', {})

            # Extract inventors
            inventors = []
            if 'person' in page_map:
                inventors = [person.get('name', '') for person in page_map['person'] if person.get('name')]

            # Extract assignee
            assignee = ''
            if 'organization' in page_map:
                organizations = page_map['organization']
                if organizations:
                    assignee = organizations[0].get('name', '')

            # Extract dates
            filing_date = ''
            publication_date = ''
            if 'metatags' in page_map:
                meta = page_map['metatags'][0] if page_map['metatags'] else {}
                filing_date = meta.get('citation_patent_filing_date', '')
                publication_date = meta.get('citation_patent_publication_date', '')

            # Classification codes (if available)
            classification = []
            if 'cse_thumbnail' in page_map:
                # Sometimes classification info is in thumbnails
                pass

            return PatentResult(
                patent_id=patent_id,
                title=title,
                abstract=snippet[:500] if snippet else '',
                inventors=inventors,
                assignee=assignee,
                filing_date=filing_date,
                publication_date=publication_date,
                patent_office=self._determine_patent_office(patent_id),
                classification=classification,
                url=patent_url,
                similarity_score=0.0,  # Will be calculated later
                relevance_reason=""
            )

        except Exception as e:
            logger.warning(f"Failed to parse patent result: {str(e)}")
            return None

    def _extract_patent_id_from_url(self, url: str) -> str:
        """Extract patent ID from Google Patents URL"""
        import re

        # Pattern for Google Patents URLs
        patterns = [
            r'patents\.google\.com/patent/([A-Z]{2}\d+[A-Z]\d*)',  # US20210123456A1 format
            r'patents\.google\.com/patent/([A-Z]+\d+)',  # Simpler formats
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)

        return ''

    def _determine_patent_office(self, patent_id: str) -> str:
        """Determine patent office from patent ID"""
        if patent_id.startswith('US'):
            return 'USPTO'
        elif patent_id.startswith('EP'):
            return 'EPO'
        elif patent_id.startswith('WO'):
            return 'WIPO'
        elif patent_id.startswith('CN'):
            return 'CNIPA'
        elif patent_id.startswith('JP'):
            return 'JPO'
        elif patent_id.startswith('KR'):
            return 'KIPO'
        else:
            return 'Unknown'

    def _deduplicate_and_rank(
        self,
        patents: List[PatentResult],
        invention_description: str,
        max_results: int
    ) -> List[PatentResult]:
        """
        Remove duplicate patents and rank by relevance
        """
        # Deduplicate by patent ID
        seen_ids = set()
        unique_patents = []

        for patent in patents:
            if patent.patent_id not in seen_ids:
                seen_ids.add(patent.patent_id)
                unique_patents.append(patent)

        # Calculate similarity scores
        for patent in unique_patents:
            patent.similarity_score = self._calculate_similarity_score(
                patent,
                invention_description
            )
            patent.relevance_reason = self._generate_relevance_reason(
                patent,
                invention_description
            )

        # Sort by similarity score (descending)
        ranked_patents = sorted(
            unique_patents,
            key=lambda p: p.similarity_score,
            reverse=True
        )

        return ranked_patents[:max_results]

    def _calculate_similarity_score(
        self,
        patent: PatentResult,
        invention_description: str
    ) -> float:
        """
        Calculate similarity score between patent and invention
        """
        # Simple text similarity calculation
        # In a production system, you might use more sophisticated NLP techniques

        patent_text = f"{patent.title} {patent.abstract}".lower()
        invention_text = invention_description.lower()

        # Extract words
        patent_words = set(patent_text.split())
        invention_words = set(invention_text.split())

        # Calculate Jaccard similarity
        intersection = patent_words.intersection(invention_words)
        union = patent_words.union(invention_words)

        if len(union) == 0:
            return 0.0

        jaccard_score = len(intersection) / len(union)

        # Boost score for recent patents
        try:
            if patent.publication_date:
                pub_year = int(patent.publication_date.split('-')[0])
                current_year = datetime.now().year
                recency_boost = max(0, 1 - (current_year - pub_year) / 20)  # 20-year decay
                jaccard_score *= (1 + recency_boost * 0.2)  # Up to 20% boost
        except:
            pass

        return min(1.0, jaccard_score)

    def _generate_relevance_reason(
        self,
        patent: PatentResult,
        invention_description: str
    ) -> str:
        """
        Generate explanation for why this patent is relevant
        """
        patent_text = f"{patent.title} {patent.abstract}".lower()
        invention_text = invention_description.lower()

        # Find common key terms
        patent_words = set(word for word in patent_text.split() if len(word) > 4)
        invention_words = set(word for word in invention_text.split() if len(word) > 4)

        common_terms = patent_words.intersection(invention_words)

        if len(common_terms) >= 3:
            key_terms = sorted(list(common_terms))[:3]
            return f"Shares key concepts: {', '.join(key_terms)}"
        elif patent.assignee:
            return f"Related work by {patent.assignee}"
        elif patent.patent_office == 'USPTO':
            return "US patent in similar technical field"
        else:
            return "Similar technical approach"

    def _calculate_search_confidence(
        self,
        unique_results: int,
        total_results: int,
        query_count: int
    ) -> float:
        """
        Calculate confidence level in search comprehensiveness
        """
        if total_results == 0:
            return 0.0

        # Base confidence on number of results and query diversity
        result_confidence = min(1.0, unique_results / 20)  # Normalize to 20 results
        query_confidence = min(1.0, query_count / 3)  # Normalize to 3 queries
        diversity_penalty = max(0.5, unique_results / max(1, total_results))  # Penalize duplicates

        overall_confidence = (result_confidence + query_confidence + diversity_penalty) / 3

        return round(overall_confidence, 2)

# Convenience function for standalone usage
async def search_patents(
    invention_description: str,
    technical_field: str,
    keywords: Optional[List[str]] = None,
    max_results: int = 20
) -> PriorArtSearchResult:
    """
    Convenience function for searching patents

    Args:
        invention_description: Description of the invention
        technical_field: Technical field/domain
        keywords: Optional list of keywords
        max_results: Maximum results to return

    Returns:
        PriorArtSearchResult with found patents
    """
    async with GooglePatentsAPI() as api:
        return await api.search_prior_art(
            invention_description=invention_description,
            technical_field=technical_field,
            keywords=keywords,
            max_results=max_results
        )