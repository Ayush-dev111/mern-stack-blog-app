import { generateToken } from "../lib/generateToken.js";
import { generateOtp } from "../lib/generateVerificationOtp.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "../nodemailer/email.js";
import crypto from "crypto";
import { log } from "console";

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
      return res
        .status(400)
        .json({ message: "password must be at least 6 characters long" });
    }

    if (password != confirmPassword) {
      return res.status(400).json({ message: "Passwords does not match" });
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);
    const { otp, hexOtp, otpExpires } = generateOtp();

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      verificationOtp: hexOtp,
      verificationOtpExpires: otpExpires,
    });

    await newUser.save();
    await generateToken(newUser._id, res);
    sendVerificationEmail(email, otp);

    res.status(201).json({
      message: "User Signed up successfully.",
      fullName,
      username,
      email,
      profilePic: User.profilePic,
    });
  } catch (error) {
    console.log("Error in signup route", error);
    res.status(500).json("Internal server error.");
  }
};

export const verifyOtp = async (req, res) => {
  try {
    let { otp } = req.body;

    
    otp = String(otp).trim();

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    

    const user = await User.findOne({
      verificationOtp: hashedOtp,
      verificationOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    res.status(200).json({message: "User Verified successfully"});
  } catch (error) {
    console.log("Error in verify-email route", error.message);
    res.status(500).json("Internal server error.");
  }
};

export const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (username !== user.username) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      message: "Login Successful",
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login route:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log("Error in logout route:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    res.status(200).json({
      authUser: req.user,
    });
  } catch (error) {
    console.log("Error in checkAuth route:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
    try {
      const {currentPassword, newPassword} = req.body;

    if(!currentPassword || !newPassword){
        return res.status(400).json({
          message: "All the fields are required"
        });
    };

    const user = await User.findById(req.user.id);
    
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

    if(!isPasswordCorrect){
       return res.status(400).json({message: "current Password is incorrect"})
    };
    if(currentPassword === newPassword){
      return res.status(400).json({
        message: "Current Password and New Password cannot be same"
      });
    };


    if(newPassword.length < 6){
      return res.status(400).json({message: "New password should be at least 6 characters long."})
    }
   
    const salt = 10;
    const newHashPassword = await bcrypt.hash(newPassword, salt);

    user.password = newHashPassword;
    await user.save();


    res.status(200).json({message: "Password updated successfully"})
    
    
    } catch (error) {
      console.log("Error in resetPassword route:", error.message);
    res.status(500).json({ message: "Internal server error" });
    }

};

