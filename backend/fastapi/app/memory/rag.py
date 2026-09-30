from typing import List, Dict, Any
from app.memory.long_term import memory_manager, MemoryEntry


class RAGPipeline:
    """Document chunking, vector embedding, and contextual search retrieval pipeline."""

    def ingest_document(self, title: str, text_content: str, chunk_size: int = 500) -> int:
        words = text_content.split()
        chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

        count = 0
        for chunk in chunks:
            memory_manager.add_memory(
                content=chunk,
                memory_type="rag_document",
                metadata={"title": title, "chunk_index": count}
            )
            count += 1
        return count

    def retrieve_context(self, query: str, max_chunks: int = 3) -> str:
        entries: List[MemoryEntry] = memory_manager.search_memories(query, limit=max_chunks)
        if not entries:
            return ""
        return "\n---\n".join([e.content for e in entries])


rag_pipeline = RAGPipeline()
