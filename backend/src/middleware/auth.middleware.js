import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.js";
dotenv.config();

export const protectRoute = async (req, res , next) =>{
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(404).json({message: "No token found"});
        };

        console.log("token", token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({message: "Unauthorized- invalid token"});
        };

        const user = await User.findById({id: decoded.id}).select("-password");

        req.user = user;

        next();
    } catch (error) {
        console.log("Error in protect route:", error.message);
        res.status(500).json({message: "Internal server error"});
    }
}