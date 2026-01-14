import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getSteamAppDetails, getSteamAppReviews } from '../utils/steamApi';
import { scrapeReviews, saveScrapedReviews, getScrapingHistory } from '../utils/scrapeReviews';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GameDetail = () => {
    const { appid } = useParams();
    const navigate = useNavigate();
    const [gameDetails, setGameDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [numReviews, setNumReviews] = useState(1000);
    const [reviewStats, setReviewStats] = useState(null);
    const [loadingReviewStats, setLoadingReviewStats] = useState(true);
    const [reviewStatsError, setReviewStatsError] = useState(null);
    const [scrapingHistory, setScrapingHistory] = useState(null);
    const [scrapingComplete, setScrapingComplete] = useState(false);

    const checkScrapingHistory = useCallback(async () => {
        try {
            const history = await getScrapingHistory(appid);
            setScrapingHistory(history);
        } catch (error) {
            console.error('Error checking scraping history:', error);
        }
    }, [appid]);

    useEffect(() => {
        const fetchGameDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getSteamAppDetails(appid);

                if (data[appid] && data[appid].success) {
                    setGameDetails(data[appid].data);
                } else {
                    setError('Game not found');
                }
            } catch (err) {
                setError('Failed to load game details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const fetchReviewStats = async (retries = 3) => {
            setLoadingReviewStats(true);
            setReviewStatsError(null);

            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    console.log(`Fetching review stats (attempt ${attempt}/${retries})...`);
                    const data = await getSteamAppReviews(appid, '*', 0);

                    if (data.success === 1 && data.query_summary) {
                        console.log('Review stats loaded successfully:', data.query_summary);
                        setReviewStats(data.query_summary);
                        setNumReviews(Math.min(data.query_summary.total_reviews, 5000));
                        setLoadingReviewStats(false);
                        return;
                    } else {
                        throw new Error('Invalid response format');
                    }
                } catch (err) {
                    console.error(`Attempt ${attempt} failed:`, err.message);

                    if (attempt === retries) {
                        setReviewStatsError('Unable to load review statistics. Please try refreshing the page.');
                        setLoadingReviewStats(false);
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            }
        };

        fetchGameDetails();
        fetchReviewStats();
        checkScrapingHistory();
    }, [appid, checkScrapingHistory]);

    const handleStartAnalysis = async () => {
        if (numReviews < 100) {
            toast.error('Minimum 100 reviews required', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                style: {
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    color: 'white',
                    border: '1px solid rgba(220, 53, 69, 0.5)'
                }
            });
            return;
        }

        if (reviewStats && numReviews > reviewStats.total_reviews) {
            toast.warning(`Maximum ${reviewStats.total_reviews.toLocaleString()} reviews available for this game`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                style: {
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    color: 'white',
                    border: '1px solid rgba(255, 193, 7, 0.5)'
                }
            });
            return;
        }

        setAnalyzing(true);
        setProgress(0);
        setReviews([]);
        setScrapingComplete(false);

        try {
            const scrapedReviews = await scrapeReviews(appid, numReviews, (count, progressPercent) => {
                setReviews(new Array(count).fill(''));
                setProgress(progressPercent);
            });

            setReviews(scrapedReviews);
            setProgress(100);

            const saveResult = await saveScrapedReviews(appid, gameDetails?.name || 'Unknown Game', scrapedReviews);
            console.log('Reviews saved:', saveResult);

            toast.success(`Successfully scraped ${scrapedReviews.length} reviews!`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                style: {
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    color: 'white',
                    border: '1px solid rgba(92, 126, 16, 0.6)'
                }
            });

            setScrapingComplete(true);
            setAnalyzing(false);

            await checkScrapingHistory();

        } catch (error) {
            setAnalyzing(false);
            toast.error(`Error scraping reviews: ${error.message}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                style: {
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    color: 'white',
                    border: '1px solid rgba(220, 53, 69, 0.5)'
                }
            });
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="main-content fade-in">
                <div style={{
                    padding: '60px 40px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(27, 40, 56, 0.3) 0%, rgba(42, 71, 94, 0.3) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(102, 192, 244, 0.3)'
                }}>
                    <Loader2 size={48} style={{
                        color: '#66c0f4',
                        margin: '0 auto 20px',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: '#8f98a0', fontSize: '15px' }}>Loading game details...</p>
                </div>
            </div>
        );
    }

    if (error || !gameDetails) {
        return (
            <div className="main-content fade-in">
                <button
                    onClick={() => navigate('/')}
                    className="btn"
                    style={{
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Games
                </button>
                <div style={{
                    padding: '40px',
                    background: 'rgba(220, 53, 69, 0.1)',
                    border: '1px solid rgba(220, 53, 69, 0.3)',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#dc3545', fontSize: '18px', fontWeight: '600' }}>{error || 'Game not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content fade-in">
            <button
                onClick={() => navigate('/')}
                className="btn"
                style={{
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <ArrowLeft size={18} />
                Back to Games
            </button>

            <div style={{
                background: `linear-gradient(rgba(27, 40, 56, 0.95), rgba(27, 40, 56, 0.95)), url(${gameDetails.header_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '30px',
                border: '1px solid rgba(102, 192, 244, 0.3)'
            }}>
                <div style={{ padding: '40px' }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '16px'
                    }}>
                        {gameDetails.name}
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: '#8f98a0',
                        marginBottom: '20px',
                        lineHeight: '1.6'
                    }}>
                        {gameDetails.short_description}
                    </p>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div>
                            <p style={{ fontSize: '13px', color: '#66c0f4', marginBottom: '4px' }}>App ID</p>
                            <p style={{ fontSize: '18px', color: 'white', fontWeight: '600' }}>{gameDetails.steam_appid}</p>
                        </div>
                        {gameDetails.metacritic && (
                            <div>
                                <p style={{ fontSize: '13px', color: '#66c0f4', marginBottom: '4px' }}>Metascore</p>
                                <p style={{ fontSize: '18px', color: '#b8d432', fontWeight: '700' }}>{gameDetails.metacritic.score}</p>
                            </div>
                        )}
                        <div>
                            <p style={{ fontSize: '13px', color: '#66c0f4', marginBottom: '4px' }}>Release Date</p>
                            <p style={{ fontSize: '18px', color: 'white', fontWeight: '600' }}>{gameDetails.release_date.date}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: '#66c0f4', marginBottom: '4px' }}>Type</p>
                            <p style={{ fontSize: '18px', color: 'white', fontWeight: '600', textTransform: 'capitalize' }}>{gameDetails.type}</p>
                        </div>
                    </div>
                </div>
            </div>

            {gameDetails.screenshots && gameDetails.screenshots.length > 0 && (
                <div className="card">
                    <h3 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '20px'
                    }}>
                        Screenshots
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {gameDetails.screenshots.slice(0, 6).map((screenshot, index) => (
                            <img
                                key={index}
                                src={screenshot.path_thumbnail}
                                alt={`Screenshot ${index + 1}`}
                                style={{
                                    width: '100%',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s ease',
                                    border: '1px solid rgba(102, 192, 244, 0.2)'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            />
                        ))}
                    </div>
                </div>
            )}

            {loadingReviewStats ? (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    border: '1px solid rgba(102, 192, 244, 0.3)',
                    marginTop: '30px',
                    marginBottom: '30px',
                    textAlign: 'center',
                    padding: '40px'
                }}>
                    <Loader2 size={32} style={{
                        color: '#66c0f4',
                        margin: '0 auto 12px',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: '#66c0f4', fontSize: '14px' }}>Loading review statistics...</p>
                </div>
            ) : reviewStatsError ? (
                <div className="card" style={{
                    background: 'rgba(220, 53, 69, 0.1)',
                    border: '1px solid rgba(220, 53, 69, 0.3)',
                    marginTop: '30px',
                    marginBottom: '30px',
                    padding: '30px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '12px' }}>{reviewStatsError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn"
                        style={{ fontSize: '13px', padding: '8px 16px' }}
                    >
                        Refresh Page
                    </button>
                </div>
            ) : reviewStats ? (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    border: '1px solid rgba(102, 192, 244, 0.3)',
                    marginTop: '30px',
                    marginBottom: '30px'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '20px'
                    }}>
                        Steam Review Statistics
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div style={{
                            background: 'rgba(42, 71, 94, 0.6)',
                            borderRadius: '8px',
                            padding: '20px',
                            border: '1px solid rgba(102, 192, 244, 0.2)'
                        }}>
                            <p style={{ fontSize: '13px', color: '#66c0f4', marginBottom: '8px' }}>Total Reviews</p>
                            <p style={{ fontSize: '28px', color: 'white', fontWeight: '700' }}>
                                {reviewStats.total_reviews.toLocaleString()}
                            </p>
                        </div>
                        <div style={{
                            background: 'rgba(42, 71, 94, 0.6)',
                            borderRadius: '8px',
                            padding: '20px',
                            border: '1px solid rgba(102, 192, 244, 0.2)'
                        }}>
                            <p style={{ fontSize: '13px', color: '#66c0f4', marginBottom: '8px' }}>Review Score</p>
                            <p style={{ fontSize: '28px', color: 'white', fontWeight: '700' }}>
                                {reviewStats.review_score}/10
                            </p>
                            <p style={{ fontSize: '12px', color: '#8f98a0', marginTop: '4px' }}>
                                {reviewStats.review_score_desc}
                            </p>
                        </div>
                        <div style={{
                            background: 'rgba(92, 126, 16, 0.3)',
                            borderRadius: '8px',
                            padding: '20px',
                            border: '1px solid rgba(92, 126, 16, 0.4)'
                        }}>
                            <p style={{ fontSize: '13px', color: '#b8d432', marginBottom: '8px' }}>Positive Reviews</p>
                            <p style={{ fontSize: '28px', color: 'white', fontWeight: '700' }}>
                                {reviewStats.total_positive.toLocaleString()}
                            </p>
                            <p style={{ fontSize: '12px', color: '#8f98a0', marginTop: '4px' }}>
                                {((reviewStats.total_positive / reviewStats.total_reviews) * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div style={{
                            background: 'rgba(220, 53, 69, 0.2)',
                            borderRadius: '8px',
                            padding: '20px',
                            border: '1px solid rgba(220, 53, 69, 0.3)'
                        }}>
                            <p style={{ fontSize: '13px', color: '#ff6b6b', marginBottom: '8px' }}>Negative Reviews</p>
                            <p style={{ fontSize: '28px', color: 'white', fontWeight: '700' }}>
                                {reviewStats.total_negative.toLocaleString()}
                            </p>
                            <p style={{ fontSize: '12px', color: '#8f98a0', marginTop: '4px' }}>
                                {((reviewStats.total_negative / reviewStats.total_reviews) * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            {gameDetails && gameDetails.type === 'game' ? (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    border: '1px solid rgba(102, 192, 244, 0.3)',
                    marginBottom: '30px'
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '16px'
                    }}>
                        Start Review Scraping
                    </h2>
                    <p style={{
                        fontSize: '15px',
                        color: '#8f98a0',
                        marginBottom: '20px',
                        lineHeight: '1.6'
                    }}>
                        Fetch reviews from Steam and saving them for sentiment analysis.
                    </p>

                    {scrapingHistory && scrapingHistory.exists && (
                        <div style={{
                            background: 'rgba(92, 126, 16, 0.3)',
                            border: '1px solid rgba(92, 126, 16, 0.4)',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <AlertCircle size={20} style={{ color: '#b8d432', flexShrink: 0 }} />
                            <div>
                                <p style={{ fontSize: '14px', color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                                    This game has been scraped before
                                </p>
                                <p style={{ fontSize: '13px', color: '#8f98a0' }}>
                                    {scrapingHistory.total_scraped.toLocaleString()} reviews • {scrapingHistory.last_scraped}
                                </p>
                            </div>
                        </div>
                    )}

                    {!analyzing && !scrapingComplete && (
                        <div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#66c0f4', marginBottom: '8px', fontWeight: '600' }}>
                                    Number of Reviews to Scrape
                                </label>
                                <input
                                    type="number"
                                    value={numReviews}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 100;
                                        const maxAllowed = reviewStats ? reviewStats.total_reviews : 5000;
                                        setNumReviews(Math.min(value, maxAllowed));
                                    }}
                                    min="100"
                                    max={reviewStats ? reviewStats.total_reviews : 5000}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid rgba(102, 192, 244, 0.3)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'white'
                                    }}
                                />
                                <p style={{ fontSize: '12px', color: '#8f98a0', marginTop: '8px' }}>
                                    Minimum: 100 reviews • Maximum: {reviewStats ? reviewStats.total_reviews.toLocaleString() : '5,000'} reviews
                                </p>
                            </div>
                            <button
                                onClick={handleStartAnalysis}
                                className="btn btn-primary"
                                style={{
                                    fontSize: '16px',
                                    padding: '14px 32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontWeight: '600'
                                }}
                            >
                                <Play size={20} />
                                Start Scraping Reviews
                            </button>
                        </div>
                    )}

                    {analyzing && (
                        <div>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                height: '40px',
                                overflow: 'hidden',
                                marginBottom: '16px',
                                border: '1px solid rgba(102, 192, 244, 0.3)'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #1a9fff 0%, #66c0f4 100%)',
                                    transition: 'width 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>
                                        {progress}%
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Loader2 size={20} style={{
                                        color: '#66c0f4',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    <span style={{ color: '#66c0f4', fontSize: '15px', fontWeight: '600' }}>
                                        Scraping reviews...
                                    </span>
                                </div>
                                <span style={{ color: '#8f98a0', fontSize: '14px' }}>
                                    {Array.isArray(reviews) ? reviews.length : 0} / {numReviews} reviews
                                </span>
                            </div>
                        </div>
                    )}

                    {!analyzing && scrapingComplete && (
                        <div style={{
                            padding: '24px',
                            background: 'rgba(92, 126, 16, 0.2)',
                            border: '1px solid rgba(92, 126, 16, 0.4)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <CheckCircle size={32} style={{ color: '#b8d432', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <p style={{ color: '#b8d432', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                                    ✓ Data berhasil di-scrape
                                </p>
                                <p style={{ color: '#8f98a0', fontSize: '14px' }}>
                                    {Array.isArray(reviews) ? reviews.length : 0} reviews saved to backend storage
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setReviews([]);
                                    setProgress(0);
                                    setScrapingComplete(false);
                                }}
                                className="btn"
                                style={{
                                    fontSize: '14px',
                                    padding: '10px 20px',
                                    background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 100%)',
                                    color: 'white',
                                    border: 'none',
                                    fontWeight: '600'
                                }}
                            >
                                Scrape Again
                            </button>
                        </div>
                    )}
                </div>
            ) : gameDetails && gameDetails.type !== 'game' ? (
                <div className="card" style={{
                    background: 'rgba(220, 53, 69, 0.1)',
                    border: '1px solid rgba(220, 53, 69, 0.3)',
                    marginBottom: '30px',
                    padding: '30px',
                    textAlign: 'center'
                }}>
                    <AlertCircle size={48} style={{ color: '#ff6b6b', margin: '0 auto 16px' }} />
                    <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                        Sentiment Analysis Not Available
                    </h3>
                    <p style={{ color: '#8f98a0', fontSize: '15px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
                        Analisis sentiment hanya tersedia untuk kategori <strong style={{ color: '#66c0f4' }}>game</strong>.
                        Aplikasi ini adalah <strong style={{ color: '#ff6b6b' }}>{gameDetails.type}</strong>,
                        yang tidak sesuai dengan model ATEPC yang telah dilatih khusus untuk review game.
                    </p>
                </div>
            ) : null}

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </div>
    );
};

export default GameDetail;
