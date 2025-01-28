import streamlit as st
import requests

BASE_URL = "http://127.0.0.1:8000"  # Adjust if deployed elsewhere

# Function to call the backend for tag suggestions
def get_tag_suggestions(content):
    response = requests.post(f"{BASE_URL}/tags/suggest", json={"content": content})
    if response.status_code == 200:
        return response.json().get("suggested_tags", [])
    else:
        st.error("Error fetching tag suggestions")
        return []

# Function to handle bookmark saving
def save_bookmark(url, title, description, tags):
    bookmark_data = {
        "url": url,
        "title": title,
        "description": description,
        "tags": tags
    }
    response = requests.post(f"{BASE_URL}/bookmarks/", json=bookmark_data)
    if response.status_code == 200:
        st.success("Bookmark saved successfully!")
    else:
        st.error("Error saving bookmark")

# Function to search and filter bookmarks
def search_bookmarks(tags):
    # Convert the tags input to a list (split by commas)
    if tags:
        tags = [tag.strip() for tag in tags.split(',')]
    else:
        tags = []

    response = requests.get(f"{BASE_URL}/bookmarks/search", params={"tags": tags})
    if response.status_code == 200:
        return response.json()
    else:
        st.error("Error fetching bookmarks")
        return []

# Set the page configuration
st.set_page_config(
    page_title="Smart Bookmarks",
    page_icon="🔖",
    layout="wide"
)

# Inputs for bookmark
url = st.text_input("Bookmark URL")
title = st.text_input("Bookmark Title")
description = st.text_area("Bookmark Description")

# Content area for real-time tag suggestion or manual fetching
content = f"{title} {description}"

# Get tags automatically when content changes (use `on_change` for real-time API call)
suggested_tags = []

if content:
    suggested_tags = get_tag_suggestions(content)

# Show suggested tags
if suggested_tags:
    st.write("Suggested Tags:")
    st.write(", ".join(suggested_tags))

# Option to manually fetch tag suggestions
if st.button("Get Tag Suggestions"):
    if not content:
        st.error("Please enter some content before fetching tag suggestions.")
    else:
        suggested_tags = get_tag_suggestions(content)
        if suggested_tags:
            st.write("Suggested Tags:")
            st.write(", ".join(suggested_tags))

# Manual tag input
manual_tags = st.text_input("Enter tags (comma separated)").split(',')

# Save the bookmark
if st.button("Save Bookmark"):
    if url and title:
        save_bookmark(url, title, description, manual_tags or suggested_tags)
    else:
        st.error("URL and Title are required to save a bookmark.")

# Search Bookmarks by Tags
search_tags = st.text_input("Search bookmarks by tags (comma separated)")

if st.button("Search Bookmarks"):
    bookmarks = search_bookmarks(search_tags)
    
    if bookmarks:
        st.write("### Found Bookmarks:")
        
        # Create a table for bookmarks display
        bookmark_data = []
        for bookmark in bookmarks:
            bookmark_data.append({
                "Title": bookmark['title'],
                "URL": f"[{bookmark['url']}]({bookmark['url']})",  # Markdown clickable URL
                "Description": bookmark['description'] if bookmark['description'] else "No description",
                "Tags": ', '.join(bookmark['tags']) if bookmark['tags'] else "No tags"
            })
        
        # Display bookmarks in a table with markdown rendering
        for bookmark in bookmark_data:
            st.markdown(f"**Title:** {bookmark['Title']}")
            st.markdown(f"**URL:** {bookmark['URL']}")  # Using markdown to render clickable URL
            st.markdown(f"**Description:** {bookmark['Description']}")
            st.markdown(f"**Tags:** {bookmark['Tags']}")
            st.write("---")
        
    else:
        st.write("### No bookmarks found for the given tags.")
