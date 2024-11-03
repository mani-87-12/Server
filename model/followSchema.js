const followSchema = mongoose.Schema({
    followersCount: {
        type: Number,
        default: 0, // Default value for follower count
    },
    followers: [{
        username: {
            type: String,
            required: true, // Ensure each follower has a username
        },
    }],
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = followSchema; // Export the follow schema
