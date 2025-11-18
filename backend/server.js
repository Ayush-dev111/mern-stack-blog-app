import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./src/lib/database.js"
import authRoutes from "./src/routes/auth.routes.js";
const app = express();
const PORT = process.env.PORT || 3500;

dotenv.config();
connectDB();

//middlewares
app.use(express.json());
app.use(cookieParser);

//routes
app.use("/api/auth", authRoutes);
app.get("/", (req,res) => {
    res.send("Api is running");
});

app.listen(PORT, () =>{
    console.log(`Server is running on server http://localhost:${PORT}`);
});

