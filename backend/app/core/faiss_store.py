"""
FAISS Vector Store Manager
Follows: complete_search_flow.txt, internal_processing.txt

Upload flow:
  PDF/TXT → Extract Text → Chunk → Embedding Model → Vectors → FAISS Index

Search flow:
  User Query → Embedding Model → Question Vector → FAISS Similarity Search → Top K Chunks → Return
"""
import os
import pickle
import numpy as np
import faiss
from typing import List, Dict, Any
from app.config import settings


class FAISSStore:
    """Manages FAISS flat index and associated chunk metadata."""

    def __init__(self):
        self.dimension = 384  # all-MiniLM-L6-v2 output dimension
        self.index: faiss.IndexFlatL2 = None   # L2 Euclidean distance
        self.metadata: List[Dict[str, Any]] = []  # [{document_id, chunk_index, chunk_text, file_name, page_number}]
        self._ensure_dirs()
        self._load_or_create()

    def _ensure_dirs(self):
        os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)

    def _load_or_create(self):
        if (
            os.path.exists(settings.FAISS_INDEX_PATH)
            and os.path.exists(settings.FAISS_META_PATH)
        ):
            self.index = faiss.read_index(settings.FAISS_INDEX_PATH)
            with open(settings.FAISS_META_PATH, "rb") as f:
                self.metadata = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []

    def _save(self):
        faiss.write_index(self.index, settings.FAISS_INDEX_PATH)
        with open(settings.FAISS_META_PATH, "wb") as f:
            pickle.dump(self.metadata, f)

    def add_chunks(
        self,
        document_id: int,
        file_name: str,
        chunks: List[Dict[str, Any]],
        embeddings: np.ndarray,
    ):
        """Add document chunks and their embeddings to the index."""
        start_idx = len(self.metadata)
        self.index.add(embeddings)
        for i, chunk in enumerate(chunks):
            self.metadata.append({
                "document_id": document_id,
                "chunk_index": start_idx + i,
                "chunk_text": chunk["chunk_text"],
                "file_name": file_name,
                "page_number": chunk["page_number"],
            })
        self._save()

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        similarity_search.txt:
          User → Embedding → Vector → Compare against Document Chunks → Top K Similar → Return
        """
        if self.index.ntotal == 0:
            return []

        distances, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            meta = self.metadata[idx]
            results.append({
                "document_id": meta["document_id"],
                "chunk_index": meta["chunk_index"],
                "file_name": meta["file_name"],
                "chunk_text": meta["chunk_text"],
                "page_number": meta["page_number"],
                "similarity_score": float(dist),
            })
        return results

    def remove_document(self, document_id: int):
        """Remove all chunks belonging to a document and rebuild the index."""
        if self.index is None or self.index.ntotal == 0:
            return

        remaining_meta = []
        remaining_embeddings = []

        for i, meta in enumerate(self.metadata):
            if meta["document_id"] != document_id:
                # Keep the metadata
                remaining_meta.append(meta)
                # Reconstruct the original vector directly from FAISS
                emb = self.index.reconstruct(i)
                remaining_embeddings.append(emb)

        # Completely reset index and metadata
        self.index = faiss.IndexFlatL2(self.dimension)
        self.metadata = []

        # Re-add preserved data
        if remaining_embeddings:
            emb_matrix = np.array(remaining_embeddings).astype(np.float32)
            self.index.add(emb_matrix)
            
            # Realign chunk_index sequentially
            for i, meta in enumerate(remaining_meta):
                meta["chunk_index"] = i
                self.metadata.append(meta)

        self._save()


# Singleton instance
faiss_store = FAISSStore()
