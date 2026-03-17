const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// Cache to avoid repeated requests
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.get("/api/instagram", async (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.json({ error: "Username is required" });
  }

  // Check cache first
  const cached = cache.get(username.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.json(cached.data);
  }

  try {
    const response = await axios.get(
      `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "X-IG-App-ID": "936619743392459",
          "Accept": "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        }
      }
    );

    const user = response.data.data.user;

    if (!user) {
      return res.json({ error: "User not found" });
    }

    const profileData = {
      username: user.username,
      fullName: user.full_name,
      biography: user.biography,
      profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url,
      followers: user.edge_followed_by.count,
      following: user.edge_follow.count,
      posts: user.edge_owner_to_timeline_media.count,
      isPrivate: user.is_private,
      isVerified: user.is_verified,
    };

    // Store in cache
    cache.set(username.toLowerCase(), {
      data: profileData,
      timestamp: Date.now()
    });

    res.json(profileData);

  } catch (error) {
    console.error("Error fetching Instagram data:", error.message);
    res.json({ error: "User not found or blocked" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Instagram API running on port ${PORT}`);
});
