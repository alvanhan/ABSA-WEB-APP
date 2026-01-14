import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Play, CheckCircle, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8000';

const GameAnalysis = () => {
    const { appid } = useParams();
    const navigate = useNavigate();
    const [gameDetails, setGameDetails] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [statusData, setStatusData] = useState(null);

    const fetchGameDetails = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/steam/appdetails/${appid}`);
            const data = await response.json();
            if (data[appid]?.success) {
                setGameDetails(data[appid].data);
            }
        } catch (err) {
            console.error('Error fetching game details:', err);
        }
    }, [appid]);

    const checkAnalysisStatus = useCallback(async () => {
        setLoading(true);
        try {
            const statusResponse = await fetch(`${API_BASE_URL}/analysis/status/${appid}`);
            if (statusResponse.ok) {
                const status = await statusResponse.json();
                setStatusData(status);

                if (status.status === 'processing') {
                    setAnalyzing(true);
                } else if (status.status === 'completed') {
                    const resultResponse = await fetch(`${API_BASE_URL}/analysis/results/${appid}`);
                    if (resultResponse.ok) {
                        const data = await resultResponse.json();
                        setAnalysisData(data);
                    }
                }
            }
        } catch (err) {
            console.log('No analysis status yet');
        } finally {
            setLoading(false);
        }
    }, [appid]);

    const pollAnalysisStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/analysis/status/${appid}`);
            if (response.ok) {
                const status = await response.json();
                setStatusData(status);

                if (status.status === 'completed') {
                    setAnalyzing(false);
                    const resultResponse = await fetch(`${API_BASE_URL}/analysis/results/${appid}`);
                    if (resultResponse.ok) {
                        const data = await resultResponse.json();
                        setAnalysisData(data);

                        toast.success(`Successfully analyzed ${data.processed_reviews} reviews!`, {
                            position: "top-right",
                            autoClose: 3000,
                            style: {
                                background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                                color: 'white',
                                border: '1px solid rgba(92, 126, 16, 0.6)'
                            }
                        });
                    }
                } else if (status.status === 'error') {
                    setAnalyzing(false);
                    toast.error(`Analysis failed: ${status.error}`, {
                        position: "top-right",
                        autoClose: 5000,
                        style: {
                            background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                            color: 'white',
                            border: '1px solid rgba(220, 53, 69, 0.5)'
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Error polling status:', err);
        }
    }, [appid]);

    useEffect(() => {
        fetchGameDetails();
        checkAnalysisStatus();
    }, [appid, fetchGameDetails, checkAnalysisStatus]);

    useEffect(() => {
        let interval;
        if (analyzing || (statusData?.status === 'processing')) {
            interval = setInterval(() => {
                pollAnalysisStatus();
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [analyzing, statusData, pollAnalysisStatus]);

    const handleStartAnalysis = async () => {
        setAnalyzing(true);
        setStatusData({ status: 'starting', progress: 0 });

        try {
            toast.info('Starting analysis... This may take a few minutes.', {
                position: "top-right",
                autoClose: 3000,
                style: {
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    color: 'white',
                    border: '1px solid rgba(102, 192, 244, 0.5)'
                }
            });

            const response = await fetch(`${API_BASE_URL}/analysis/analyze-game/${appid}`, {
                method: 'POST'
            });

            if (!response.ok) {
                if (response.status === 409) {
                    setAnalyzing(false);
                    toast.warning('Another analysis is currently in progress. Please wait until it completes.', {
                        position: "top-right",
                        autoClose: 5000,
                        style: {
                            background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                            color: 'white',
                            border: '1px solid rgba(255, 152, 0, 0.6)'
                        }
                    });
                    return;
                }

                const errorData = await response.json().catch(() => ({ detail: 'Analysis failed' }));
                setAnalyzing(false);
                toast.error(errorData.detail || 'Analysis failed', {
                    position: "top-right",
                    autoClose: 5000,
                    style: {
                        background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                        color: 'white',
                        border: '1px solid rgba(220, 53, 69, 0.5)'
                    }
                });
                return;
            }

        } catch (error) {
            setAnalyzing(false);
            toast.error('Failed to connect to API. Please check your connection.', {
                position: "top-right",
                autoClose: 5000,
                style: {
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    color: 'white',
                    border: '1px solid rgba(220, 53, 69, 0.5)'
                }
            });
            console.error(error);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds <= 0) return 'Calculating...';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}m ${secs}s remaining`;
        }
        return `${secs}s remaining`;
    };

    const getSentimentColor = (sentiment) => {
        const sent = sentiment?.toLowerCase();
        switch (sent) {
            case 'positive': return '#66c0f4';
            case 'negative': return '#c95252ff';
            case 'neutral': return '#e2eef8ff';
            default: return '#66c0f4';
        }
    };

    const getSentimentTextColor = (sentiment) => {
        const sent = sentiment?.toLowerCase();
        switch (sent) {
            case 'positive': return 'white';
            case 'negative': return 'white';
            case 'neutral': return '#2a475e'; // Dark gray untuk neutral background
            default: return 'white';
        }
    };

    const getSentimentBgColor = (sentiment) => {
        const sent = sentiment?.toLowerCase();
        switch (sent) {
            case 'positive': return 'rgba(102, 192, 244, 0.15)';
            case 'negative': return 'rgba(198, 40, 40, 0.15)';
            case 'neutral': return 'rgba(199, 213, 224, 0.15)';
            default: return 'rgba(102, 192, 244, 0.2)';
        }
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
                        color: '#66c0f4',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: '#8f98a0', fontSize: '15px' }}>Loading analysis data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content fade-in">
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '30px'
            }}>
                <button
                    onClick={() => navigate('/analysis')}
                    className="btn"
                    style={{
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
                        {gameDetails?.name || `Game ${appid}`}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#8f98a0' }}>
                        Sentiment Analysis Results
                    </p>
                </div>
            </div>

            {gameDetails && (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    border: '1px solid rgba(102, 192, 244, 0.3)',
                    marginBottom: '30px',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {gameDetails.header_image && (
                            <img
                                src={gameDetails.header_image}
                                alt={gameDetails.name}
                                style={{
                                    width: '300px',
                                    height: '140px',
                                    objectFit: 'cover',
                                    borderRadius: '8px'
                                }}
                            />
                        )}
                        <div style={{ flex: 1, padding: '10px 0' }}>
                            <p style={{ fontSize: '14px', color: '#8f98a0', marginBottom: '8px' }}>
                                {gameDetails.short_description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {analysisData && (
                <div className="card" style={{
                    background: 'rgba(92, 126, 16, 0.15)',
                    border: '1px solid #b8d432',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '30px'
                }}>
                    <CheckCircle size={24} style={{ color: '#b8d432' }} />
                    <div>
                        <p style={{ fontSize: '14px', color: '#b8d432', fontWeight: '600', marginBottom: '4px' }}>
                            Analysis Completed
                        </p>
                        <p style={{ fontSize: '13px', color: '#8f98a0' }}>
                            {analysisData.processed_reviews} reviews analyzed • {analysisData.analyzed_date}
                        </p>
                    </div>
                </div>
            )}

            {analyzing || (statusData?.status === 'processing') ? (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    border: '1px solid rgba(102, 192, 244, 0.3)',
                    padding: '40px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <Loader2 size={48} style={{
                            color: '#66c0f4',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }} />
                        <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                            Analyzing Reviews...
                        </h3>
                        <p style={{ color: '#8f98a0', fontSize: '14px' }}>
                            {statusData?.estimated_seconds ? formatTime(statusData.estimated_seconds) : 'Calculating time...'}
                        </p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#8f98a0' }}>
                                Progress: {statusData?.progress || 0} / {statusData?.total || 0} reviews
                            </span>
                            <span style={{ fontSize: '14px', color: '#66c0f4', fontWeight: '600' }}>
                                {statusData?.progress_percent || 0}%
                            </span>
                        </div>
                        <div style={{
                            height: '12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${statusData?.progress_percent || 0}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #66c0f4 0%, #5c7e10 100%)',
                                transition: 'width 0.5s ease',
                                borderRadius: '6px'
                            }} />
                        </div>
                    </div>

                    {statusData?.sample_review && (
                        <div style={{ marginTop: '30px' }}>
                            <p style={{ fontSize: '14px', color: '#8f98a0', marginBottom: '16px', fontWeight: '600' }}>
                                Review Preview:
                            </p>
                            <div style={{
                                padding: '20px',
                                background: 'rgba(220, 53, 69, 0.1)',
                                borderRadius: '8px',
                                border: '2px solid rgba(220, 53, 69, 0.4)'
                            }}>
                                <div style={{
                                    fontSize: '13px',
                                    color: 'white',
                                    lineHeight: '1.6',
                                    marginBottom: '12px',
                                    fontStyle: 'italic'
                                }}>
                                    "{statusData.sample_review.text.length > 250 ? statusData.sample_review.text.substring(0, 250) + '...' : statusData.sample_review.text}"
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {statusData.sample_review.aspects?.slice(0, 5).map((asp, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: getSentimentColor(asp.sentiment),
                                                color: getSentimentTextColor(asp.sentiment)
                                            }}
                                        >
                                            {asp.aspect}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : !analysisData ? (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    border: '1px solid rgba(102, 192, 244, 0.3)',
                    padding: '40px',
                    textAlign: 'center'
                }}>
                    <TrendingUp size={64} style={{ color: '#66c0f4', opacity: 0.3, margin: '0 auto 20px' }} />
                    <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                        No Analysis Results Yet
                    </h3>
                    <p style={{ color: '#8f98a0', fontSize: '15px', marginBottom: '24px' }}>
                        Click the button below to start analyzing the scraped reviews
                    </p>
                    <button
                        onClick={handleStartAnalysis}
                        disabled={analyzing}
                        className="btn btn-primary"
                        style={{
                            fontSize: '16px',
                            padding: '14px 32px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        {analyzing ? (
                            <>
                                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Play size={20} />
                                Start Analysis
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                            border: '1px solid rgba(102, 192, 244, 0.3)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '36px',
                                    fontWeight: '700',
                                    color: getSentimentColor('positive'),
                                    marginBottom: '8px'
                                }}>
                                    {analysisData.overall_sentiment.positive.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '14px', color: '#8f98a0' }}>
                                    Positive Aspects
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                            border: '1px solid rgba(102, 192, 244, 0.3)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '36px',
                                    fontWeight: '700',
                                    color: getSentimentColor('negative'),
                                    marginBottom: '8px'
                                }}>
                                    {analysisData.overall_sentiment.negative.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '14px', color: '#8f98a0' }}>
                                    Negative Aspects
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                            border: '1px solid rgba(102, 192, 244, 0.3)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontSize: '36px',
                                    fontWeight: '700',
                                    color: getSentimentColor('neutral'),
                                    marginBottom: '8px'
                                }}>
                                    {analysisData.overall_sentiment.neutral.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '14px', color: '#8f98a0' }}>
                                    Neutral Aspects
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                            border: '1px solid rgba(102, 192, 244, 0.3)',
                            padding: '30px',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '24px' }}>
                                Overall Distribution
                            </h3>
                            {(() => {
                                const totalMentions = analysisData.overall_sentiment.positive +
                                    analysisData.overall_sentiment.negative +
                                    analysisData.overall_sentiment.neutral;
                                const uniqueAspects = Object.keys(analysisData.aspects).length;
                                const posPercent = (analysisData.overall_sentiment.positive / totalMentions) * 100;
                                const negPercent = (analysisData.overall_sentiment.negative / totalMentions) * 100;
                                const neuPercent = (analysisData.overall_sentiment.neutral / totalMentions) * 100;

                                return (
                                    <>
                                        <div style={{
                                            width: '200px',
                                            height: '200px',
                                            margin: '0 auto 20px',
                                            borderRadius: '50%',
                                            background: `conic-gradient(
                                                ${getSentimentColor('positive')} 0% ${posPercent}%,
                                                ${getSentimentColor('negative')} ${posPercent}% ${posPercent + negPercent}%,
                                                ${getSentimentColor('neutral')} ${posPercent + negPercent}% 100%
                                            )`,
                                            position: 'relative',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: '130px',
                                                height: '130px',
                                                background: '#1b2838',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ fontSize: '32px', fontWeight: '700', color: 'white' }}>
                                                    {uniqueAspects}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#8f98a0', textAlign: 'center', lineHeight: '1.3' }}>
                                                    Unique<br />Aspects
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: '16px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '11px', color: '#8f98a0', marginBottom: '4px' }}>Total Mentions</div>
                                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#66c0f4' }}>{totalMentions.toLocaleString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getSentimentColor('positive') }} />
                                                    <span style={{ fontSize: '13px', color: '#8f98a0' }}>
                                                        Positive
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>
                                                    {posPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getSentimentColor('negative') }} />
                                                    <span style={{ fontSize: '13px', color: '#8f98a0' }}>
                                                        Negative
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>
                                                    {negPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getSentimentColor('neutral') }} />
                                                    <span style={{ fontSize: '13px', color: '#8f98a0' }}>
                                                        Neutral
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>
                                                    {neuPercent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                            border: '1px solid rgba(102, 192, 244, 0.3)',
                            padding: '30px'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '24px' }}>
                                Analysis Insights
                            </h3>
                            {(() => {
                                const totalAspects = Object.keys(analysisData.aspects).length;
                                const total = analysisData.overall_sentiment.positive +
                                    analysisData.overall_sentiment.negative +
                                    analysisData.overall_sentiment.neutral;
                                const strengthScore = ((analysisData.overall_sentiment.positive / total) * 100).toFixed(1);
                                const weaknessScore = ((analysisData.overall_sentiment.negative / total) * 100).toFixed(1);

                                const polarizing = Object.entries(analysisData.aspects)
                                    .map(([aspect, sent]) => ({
                                        aspect,
                                        score: sent.positive + sent.negative,
                                        ratio: Math.abs(sent.positive - sent.negative)
                                    }))
                                    .filter(a => a.score > 5)
                                    .sort((a, b) => a.ratio - b.ratio)[0];

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', color: '#8f98a0', marginBottom: '8px' }}>
                                                Unique Aspects Found
                                            </div>
                                            <div style={{ fontSize: '28px', fontWeight: '700', color: '#66c0f4' }}>
                                                {totalAspects}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', color: '#8f98a0', marginBottom: '8px' }}>
                                                Strength Score
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ fontSize: '24px', fontWeight: '700', color: getSentimentColor('positive') }}>
                                                    {strengthScore}%
                                                </div>
                                                <div style={{
                                                    flex: 1,
                                                    height: '8px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${strengthScore}%`,
                                                        height: '100%',
                                                        background: getSentimentColor('positive'),
                                                        borderRadius: '4px'
                                                    }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '13px', color: '#8f98a0', marginBottom: '8px' }}>
                                                Weakness Score
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ fontSize: '24px', fontWeight: '700', color: getSentimentColor('negative') }}>
                                                    {weaknessScore}%
                                                </div>
                                                <div style={{
                                                    flex: 1,
                                                    height: '8px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${weaknessScore}%`,
                                                        height: '100%',
                                                        background: getSentimentColor('negative'),
                                                        borderRadius: '4px'
                                                    }} />
                                                </div>
                                            </div>
                                        </div>

                                        {polarizing && (
                                            <div style={{
                                                marginTop: '8px',
                                                padding: '12px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)'
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#8f98a0', marginBottom: '4px' }}>
                                                    Most Balanced Aspect
                                                </div>
                                                <div style={{ fontSize: '14px', color: 'white', fontWeight: '600', textTransform: 'capitalize' }}>
                                                    {polarizing.aspect}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                        border: '1px solid rgba(102, 192, 244, 0.3)',
                        marginBottom: '30px'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>
                            Strengths vs Weaknesses
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: getSentimentColor('positive'),
                                    marginBottom: '16px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Top 5 Strengths
                                </div>
                                {Object.entries(analysisData.aspects)
                                    .sort((a, b) => b[1].positive - a[1].positive)
                                    .slice(0, 5)
                                    .map(([aspect, sentiments], idx) => (
                                        <div key={aspect} style={{ marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '13px', color: 'white', fontWeight: '600', textTransform: 'capitalize' }}>
                                                    {idx + 1}. {aspect}
                                                </span>
                                                <span style={{ fontSize: '13px', color: getSentimentColor('positive'), fontWeight: '700' }}>
                                                    {sentiments.positive}
                                                </span>
                                            </div>
                                            <div style={{
                                                height: '6px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${(sentiments.positive / analysisData.overall_sentiment.positive) * 100}%`,
                                                    height: '100%',
                                                    background: getSentimentColor('positive'),
                                                    borderRadius: '3px'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            <div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: getSentimentColor('negative'),
                                    marginBottom: '16px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Top 5 Weaknesses
                                </div>
                                {Object.entries(analysisData.aspects)
                                    .sort((a, b) => b[1].negative - a[1].negative)
                                    .slice(0, 5)
                                    .map(([aspect, sentiments], idx) => (
                                        <div key={aspect} style={{ marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '13px', color: 'white', fontWeight: '600', textTransform: 'capitalize' }}>
                                                    {idx + 1}. {aspect}
                                                </span>
                                                <span style={{ fontSize: '13px', color: getSentimentColor('negative'), fontWeight: '700' }}>
                                                    {sentiments.negative}
                                                </span>
                                            </div>
                                            <div style={{
                                                height: '6px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${(sentiments.negative / analysisData.overall_sentiment.negative) * 100}%`,
                                                    height: '100%',
                                                    background: getSentimentColor('negative'),
                                                    borderRadius: '3px'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                        border: '1px solid rgba(102, 192, 244, 0.3)',
                        marginBottom: '30px'
                    }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>
                            Detailed Aspect Analysis
                        </h3>

                        <div style={{
                            maxHeight: '500px',
                            overflowY: 'auto',
                            paddingRight: '10px'
                        }}>
                            {Object.entries(analysisData.aspects).map(([aspect, sentiments]) => {
                                const total = sentiments.positive + sentiments.negative + sentiments.neutral;
                                const posPercent = (sentiments.positive / total) * 100;
                                const negPercent = (sentiments.negative / total) * 100;
                                const neuPercent = (sentiments.neutral / total) * 100;

                                return (
                                    <div key={aspect} style={{ marginBottom: '14px' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '6px'
                                        }}>
                                            <span style={{ fontSize: '14px', color: 'white', fontWeight: '600', textTransform: 'capitalize' }}>
                                                {aspect}
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    background: getSentimentBgColor('positive'),
                                                    color: getSentimentColor('positive'),
                                                    fontWeight: '600',
                                                    border: `1px solid ${getSentimentColor('positive')}`
                                                }}>
                                                    {sentiments.positive}
                                                </span>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    background: getSentimentBgColor('negative'),
                                                    color: getSentimentColor('negative'),
                                                    fontWeight: '600',
                                                    border: `1px solid ${getSentimentColor('negative')}`
                                                }}>
                                                    {sentiments.negative}
                                                </span>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    background: getSentimentBgColor('neutral'),
                                                    color: getSentimentColor('neutral'),
                                                    fontWeight: '600',
                                                    border: `1px solid ${getSentimentColor('neutral')}`
                                                }}>
                                                    {sentiments.neutral}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{
                                            height: '16px',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            background: 'rgba(255, 255, 255, 0.05)'
                                        }}>
                                            {posPercent > 0 && (
                                                <div style={{
                                                    width: `${posPercent}%`,
                                                    background: getSentimentColor('positive'),
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            )}
                                            {negPercent > 0 && (
                                                <div style={{
                                                    width: `${negPercent}%`,
                                                    background: getSentimentColor('negative'),
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            )}
                                            {neuPercent > 0 && (
                                                <div style={{
                                                    width: `${neuPercent}%`,
                                                    background: getSentimentColor('neutral'),
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {analysisData.sample_review && (
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                            border: '1px solid rgba(220, 53, 69, 0.4)',
                            marginBottom: '30px'
                        }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>
                                Review Result Sample
                            </h3>
                            <div style={{
                                padding: '24px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                border: '2px solid rgba(220, 53, 69, 0.4)'
                            }}>
                                {(() => {
                                    const text = analysisData.sample_review.text;
                                    const aspects = analysisData.sample_review.aspects || [];

                                    // Sort aspects by length (longest first) untuk match multi-word aspects dulu
                                    const sortedAspects = [...aspects].sort((a, b) => 
                                        b.aspect.length - a.aspect.length
                                    );

                                    let highlightedText = text;
                                    const highlights = [];

                                    // Find all aspect positions
                                    sortedAspects.forEach(asp => {
                                        const aspectLower = asp.aspect.toLowerCase();
                                        const textLower = highlightedText.toLowerCase();
                                        let startIndex = 0;

                                        while ((startIndex = textLower.indexOf(aspectLower, startIndex)) !== -1) {
                                            const endIndex = startIndex + aspectLower.length;
                                            const currentStart = startIndex;
                                            const currentEnd = endIndex;
                                            
                                            // Check if already highlighted
                                            const overlaps = highlights.some(h => 
                                                (currentStart >= h.start && currentStart < h.end) ||
                                                (currentEnd > h.start && currentEnd <= h.end)
                                            );

                                            if (!overlaps) {
                                                highlights.push({
                                                    start: currentStart,
                                                    end: currentEnd,
                                                    sentiment: asp.sentiment,
                                                    aspect: asp.aspect
                                                });
                                            }
                                            startIndex = endIndex;
                                        }
                                    });

                                    // Sort highlights by position
                                    highlights.sort((a, b) => a.start - b.start);

                                    // Build highlighted JSX
                                    const parts = [];
                                    let lastIndex = 0;

                                    highlights.forEach((h, idx) => {
                                        // Add text before highlight
                                        if (h.start > lastIndex) {
                                            parts.push(text.substring(lastIndex, h.start));
                                        }

                                        // Add highlighted text
                                        parts.push(
                                            <span
                                                key={idx}
                                                style={{
                                                    background: getSentimentColor(h.sentiment),
                                                    color: getSentimentTextColor(h.sentiment),
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    fontWeight: '700'
                                                }}
                                            >
                                                {text.substring(h.start, h.end)}
                                            </span>
                                        );

                                        lastIndex = h.end;
                                    });

                                    // Add remaining text
                                    if (lastIndex < text.length) {
                                        parts.push(text.substring(lastIndex));
                                    }

                                    return (
                                        <div style={{
                                            fontSize: '15px',
                                            color: 'white',
                                            lineHeight: '1.8',
                                            marginBottom: '20px',
                                            fontStyle: 'italic'
                                        }}>
                                            "{parts}"
                                        </div>
                                    );
                                })()}
                                <div>
                                    <p style={{ fontSize: '12px', color: '#8f98a0', marginBottom: '12px', fontWeight: '600' }}>
                                        Detected Aspects:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {analysisData.sample_review.aspects?.map((asp, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    padding: '8px 14px',
                                                    borderRadius: '6px',
                                                    background: getSentimentColor(asp.sentiment),
                                                    color: getSentimentTextColor(asp.sentiment),
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    transition: 'transform 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                            >
                                                {asp.aspect} <span style={{ fontSize: '11px', opacity: 0.8 }}>({asp.confidence.toFixed(4)})</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GameAnalysis;
