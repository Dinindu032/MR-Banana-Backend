import bcryt from "bcrypt";
import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import _ from "lodash";
import User from "../models/User.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    return res.json({ message: "user already existed" });
  }

  const hashpassword = await bcryt.hash(password, 10);
  const newUser = new User({
    username,
    email,
    password: hashpassword,
  });

  await newUser.save();
  return res.json({ status: true, message: "record registed" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const validPassword = await bcryt.compare(password, user.password);

  if (!user) {
    return res.json({ message: "user is not registered" });
  }

  if (!validPassword) {
    return res.json({ message: "password is incorrect" });
  }

  const token = jwt.sign({ username: user.username }, process.env.MY_KEY, {
    expiresIn: "1h",
  });
  res.cookie("token", token, { httpOnly: true, maxAge: 360000 });
  return res.json({
    status: true,
    message: "login successfully",
    data: _.pick(user.toJSON(), ["score", "username", "email", "_id"]),
  });
});

router.post("/score", async (req, res) => {
  const { bananaScore, userId } = req.body;

  if (
    bananaScore === undefined ||
    isNaN(bananaScore) ||
    Boolean(userId) === false
  ) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const user = await User.findById(userId); // Authenticate user
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's banana score in the database
    user.score = bananaScore;
    await user.save();

    res.status(200).json({
      message: "Banana score updated successfully",
      score: user.score,
    });
  } catch (error) {
    console.error("Error updating banana score:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/leaderboard", async (_req, res) => {
  try {
    const users = await User.find({}).sort({ bananaScore: -1 }).limit(10);
    res.status(200).json({
      status: true,
      message: "Leaderboard fetched successfully",
      data: users.map((user) => _.pick(user.toJSON(), ["username", "score"])),
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
