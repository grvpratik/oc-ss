import axios from "axios";
import 'dotenv/config'

async function searchSubreddits(query) {
	const accessToken = tokenResponse.data.access_token;
	console.log(accessToken, "accessToken");
	// Search subreddits
	const searchResponse = await axios.get(
		"https://oauth.reddit.com/subreddits/search",
		{
			params: {
				q: query,
				limit: 10,
			},
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"User-Agent": "app/1.0",
			},
		}
	);

	// Process and return subreddit results
	return searchResponse.data.data.children.map((sub) => ({
		name: sub.data.display_name,
		subscribers: sub.data.subscribers,
		description: sub.data.public_description,
	}));
}
async function searchRedditPosts({
	query,
	subreddit = "", // Optional specific subreddit
	sort = "relevance", // relevance, hot, top, new, comments
	time = "all", // hour, day, week, month, year, all
	limit = 25,
}) {
	const clientId = process.env.REDDIT_CLIENT_ID;
	const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  console.log(clientId)
	const tokenResponse = await axios.post(
		"https://www.reddit.com/api/v1/access_token",
		new URLSearchParams({
			grant_type: "client_credentials",
		}),
		{
			auth: {
				username: clientId,
				password: clientSecret,
			},
			headers: {
				"User-Agent": "app/1.0",
			},
		}
	);

	// Build search URL
	let searchUrl = "https://oauth.reddit.com/search";
	if (subreddit) {
		searchUrl = `https://oauth.reddit.com/r/${subreddit}/search`;
	}
	const accessToken = tokenResponse.data.access_token;
	// Search posts
	const searchResponse = await axios.get(searchUrl, {
		params: {
			q: query,
			sort,
			t: time,
			limit,
			restrict_sr: !!subreddit, // Restrict to subreddit if specified
			type: "link", // Search for posts
		},
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"User-Agent": "YourAppName/1.0",
		},
	});

	// Process and return post results
	return searchResponse.data.data.children.map((post) => ({
		title: post.data.title,
		author: post.data.author,
		subreddit: post.data.subreddit,
		score: post.data.score,
		upvote_ratio: post.data.upvote_ratio,
		num_comments: post.data.num_comments,
		created_utc: post.data.created_utc,
		url: `https://reddit.com${post.data.permalink}`,
		is_self: post.data.is_self,
		selftext: post.data.selftext,
		link_url: post.data.url,
		is_video: post.data.is_video,
		media: post.data.media,
		thumbnail: post.data.thumbnail,
		awards: post.data.all_awardings?.length || 0,
		post_hint: post.data.post_hint,
		distinguished: post.data.distinguished,
		stickied: post.data.stickied,
		locked: post.data.locked,
		over_18: post.data.over_18,
	}));
}

// Usage examples:
// Search all of Reddit
searchRedditPosts({
	query: "javascript tutorial",
	sort: "top",
	time: "month",
	limit: 5,
}).then((posts) => console.log(posts));

// Search within specific subreddit
// searchRedditPosts({
// 	query: "beginner",
// 	subreddit: "javascript",
// 	sort: "new",
// 	limit: 25,
// }).then((posts) => console.log(posts));
// Usage
// searchSubreddits('technology')
//   .then(subreddits => console.log(subreddits))
//   .catch(error => console.error('Error:', error));
