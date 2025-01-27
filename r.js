const axios = require('axios');

async function searchSubreddits(query) {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  
  // Get access token
  const tokenResponse = await axios.post('https://www.reddit.com/api/v1/access_token', 
    new URLSearchParams({
      grant_type: 'client_credentials'
    }), {
      auth: {
        username: clientId,
        password: clientSecret
      },
      headers: {
        'User-Agent': 'YourAppName/1.0'
      }
    }
  );

  const accessToken = tokenResponse.data.access_token;
console.log(accessToken, 'accessToken')
  // Search subreddits
  const searchResponse = await axios.get('https://oauth.reddit.com/subreddits/search', {
    params: {
      q: query,
      limit: 10
    },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'app/1.0'
    }
  });

  // Process and return subreddit results
  return searchResponse.data.data.children.map(sub => ({
    name: sub.data.display_name,
    subscribers: sub.data.subscribers,
    description: sub.data.public_description
  }));
}

// Usage
searchSubreddits('technology')
  .then(subreddits => console.log(subreddits))
  .catch(error => console.error('Error:', error));