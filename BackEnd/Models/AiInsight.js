import mongoose from 'mongoose';

const aiInsightSchema = new mongoose.Schema(
    {
        // Links back to your User model (_id)
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Insight must belong to a user']
        },
        insight_type: {
            type: String,
            required: [true, 'Insight type is required'],
            trim: true // e.g., 'monthly_summary' or 'savings_tips' from your frontend logic
        },
        period_start: {
            type: Date,
            default: null
        },
        period_end: {
            type: Date,
            default: null
        },
        // Replaces JSONB NOT NULL with a native, flexible MongoDB Object
        content_json: {
            type: mongoose.Schema.Types.Mixed, 
            required: [true, 'Insight content cannot be empty']
        }
    },
    {
        // Automatically adds created_at and manages updates
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

// --- PERFORMANCE INDEX ---
// Replaces: CREATE INDEX idx_insights_user_created ON ai_insights(user_id, created_at DESC);
// This optimizes loading the latest AI logs chronologically for your UI dashboard view.
aiInsightSchema.index({ user_id: 1, created_at: -1 });

const AiInsight = mongoose.model('AiInsight', aiInsightSchema);
export default AiInsight;
