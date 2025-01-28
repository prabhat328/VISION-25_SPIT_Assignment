from fastapi import FastAPI, HTTPException, Query
from typing import List
import sqlite3
import models, ai, database
import logging

app = FastAPI()

# Initialize the database
database.create_bookmark_table()

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Endpoint to create a bookmark
@app.post("/bookmarks/", response_model=models.Bookmark)
def create_bookmark(bookmark: models.Bookmark):
    try:
        # Save the bookmark to the database
        database.save_bookmark(bookmark)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Bookmark already exists")
    return bookmark

# Endpoint to get all bookmarks
@app.get("/bookmarks/", response_model=List[models.Bookmark])
def get_bookmarks():
    # Retrieve all bookmarks from the database
    bookmarks = database.get_bookmarks()
    return bookmarks

# Endpoint to suggest tags using Gemini API
@app.post("/tags/suggest", response_model=models.TagSuggestionResponse)
def suggest_tags(request: models.TagSuggestionRequest):
    # Get tag suggestions using Gemini API
    tags = ai.get_tag_suggestions(request.content)
    return models.TagSuggestionResponse(suggested_tags=tags)

# Endpoint to search for bookmarks by tags
@app.get("/bookmarks/search", response_model=List[models.Bookmark])
def search_bookmarks(tags: List[str] = Query([])):
    """
    Endpoint to search for bookmarks by tags. If no tags are provided,
    it returns all bookmarks.
    """
    if not tags:
        # If no tags are specified, return all bookmarks
        bookmarks = database.get_bookmarks()
    else:
        # Filter bookmarks by tags
        bookmarks = database.get_bookmarks_by_tags(tags)

    return bookmarks
