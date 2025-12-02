import { generateToken } from "../lib/generateToken.js";
import { generateOtp } from "../lib/generateVerificationOtp.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {
  sendResetPasswordEmail,
  sendResetSuccessMail,
  sendVerificationEmail,
} from "../nodemailer/email.js";
import crypto from "crypto";

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;

    if (!fullName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ msg: "All the fields are required." });
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: "User already exists." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "password must be at least 6 characters long" });
    }

    if (password != confirmPassword) {
      return res.status(400).json({ msg: "Passwords does not match" });
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
      msg: "User Signed up successfully.",
      fullName,
      username,
      email,
      profilePic: User.profilePic,
    });
  } catch (error) {
    console.log("Error in signup controller", error.message);
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
        .json({ msg: "Invalid or expired verification code" });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    res.status(200).json({ msg: "User Verified successfully" });
  } catch (error) {
    console.log("Error in verify-email controller", error.message);
    res.status(500).json("Internal server error.");
  }
};

export const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (username !== user.username) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      msg: "Login Successful",
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller:", error.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ msg: "Logout successful" });
  } catch (error) {
    console.log("Error in logout controller:", error.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    res.status(200).json({
      authUser: req.user,
    });
  } catch (error) {
    console.log("Error in checkAuth controller:", error.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const newPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        msg: "All the fields are required",
      });
    }

    const user = await User.findById(req.user.id);

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ msg: "current Password is incorrect" });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        msg: "Current Password and New Password cannot be same",
      });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ msg: "New password should be at least 6 characters long." });
    }

    const salt = 10;
    const newHashPassword = await bcrypt.hash(newPassword, salt);

    user.password = newHashPassword;
    await user.save();

    res.status(200).json({ msg: "Password updated successfully" });
  } catch (error) {
    console.log("Error in resetPassword controller:", error.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(400).json({ msg: "User does not exists" });
    }

    const { otp, hexOtp, otpExpires } = generateOtp();

    user.verificationOtp = hexOtp;
    user.verificationOtpExpires = otpExpires;
    await user.save();

    sendVerificationEmail(user.email, otp);

    res.status(200).json({ msg: "Otp send successfully" });
  } catch (error) {
    console.log("Error in resendOtp controller:", error.message);
    res.status(500).json("Internal server error");
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ msg: "Please enter your email" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; //1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetPasswordExpires;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}}`;
    await sendResetPasswordEmail(user.email, resetUrl);

    res.status(200).json({ msg: "Email sent successfully" });
  } catch (error) {
    console.log("Error in forgotPassword controller:", error.message);
    res.status(500).json("Internal server error");
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ msg: "Invalid or expired reset token" });

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    sendResetSuccessMail(user.email);
  } catch (error) {
    console.log("Error in resetPassword controller:", error.message);
    res.status(500).json("Internal server error");
  };
};


