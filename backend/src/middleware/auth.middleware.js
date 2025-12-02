import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";
dotenv.config();

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(404).json({ msg: "No token found" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ msg: "Unauthorized- invalid token" });
    }

    const user = await User.findById(decoded.id).select("-password");
    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protect route:", error.msg);
    res.status(500).json({ msg: "Internal server error" });
  }
};
