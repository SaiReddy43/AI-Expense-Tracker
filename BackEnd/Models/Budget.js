import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
    {
        // Links back to your User model (_id)
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Budget must belong to a user']
        },
        // Links back to your Category model (_id)
        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Budget must target a category']
        },
        amount: {
            type: Number,
            required: [true, 'Budget amount is required'],
            min: [0.01, 'Budget amount must be greater than 0'] // Replaces CHECK (amount > 0)
        },
        period: {
            type: String,
            required: [true, 'Budget period is required'],
            enum: ['monthly', 'weekly'], // Replaces CHECK (period IN ('monthly', 'weekly'))
            default: 'monthly'
        },
        start_date: {
            type: Date,
            required: [true, 'Start date is required']
        }
    },
    {
        // Automatically adds created_at and manages updates
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

// --- UNIQUE CONSTRAINT ---
// Replaces: UNIQUE (user_id, category_id, period)
// Prevents a user from creating duplicate budget rules for the same category and period
budgetSchema.index({ user_id: 1, category_id: 1, period: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
