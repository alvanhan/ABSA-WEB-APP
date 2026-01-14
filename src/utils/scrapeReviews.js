import { getSteamAppReviews } from './steamApi';

const REVIEWS_PER_PAGE = 100;
const API_BASE_URL = 'http://localhost:8000';

export async function scrapeReviews(appid, targetCount, onProgress) {
    const allReviews = [];
    const seenRecommendationIds = new Set(); // Track unique review IDs
    let cursor = '*';
    let previousCursor = null; // Track only immediate previous cursor
    let currentPage = 1;
    let consecutiveErrors = 0;
    let consecutiveDuplicatePages = 0;
    const MAX_CONSECUTIVE_ERRORS = 3;
    const MAX_DUPLICATE_PAGES = 5; // Stop if we get 5 pages with all duplicates

    try {
        while (allReviews.length < targetCount) {
            console.log(`Fetching page ${currentPage}, current total: ${allReviews.length}/${targetCount}, cursor: ${cursor.substring(0, 30)}...`);

            // Check if cursor is same as immediate previous (stuck loop)
            if (cursor !== '*' && cursor === previousCursor) {
                console.warn(`Immediate cursor loop detected! Stuck at same cursor, stopping.`);
                break;
            }

            try {
                const data = await getSteamAppReviews(appid, cursor, REVIEWS_PER_PAGE);

                console.log('API Response:', {
                    success: data.success,
                    reviewsCount: data.reviews?.length || 0,
                    hasCursor: !!data.cursor,
                    newCursor: data.cursor?.substring(0, 20) + '...',
                    currentCursor: cursor?.substring(0, 20) + '...'
                });

                if (data.success !== 1) {
                    console.warn(`Steam API returned success: ${data.success}, attempting to continue...`);
                    consecutiveErrors++;
                    
                    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                        throw new Error('Too many consecutive API errors');
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }

                consecutiveErrors = 0;

                if (!data.reviews || data.reviews.length === 0) {
                    console.log('No more reviews available from API');
                    break;
                }

                // Filter out duplicates using recommendationid
                const reviewTexts = data.reviews
                    .filter(r => {
                        if (!r.recommendationid || seenRecommendationIds.has(r.recommendationid)) {
                            return false;
                        }
                        seenRecommendationIds.add(r.recommendationid);
                        return r.review && r.review.trim();
                    })
                    .map(r => ({
                        review: r.review,
                        recommendationid: r.recommendationid,
                        author: r.author
                    }));
                
                console.log(`Received ${data.reviews.length} reviews from API, ${reviewTexts.length} unique and valid after filtering`);
                
                if (reviewTexts.length === 0) {
                    console.log('No new unique reviews in this page (all duplicates)');
                    consecutiveDuplicatePages++;
                    
                    if (consecutiveDuplicatePages >= MAX_DUPLICATE_PAGES) {
                        console.log(`Stopping: ${MAX_DUPLICATE_PAGES} consecutive pages with all duplicates`);
                        break;
                    }
                    
                    // Check if cursor is valid before continuing
                    if (!data.cursor || data.cursor === cursor) {
                        console.log('No more pages available (cursor empty or unchanged)');
                        break;
                    }
                    
                    previousCursor = cursor;
                    cursor = data.cursor;
                    currentPage++;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                
                // Reset duplicate page counter when we get unique reviews
                consecutiveDuplicatePages = 0;
                
                const remainingNeeded = targetCount - allReviews.length;
                const reviewsToAdd = reviewTexts.slice(0, remainingNeeded);
                allReviews.push(...reviewsToAdd);

                const currentCount = allReviews.length;
                const progress = Math.min(Math.round((currentCount / targetCount) * 100), 100);
                
                console.log(`Added ${reviewsToAdd.length} unique reviews, total now: ${currentCount}/${targetCount}`);
                
                if (onProgress) {
                    onProgress(currentCount, progress);
                }

                if (allReviews.length >= targetCount) {
                    console.log(`Target reached: ${allReviews.length} reviews`);
                    break;
                }

                if (!data.cursor || data.cursor === cursor) {
                    console.log('No more pages available (cursor empty or unchanged)');
                    break;
                }

                previousCursor = cursor;
                cursor = data.cursor;
                currentPage++;

                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (pageError) {
                console.error(`Error on page ${currentPage}:`, pageError);
                consecutiveErrors++;
                
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    throw new Error(`Failed after ${MAX_CONSECUTIVE_ERRORS} consecutive errors. Last error: ${pageError.message}`);
                }
                
                console.log(`Retrying after error (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        const finalReviews = allReviews.slice(0, targetCount);
        console.log(`Scraping complete: ${finalReviews.length} reviews (target: ${targetCount})`);
        
        if (finalReviews.length < 100) {
            throw new Error(`Only ${finalReviews.length} reviews scraped. Minimum 100 required.`);
        }
        
        if (finalReviews.length < targetCount) {
            console.warn(`Warning: Only ${finalReviews.length} reviews scraped, target was ${targetCount}`);
        }
        
        return finalReviews;

    } catch (error) {
        console.error('Error scraping reviews:', error);
        throw error;
    }
}

export async function saveScrapedReviews(appid, gameName, reviews) {
    try {
        const response = await fetch(`${API_BASE_URL}/steam/save-scraped-reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                appid,
                game_name: gameName,
                reviews
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving scraped reviews:', error);
        throw error;
    }
}

export async function getScrapingHistory(appid) {
    try {
        const response = await fetch(`${API_BASE_URL}/steam/scraping-history/${appid}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching scraping history:', error);
        throw error;
    }
}
