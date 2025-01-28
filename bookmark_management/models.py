from pydantic import BaseModel
from typing import List

# Database Model for Bookmark
class Bookmark(BaseModel):
    url: str
    title: str
    description: str
    tags: List[str]

class TagSuggestionRequest(BaseModel):
    content: str

class TagSuggestionResponse(BaseModel):
    suggested_tags: List[str]
