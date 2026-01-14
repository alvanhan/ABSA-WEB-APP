const API_BASE_URL = 'http://localhost:8000';

export async function searchSteamStore(term = '', language = 'indonesian,english', country = 'ID') {
    try {
        const response = await fetch(
            `${API_BASE_URL}/steam/search?term=${encodeURIComponent(term)}&language=${language}&country=${country}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error searching Steam store:', error);
        throw error;
    }
}

export async function getSteamAppDetails(appid) {
    try {
        const response = await fetch(`${API_BASE_URL}/steam/appdetails/${appid}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching app details:', error);
        throw error;
    }
}

export async function getSteamAppReviews(appid, cursor = '*', numPerPage = 100) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/steam/appreviews/${appid}?cursor=${encodeURIComponent(cursor)}&num_per_page=${numPerPage}&filter=recent&language=indonesian,english`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
}
