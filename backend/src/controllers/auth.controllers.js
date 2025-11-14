import { generateToken } from "../lib/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;

    if (!fullName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All the fields are required." });
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "User already exists." });
    }

    if (password.length < 6) {
      return res.status(400).json({message: "password must be at least 6 characters long"});
    };

    if (password != confirmPassword) {
      return res.status(400).json({ message: "Passwords does not match" });
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    await generateToken(newUser._id, res);

    res.status(201).json({
      message: "User Signed up successfully.",
      fullName,
      username,
      email,
    });
  } catch (error) {
    console.log("Error in signup route", error);
    res.status(500).json("Internal server error.");
  }
};

export const login = async (req, res) => {};

export const logout = async (req, res) => {};
