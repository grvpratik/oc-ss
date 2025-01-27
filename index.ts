// Import the Twitter API v2 library
import TwitterApi from 'twitter-api-v2';

class TwitterClient {
    constructor(config) {
        this.client = new TwitterApi({
            appKey: config.apiKey,
            appSecret: config.apiSecret,
            accessToken: config.accessToken,
            accessSecret: config.accessTokenSecret,
        });
    }

    /**
     * Send a tweet
     * @param {string} message - The message to tweet
     * @returns {Promise} - Returns a promise that resolves with the tweet data
     */
    async sendTweet(message) {
        try {
            // Send the tweet
            const tweet = await this.client.v2.tweet(message);
            console.log('Tweet successfully posted!');
            return tweet;
        } catch (error) {
            console.error('Error posting tweet:', error);
            throw error;
        }
    }

    /**
     * Send a tweet with media
     * @param {string} message - The message to tweet
     * @param {string} mediaPath - Path to the media file
     * @returns {Promise} - Returns a promise that resolves with the tweet data
     */
    async sendTweetWithMedia(message, mediaPath) {
        try {
            // Upload media
            const mediaId = await this.client.v1.uploadMedia(mediaPath);
            
            // Send tweet with media
            const tweet = await this.client.v2.tweet({
                text: message,
                media: { media_ids: [mediaId] }
            });
            
            console.log('Tweet with media successfully posted!');
            return tweet;
        } catch (error) {
            console.error('Error posting tweet with media:', error);
            throw error;
        }
    }
}

// Example usage
const config = {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
};

// Create instance of TwitterClient
const twitterClient = new TwitterClient(config);

// Example: Send a simple tweet
async function sendExample() {
    try {
        await twitterClient.sendTweet('Hello Twitter! This tweet was sent using JavaScript.');
    } catch (error) {
        console.error('Failed to send tweet:', error);
    }
}

// Example: Send a tweet with media
async function sendMediaExample() {
    try {
        await twitterClient.sendTweetWithMedia(
            'Check out this image!',
            './path/to/your/image.jpg'
        );
    } catch (error) {
        console.error('Failed to send tweet with media:', error);
    }
}
(async()=>{

console.log("main");

})()

export default TwitterClient;
