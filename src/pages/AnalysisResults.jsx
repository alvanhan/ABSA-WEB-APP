import React, { useState, useEffect } from "react";
import { Play, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

const API_BASE_URL = 'http://localhost:8000';

const AnalysisResults = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchScrapedGames();
    }, []);

    const fetchScrapedGames = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/analysis/scraped-games`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            
            const gamesWithDetails = await Promise.all(
                data.games.map(async (game) => {
                    try {
                        const detailsResponse = await fetch(`${API_BASE_URL}/steam/appdetails/${game.appid}`);
                        const detailsData = await detailsResponse.json();
                        
                        if (detailsData[game.appid]?.success) {
                            const gameData = detailsData[game.appid].data;
                            return {
                                ...game,
                                name: gameData.name,
                                header_image: gameData.header_image
                            };
                        }
                        return { ...game, name: `Game ${game.appid}`, header_image: '' };
                    } catch {
                        return { ...game, name: `Game ${game.appid}`, header_image: '' };
                    }
                })
            );
            
            setGames(gamesWithDetails);
        } catch (err) {
            setError('Failed to load scraped games');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = (appid) => {
        navigate(`/analysis/${appid}`);
    };

    const handleViewResults = (appid) => {
        navigate(`/analysis/${appid}`);
    };

    if (loading) {
        return (
            <div className="main-content fade-in">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <Loader2 size={48} style={{
                        color: theme.primary,
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: theme.textSecondary, fontSize: '15px' }}>Loading scraped games...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="main-content fade-in">
                <div className="card" style={{
                    background: `${theme.error}1a`,
                    border: `1px solid ${theme.error}4d`,
                    padding: '30px',
                    textAlign: 'center'
                }}>
                    <p style={{ color: theme.error, fontSize: '14px', marginBottom: '12px' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content fade-in">
            <div className="page-header">
                <h2>Analysis Results</h2>
                <p>Manage and analyze your scraped game reviews</p>
            </div>

            {games.length === 0 ? (
                <div className="card" style={{
                    padding: '60px 40px',
                    textAlign: 'center',
                    background: theme.cardBgGradient,
                    border: `1px solid ${theme.border}`
                }}>
                    <TrendingUp size={64} style={{ color: theme.primary, opacity: 0.3, margin: '0 auto 20px' }} />
                    <p style={{ color: theme.textSecondary, fontSize: '16px', marginBottom: '20px' }}>
                        No scraped games yet. Start by scraping game reviews from the Game List.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/')}
                        style={{ fontSize: '15px', padding: '12px 24px' }}
                    >
                        Go to Game List
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '20px'
                }}>
                    {games.map((game) => (
                        <div key={game.appid} className="card" style={{
                            padding: 0,
                            overflow: 'hidden',
                            transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                            {game.header_image && (
                                <img
                                    src={game.header_image}
                                    alt={game.name}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                            )}
                            <div style={{ padding: '24px' }}>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: theme.text,
                                    marginBottom: '16px',
                                    lineHeight: '1.3'
                                }}>
                                    {game.name}
                                </h3>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    marginBottom: '12px'
                                }}>
                                    <span style={{ fontSize: '14px', color: theme.textSecondary }}>Reviews Scraped</span>
                                    <span style={{ fontSize: '16px', color: theme.text, fontWeight: '700' }}>
                                        {game.total_reviews.toLocaleString()}
                                    </span>
                                </div>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    marginBottom: '20px'
                                }}>
                                    <span style={{ fontSize: '14px', color: theme.textSecondary }}>Scraped Date</span>
                                    <span style={{ fontSize: '14px', color: theme.text }}>
                                        {game.scraped_date}
                                    </span>
                                </div>

                                {game.analyzed && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px',
                                        background: `${theme.success}33`,
                                        borderRadius: '6px',
                                        border: `1px solid ${theme.success}66`,
                                        marginBottom: '16px'
                                    }}>
                                        <CheckCircle size={20} style={{ color: theme.success }} />
                                        <div>
                                            <p style={{ fontSize: '13px', color: theme.success, fontWeight: '600', marginBottom: '2px' }}>
                                                Analyzed
                                            </p>
                                            <p style={{ fontSize: '12px', color: theme.textSecondary }}>
                                                {game.analysis_date}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!game.analyzed ? (
                                    <button
                                        onClick={() => handleAnalyze(game.appid)}
                                        className="btn btn-primary"
                                        style={{
                                            width: '100%',
                                            fontSize: '15px',
                                            padding: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <Play size={18} />
                                        Analyze Reviews
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleViewResults(game.appid)}
                                        className="btn"
                                        style={{
                                            width: '100%',
                                            fontSize: '15px',
                                            padding: '12px',
                                            background: `${theme.primary}1a`,
                                            border: `1px solid ${theme.primary}66`,
                                            color: theme.primary,
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        View Results
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnalysisResults;
