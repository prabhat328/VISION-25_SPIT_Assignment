import sqlite3
from typing import List
from models import Bookmark

# Function to create the bookmark table if it doesn't exist
def create_bookmark_table():
    connection = sqlite3.connect("bookmarks.db")
    cursor = connection.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS bookmarks (
                        id INTEGER PRIMARY KEY,
                        url TEXT,
                        title TEXT,
                        description TEXT,
                        tags TEXT
                    )''')
    connection.commit()
    connection.close()

# Function to save a bookmark to SQLite
def save_bookmark(bookmark: Bookmark):
    connection = sqlite3.connect("bookmarks.db")
    cursor = connection.cursor()
    tags_str = ",".join(bookmark.tags)  # Store tags as a comma-separated string
    cursor.execute('''INSERT INTO bookmarks (url, title, description, tags)
                      VALUES (?, ?, ?, ?)''', 
                   (bookmark.url, bookmark.title, bookmark.description, tags_str))
    connection.commit()
    connection.close()

# Function to retrieve all bookmarks from SQLite
def get_bookmarks() -> List[Bookmark]:
    connection = sqlite3.connect("bookmarks.db")
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM bookmarks")
    rows = cursor.fetchall()
    bookmarks = [Bookmark(url=row[1], title=row[2], description=row[3], tags=row[4].split(',')) for row in rows]
    connection.close()
    return bookmarks

# Function to retrieve bookmarks by tags
def get_bookmarks_by_tags(tags: List[str]) -> List[Bookmark]:
    connection = sqlite3.connect("bookmarks.db")
    cursor = connection.cursor()
    
    # Prepare the SQL query to match any of the tags in the bookmark's tags list
    # We need to ensure that tags are properly handled for multiple inputs
    bookmarks = []
    for tag in tags:
        cursor.execute("SELECT * FROM bookmarks WHERE tags LIKE ?", ('%' + tag + '%',))
        rows = cursor.fetchall()
        for row in rows:
            bookmark = Bookmark(url=row[1], title=row[2], description=row[3], tags=row[4].split(','))
            bookmarks.append(bookmark)
    
    connection.close()
    return bookmarks
