import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Category must belong to a user']
        },
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            maxLength: [500]
        },
        type: {
            type: String,
            required: [true, 'Type is required'],
            enum: ['income', 'expense'] // Replaces your SQL CHECK constraint
        },
        icon: {
            type: String,
            default: ''
        },
        color: {
            type: String,
            default: '#000000',
            maxLength: [7, 'Color must be a valid hex string']
        },
        is_default: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

// Replaces your SQL: UNIQUE (user_id, name, type)
categorySchema.index({ user_id: 1, name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
