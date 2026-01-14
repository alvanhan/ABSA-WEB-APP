import React, { useState, useEffect } from 'react';
import { Search, Eye, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchSteamStore } from '../utils/steamApi';

const GameList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDefaultGames();
    }, []);

    const fetchDefaultGames = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await searchSteamStore('');
            setGames(data.items || []);
        } catch (err) {
            setError('Failed to load games from Steam');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        const trimmedSearch = searchTerm.trim();
        
        if (!trimmedSearch) {
            fetchDefaultGames();
            return;
        }
        
        if (/^\d+$/.test(trimmedSearch)) {
            navigate(`/game/${trimmedSearch}`);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            const data = await searchSteamStore(trimmedSearch);
            setGames(data.items || []);
        } catch (err) {
            setError('Failed to search games');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeGame = (appid) => {
        navigate(`/game/${appid}`);
    };

    const formatPrice = (price) => {
        if (!price) return 'Free to Play';
        const rupiah = price.final / 100;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(rupiah);
    };

    return (
        <div className="main-content fade-in">
            <div className="card" style={{ marginBottom: '30px', background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)', border: 'none' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#66c0f4'
                        }} />
                        <input
                            type="text"
                            placeholder="Search by game name or App ID (e.g., 'Counter-Strike' or '730')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            style={{
                                width: '100%',
                                padding: '14px 20px 14px 50px',
                                border: '2px solid rgba(102, 192, 244, 0.3)',
                                borderRadius: '8px',
                                fontSize: '15px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#66c0f4';
                                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(102, 192, 244, 0.3)';
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleSearch}
                        style={{
                            padding: '14px 28px',
                            fontSize: '15px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Search size={18} />
                        Search
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={22} style={{ color: '#66c0f4' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', margin: 0 }}>
                    {searchTerm ? 'Search Results' : 'Popular Games'}
                </h3>
                <span style={{
                    background: 'rgba(102, 192, 244, 0.2)',
                    color: '#66c0f4',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600'
                }}>
                    {games.length} games
                </span>
            </div>

            {loading && (
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
                    <p style={{ color: '#8f98a0', fontSize: '15px' }}>Loading games from Steam...</p>
                </div>
            )}

            {error && (
                <div style={{
                    padding: '20px',
                    background: 'rgba(220, 53, 69, 0.1)',
                    border: '1px solid rgba(220, 53, 69, 0.3)',
                    borderRadius: '8px',
                    color: '#dc3545',
                    marginBottom: '20px'
                }}>
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '20px' 
                }}>
                    {games.map((game, index) => (
                        <div
                            key={`${game.id}-${index}`}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                padding: 0,
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, #16202d 0%, #1b2838 100%)',
                                border: '1px solid rgba(102, 192, 244, 0.2)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = '#66c0f4';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(26, 159, 255, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(102, 192, 244, 0.2)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                            }}
                        >
                            <div style={{
                                width: '100%',
                                height: '140px',
                                overflow: 'hidden',
                                position: 'relative',
                                background: '#1b2838'
                            }}>
                                <img
                                    src={game.tiny_image}
                                    alt={game.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '50%',
                                    background: 'linear-gradient(to top, rgba(22, 32, 45, 0.9) 0%, transparent 100%)'
                                }}></div>
                            </div>

                            <div style={{ padding: '16px' }}>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    marginBottom: '8px',
                                    color: 'white',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    minHeight: '44px',
                                    lineHeight: '1.4'
                                }}>
                                    {game.name}
                                </h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        color: '#66c0f4',
                                        fontWeight: '500',
                                        margin: 0
                                    }}>
                                        App ID: {game.id}
                                    </p>
                                    {game.metascore && (
                                        <span style={{
                                            background: 'rgba(92, 126, 16, 0.3)',
                                            color: '#b8d432',
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: '700'
                                        }}>
                                            {game.metascore}
                                        </span>
                                    )}
                                </div>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#5c7e10',
                                    marginBottom: '14px',
                                    fontWeight: '600'
                                }}>
                                    {formatPrice(game.price)}
                                </p>
                                <button
                                    className="btn"
                                    onClick={() => handleAnalyzeGame(game.id)}
                                    style={{
                                        fontSize: '13px',
                                        padding: '10px 18px',
                                        background: 'linear-gradient(90deg, #1a9fff 0%, #66c0f4 100%)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: '600',
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Eye size={16} />
                                    Detail
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && games.length === 0 && (
                <div style={{
                    marginTop: '40px',
                    padding: '60px 40px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(27, 40, 56, 0.3) 0%, rgba(42, 71, 94, 0.3) 100%)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(102, 192, 244, 0.3)'
                }}>
                    <Search size={72} style={{
                        opacity: 0.4,
                        marginBottom: '20px',
                        color: '#66c0f4',
                        margin: '0 auto 20px'
                    }} />
                    <h3 style={{
                        marginBottom: '12px',
                        color: '#8f98a0',
                        fontSize: '20px',
                        fontWeight: '600'
                    }}>
                        No games found
                    </h3>
                    <p style={{
                        color: '#8f98a0',
                        fontSize: '14px',
                        maxWidth: '500px',
                        margin: '0 auto'
                    }}>
                        Try a different search term or use the App ID input above
                    </p>
                </div>
            )}
        </div>
    );
};

export default GameList;

