const postSchema = mongoose.Schema({
    imageUrl: {
        type: String,
        required: true, // Image URL is required for a post
    },
    text: {
        type: String,
        required: false, // Optional field for additional text
    },
    likes: {
        type: Number,
        default: 0, // Default value for likes
    },
    commentsCount: {
        type: Number,
        default: 0, // Default value for comment count
    },
    comments: [{
        username: {
            type: String,
            required: true, // Ensure each comment has a username
        },
        text: {
            type: String,
            required: true, // Ensure each comment has text
        },
        createdAt: {
            type: Date,
            default: Date.now, // Default to current date
        },
    }],
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = postSchema; // Export the post schema
