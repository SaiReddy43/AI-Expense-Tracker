import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        // Links back to the User model (_id)
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Transaction must belong to a user']
        },
        // Links back to your Category model (_id)
        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null // Replaces ON DELETE SET NULL behavior
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be greater than 0'] // Replaces CHECK (amount > 0)
        },
        type: {
            type: String,
            required: [true, 'Type is required'],
            enum: ['income', 'expense'] // Replaces CHECK (type IN ('income', 'expense'))
        },
        description: {
            type: String,
            trim: true,
            maxLength: [255, 'Description cannot exceed 255 characters']
        },
        notes: {
            type: String,
            trim: true
        },
        transaction_date: {
            type: Date,
            required: [true, 'Transaction date is required']
        }
    },
    {
        // Automatically adds created_at and manages updates
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

// --- PERFORMANCE INDEXES (Translating your SQL CREATE INDEX lines) ---

// Replaces: CREATE INDEX idx_txn_user_date ON transactions(user_id, transaction_date DESC);
transactionSchema.index({ user_id: 1, transaction_date: -1 });

// Replaces: CREATE INDEX idx_txn_category ON transactions(category_id);
transactionSchema.index({ category_id: 1 });


const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
