const googleTrends = require('google-trends-api');

// Function to get interest over time
async function getInterestOverTime(keyword) {
    try {
        const results = await googleTrends.interestOverTime({
            keyword: keyword,
            startTime: new Date('2023-01-01'),
            endTime: new Date()
        });
        
        return JSON.parse(results);
    } catch (error) {
        console.error('Error fetching trends:', error);
        throw error;
    }
}

// Function to compare multiple terms
async function compareTerms(terms) {
    try {
        const results = await googleTrends.interestOverTime({
            keyword: terms,
            startTime: new Date('2023-01-01'),
            endTime: new Date()
        });
        
        return JSON.parse(results);
    }
    catch(error) {
        console.error('Error fetching comparison trends:', error);
        throw error;
    }
}

// Function to get related queries
async function getRelatedQueries(keyword) {
    try {
        const results = await googleTrends.relatedQueries({
            keyword: keyword
        });
        
        return JSON.parse(results);
    } catch (error) {
        console.error('Error fetching related queries:', error);
        throw error;
    }
}

// Function to get interest by region
async function getInterestByRegion(keyword) {
    try {
        const results = await googleTrends.interestByRegion({
            keyword: keyword,
            startTime: new Date('2023-01-01'),
            endTime: new Date()
        });
        
        return JSON.parse(results);
    } catch (error) {
        console.error('Error fetching regional interest:', error);
        throw error;
    }
}

// Example usage
async function example() {
    try {
        // Get trends for a single term
        const singleTermTrends = await getInterestOverTime('JavaScript');
        console.log('Single term trends:', singleTermTrends);
        
        // Compare multiple terms
        const comparisonTrends = await compareTerms(['JavaScript', 'Python', 'Java']);
        console.log('Comparison trends:', comparisonTrends);
        
        // Get related queries
        const related = await getRelatedQueries('JavaScript');
        console.log('Related queries:', related);
        
        // Get regional interest
        const regional = await getInterestByRegion('JavaScript');
        console.log('Regional interest:', regional);
    } catch (error) {
        console.error('Error in example:', error);
    }
}
example();