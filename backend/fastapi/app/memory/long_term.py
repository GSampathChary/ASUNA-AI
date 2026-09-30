import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class MemoryEntry(BaseModel):
    id: str
    user_id: Optional[str] = None
    memory_type: str  # preference, fact, context, instruction
    content: str
    metadata: Dict[str, Any] = {}
    created_at: str


class MemoryManager:
    """Manages short-term, long-term, and semantic vector memory."""

    def __init__(self):
        self._store: Dict[str, MemoryEntry] = {}

    def add_memory(self, content: str, memory_type: str = "fact", metadata: Dict[str, Any] = None, user_id: str = None) -> MemoryEntry:
        mem_id = str(uuid.uuid4())
        entry = MemoryEntry(
            id=mem_id,
            user_id=user_id,
            memory_type=memory_type,
            content=content,
            metadata=metadata or {},
            created_at=datetime.utcnow().isoformat()
        )
        self._store[mem_id] = entry
        return entry

    def search_memories(self, query: str, limit: int = 5) -> List[MemoryEntry]:
        lower = query.lower()
        results = [m for m in self._store.values() if any(word in m.content.lower() for word in lower.split())]
        return results[:limit]

    def get_preferences(self, user_id: str = None) -> Dict[str, Any]:
        prefs = {}
        for m in self._store.values():
            if m.memory_type == "preference":
                prefs[m.content] = m.metadata
        return prefs


memory_manager = MemoryManager()
