import express from 'express';
import {registerUser} from '../Controllers/registerUser.js';
import {login} from '../Controllers/login.js';
import {getMe} from '../Controllers/getMe.js';
import protect from '../MiddleWares/authMiddleware.js';

const router = express.Router();

// router.post("/login", (req, res) => {
//   console.log("LOGIN ROUTE WORKING");
//   res.json({ message: "Login route reached" });
// });
router.post('/register', registerUser);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;