import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from './Routes/authRoutes.js'
import connectDB from './Utils/db.js'
import categoryRoutes from './Routes/categoryRoutes.js'
import transactionRoutes from './Routes/transactionRoutes.js'
import budgetRoutes from './Routes/budgetRoutes.js'
import dashboardRoutes from './Routes/dashboardRoutes.js'
import insightRoutes from './Routes/insightRoutes.js'

dotenv.config();

const app=express();
const PORT=process.env.PORT||5000;

connectDB()
app.use(cors())
app.use(express.json());

app.use('/api/auth',authRoutes)
app.use('/api/categories',categoryRoutes)
app.use('/api/transactions',transactionRoutes)
app.use('/api/budgets',budgetRoutes)
app.use('/api/dashboard',dashboardRoutes)
app.use('/api/insights',insightRoutes);

app.get("/test", (req, res) => {
  console.log("TEST ROUTE HIT");
  res.json({ message: "Server OK" });
});

app.get('/',(req,res)=>{
    res.json("AI Expense Tracker");
})



app.listen(PORT,()=>{
    console.log(`server is running at port ${PORT}`);
})