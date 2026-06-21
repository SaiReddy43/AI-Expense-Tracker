import User from '../Models/User.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // 1. Added missing JWT library import

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const databasePassword = user.passwordHash || user.password_hash;
        const match = await bcrypt.compare(password, databasePassword);
        if (!match) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 2. FIXED: Replaced signToken() with explicit, inline jwt.sign() 
        // This ensures the payload property key matches your 'protect' middleware ('userId')
        const token = jwt.sign(
            { user_id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' }
        ); 

        res.json({
            token,
            user: {
                user_id: user._id,
                name: user.name,
                email: user.email,
                currency: user.currency
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// export const login = async (req, res) => {
//   console.log("Login route hit");

//   try {
//     console.log(req.body);

//     // existing login code

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: error.message });
//   }
// };
// export const login = async (req, res) => {
//   console.log("1. Login route hit");

//   try {
//     const { email, password } = req.body;

//     console.log("2. Request body received");

//     const user = await User.findOne({ email });

//     console.log("3. User query completed");

//     if (!user) {
//       return res.status(401).json({
//         message: "Invalid credentials"
//       });
//     }

//     const isMatch = await bcrypt.compare(
//       password,
//       user.password
//     );

//     console.log("4. Password compared");

//     if (!isMatch) {
//       return res.status(401).json({
//         message: "Invalid credentials"
//       });
//     }

//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET
//     );

//     console.log("5. Token generated");

//     res.json({
//       token
//     });

//     console.log("6. Response sent");

//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       message: error.message
//     });
//   }
// };