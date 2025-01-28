import React, { useState, useEffect } from "react";
import axios from "axios";

function Shortener({ token }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [userUrls, setUserUrls] = useState([]);

  useEffect(() => {
    fetchUserUrls();
  }, []);

  const fetchUserUrls = async () => {
    try {
      const response = await axios.get("http://localhost:5000/user/urls", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserUrls(response.data);
    } catch (err) {
      alert("Error fetching user URLs");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/shorten",
        { originalUrl, alias },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShortUrl(response.data.shortUrl);
      fetchUserUrls();
    } catch (err) {
      alert("Error shortening URL");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="p-6 bg-white shadow-lg rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">URL Shortener</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Original URL
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Custom Alias (Optional)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Shorten URL
          </button>
        </form>
        {shortUrl && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">Shortened URL:</p>
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              {shortUrl}
            </a>
          </div>
        )}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Your URLs
          </h2>
          <ul className="space-y-2">
            {userUrls.map((url) => (
              <li key={url._id} className="text-sm text-gray-700">
                <a
                  href={`http://localhost:5000/${url.shortUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  {`http://localhost:5000/${url.shortUrl}`}
                </a>
                <p className="text-xs text-gray-500">Clicks: {url.clicks}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Shortener;
