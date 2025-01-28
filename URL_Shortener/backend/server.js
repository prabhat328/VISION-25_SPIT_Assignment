const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = mongoose.connect(
      process.env.MONGO || "mongodb://localhost:27017/urlShortener"
    );
    console.log(`Database Connected`);
  } catch (error) {
    console.error(`Error : ${error.message}`);
    process.exit(1);
  }
};

connectDB();

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
  alias: String,
  clicks: { type: Number, default: 0 },
  createdBy: mongoose.Schema.Types.ObjectId, // Reference to User
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Url = mongoose.model("Url", urlSchema);

// Routes
const JWT_SECRET = "your_jwt_secret";

// Routes
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send("User registered successfully");
  } catch (err) {
    res.status(500).send("Error registering user");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send("Invalid credentials");
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).send("Error logging in");
  }
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Unauthorized");

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    res.status(401).send("Invalid token");
  }
};

app.post("/shorten", authenticate, async (req, res) => {
  const { originalUrl, alias } = req.body;
  try {
    let shortUrl = alias || Math.random().toString(36).substr(2, 6);
    const url = new Url({
      originalUrl,
      shortUrl,
      alias: shortUrl,
      createdBy: req.userId,
    });
    await url.save();
    res.json({
      originalUrl: url.originalUrl,
      shortUrl: `http://localhost:5000/${url.shortUrl}`,
      alias: url.alias,
      clicks: url.clicks,
    });
  } catch (err) {
    res.status(500).send("Error creating short URL");
  }
});

app.get("/user/urls", authenticate, async (req, res) => {
  try {
    const urls = await Url.find({ createdBy: req.userId });
    res.json(urls);
  } catch (err) {
    res.status(500).send("Error fetching URLs");
  }
});

app.get("/:shortUrl", async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });
    if (url) {
      url.clicks += 1;
      await url.save();
      res.redirect(url.originalUrl);
    } else {
      res.status(404).send("URL not found");
    }
  } catch (err) {
    res.status(500).send("Error redirecting");
  }
});

app.get("/analytics/:shortUrl", async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const url = await Url.findOne({ shortUrl });
    if (url) {
      res.json({
        originalUrl: url.originalUrl,
        clicks: url.clicks,
        createdAt: url.createdAt,
      });
    } else {
      res.status(404).send("URL not found");
    }
  } catch (err) {
    res.status(500).send("Error fetching analytics");
  }
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
