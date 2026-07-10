"""
Search Service
Follows: complete_search_flow.txt, internal_ai_flow.txt, similarity_search.txt, user_flow.txt

User Flow:
  Open Search → Enter Question → Click Search → Relevant Results → Read Information

Internal AI Flow:
  Question → Embedding Model → Question Vector → FAISS Similarity Search → Top K Chunks → Display Results → Log Search Query

Similarity Search:
  User → "What is leave policy?" → Embedding → Vector
  → Compare against Document Chunk 1, 2, 3 → Top 3 Similar → Return
"""
from collections import defaultdict
import numpy as np
from sqlalchemy.orm import Session

from app.core.faiss_store import faiss_store
from app.config import settings

from app.models.search_log import SearchLog
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.services.activity_service import log_activity
from app.services.document_service import get_embedding_model
from openai import OpenAI

# Initialize client once to preserve HTTP connection pooling
_ai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)


def search_documents(
    request: SearchRequest,
    user_id: int,
    db: Session,
) -> SearchResponse:
    """
    Embedding-based semantic search pipeline with chunk merging and advanced prompt engineering.
    """
    # Step 1: Generate query embedding
    model = get_embedding_model()
    query_vector = model.encode([request.query], convert_to_numpy=True).astype(np.float32)

    # Step 2: FAISS Similarity Search → Top K Chunks
    raw_results = faiss_store.search(query_vector, top_k=request.top_k)

    # Step 3: Group and Merge Chunks
    grouped_chunks = defaultdict(list)
    for r in raw_results:
        # We assume faiss_store.search now returns 'chunk_index'
        grouped_chunks[(r["document_id"], r["page_number"])].append(r)
        
    context_blocks = []
    
    for (doc_id, page_num), group in grouped_chunks.items():
        # Sort chunks in this document/page by chunk_index
        group.sort(key=lambda x: x.get("chunk_index", 0))
        
        # Find contiguous sequences to merge
        contiguous_blocks = []
        current_block = [group[0]]
        
        for i in range(1, len(group)):
            if group[i].get("chunk_index", -1) == current_block[-1].get("chunk_index", -2) + 1:
                current_block.append(group[i])
            else:
                contiguous_blocks.append(current_block)
                current_block = [group[i]]
        contiguous_blocks.append(current_block)
        
        # Merge each block by removing overlap
        file_name = group[0]["file_name"]
        for block in contiguous_blocks:
            merged_text = block[0]["chunk_text"]
            for i in range(1, len(block)):
                prev = merged_text
                curr = block[i]["chunk_text"]
                max_overlap = min(len(prev), len(curr), 300)
                overlap_found = False
                for j in range(max_overlap, 0, -1):
                    if prev.endswith(curr[:j]):
                        merged_text += curr[j:]
                        overlap_found = True
                        break
                if not overlap_found:
                    merged_text += "\n\n" + curr
            
            context_blocks.append(
                f"Document: {file_name}\nPage: {page_num}\n\n{merged_text}"
            )

    context_text = "\n\n---\n\n".join(context_blocks)
    
    # Step 4: Build Search Results for the Response
    results = [
        SearchResult(
            document_id=r["document_id"],
            file_name=r["file_name"],
            chunk_text=r["chunk_text"],
            page_number=r["page_number"],
            similarity_score=round(r["similarity_score"], 4),
        )
        for r in raw_results
    ]

    # Step 5: Advanced RAG with Gemini
    prompt = f"""
You are a highly capable AI engineer and corporate assistant. 

INSTRUCTIONS:
1. Answer the user's question explicitly and completely based ONLY on the context below.
2. Never invent or hallucinate information. If the answer is not present in the context, explicitly say: "I cannot answer this based on the provided documents."
3. Provide exhaustive, comprehensive, and fully detailed answers. DO NOT truncate or cut off in the middle of a sentence.
4. If the context spans multiple chunks or pages, combine them naturally into a cohesive answer.
5. Preserve bullet points and numbered lists if they appear in the source context.
6. Only return exactly what was asked. If asked for a list of technologies, return only technologies. If asked to describe a project, describe the entire project completely.
7. ALWAYS append a 'Sources:' section at the very end of your response, citing every document and page you used (e.g., 'Sources:\\n- Resume.pdf (Page 1)').

CONTEXT DOCUMENTS:
{context_text}

QUESTION:
{request.query}

ANSWER:
"""
    try:
        response = None
        models = [
            "tencent/hy3:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemini-2.0-flash-exp:free"
        ]
        
        for m in models:
            try:
                response = _ai_client.chat.completions.create(
                    model=m,
                    messages=[{"role": "user", "content": prompt}]
                )
                llm_response = response.choices[0].message.content
                break
            except Exception:
                continue
                
        if not response:
            raise Exception("All free OpenRouter models are currently overloaded upstream. Please wait a moment and try again.")
            
    except Exception as e:
        llm_response = f"Failed to generate AI response: {str(e)}"

    # Step 6: Logging
    search_log = SearchLog(
        user_id=user_id,
        search_query=request.query,
        results_found=len(results),
    )
    db.add(search_log)
    db.commit()

    log_activity(
        db,
        user_id=user_id,
        activity_type="SEARCH",
        activity_description=f"Searched: '{request.query}' — {len(results)} results found",
    )

    return SearchResponse(
        query=request.query,
        results=results,
        total_results=len(results),
        llm_response=llm_response,
    )

