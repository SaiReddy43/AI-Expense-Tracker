import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxLength: [100, 'Name cannot exceed 100 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true, // Replaces your UNIQUE constraint
            trim: true,
            lowercase: true
        },
        passwordHash: {
            type: String,
            required: [true, 'Password is required']
        },
        currency: {
            type: String,
            default: 'USD',
            maxLength: [3, 'Currency code must be 3 characters']
        }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } // Replaces DEFAULT NOW()
    }
);

const User = mongoose.model('User', userSchema);
export default User;
