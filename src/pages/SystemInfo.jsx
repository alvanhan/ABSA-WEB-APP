import React, { useState, useEffect } from 'react';
import { AlertCircle, XCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8000';

const SystemInfo = () => {
    const [systemInfo, setSystemInfo] = useState(null);
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [apiStatus, setApiStatus] = useState('disconnected');

    useEffect(() => {
        fetchSystemInfo();
        fetchHealthData();
    }, []);

    const fetchSystemInfo = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/model-info`);
            if (response.ok) {
                const data = await response.json();
                setSystemInfo(data);
                setApiStatus('connected');
            } else {
                setApiStatus('error');
            }
        } catch (err) {
            console.error('Error fetching system info:', err);
            setApiStatus('disconnected');
        } finally {
            setLoading(false);
        }
    };

    const fetchHealthData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (response.ok) {
                const data = await response.json();
                setHealthData(data);
            }
        } catch (err) {
            console.error('Error fetching health data:', err);
        }
    };

    const testConnection = async () => {
        setTesting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/`);
            if (response.ok) {
                const data = await response.json();
                setApiStatus('connected');
                toast.success(`Connected to ${data.message}`, {
                    position: "top-right",
                    autoClose: 3000,
                    style: {
                        background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                        color: 'white',
                        border: '1px solid rgba(92, 126, 16, 0.6)'
                    }
                });
                await fetchSystemInfo();
                await fetchHealthData();
            } else {
                throw new Error('Connection failed');
            }
        } catch (err) {
            setApiStatus('disconnected');
            toast.error('Failed to connect to API. Make sure the backend is running.', {
                position: "top-right",
                autoClose: 5000,
                style: {
                    background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)',
                    color: 'white',
                    border: '1px solid rgba(220, 53, 69, 0.5)'
                }
            });
        } finally {
            setTesting(false);
        }
    };

    const getStatusColor = () => {
        switch(apiStatus) {
            case 'connected': return { bg: 'rgba(92, 126, 16, 0.2)', color: '#b8d432', text: 'Connected' };
            case 'error': return { bg: 'rgba(255, 152, 0, 0.2)', color: '#ff9800', text: 'Error' };
            default: return { bg: 'rgba(220, 53, 69, 0.2)', color: '#dc3545', text: 'Disconnected' };
        }
    };

    const statusStyle = getStatusColor();

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
                    <Loader2 size={48} style={{ color: '#66c0f4', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: '#8f98a0', fontSize: '15px' }}>Loading system information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content fade-in">
            <div className="page-header">
                <h2>System Information</h2>
                <p>Model details and system status</p>
            </div>

            <div className="card" style={{ marginBottom: '25px', background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)', border: '1px solid rgba(102, 192, 244, 0.3)' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ color: '#e2eef8' }}>API Connection Status</h3>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {apiStatus === 'connected' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {statusStyle.text}
                    </span>
                </div>
                <div>
                    <p style={{ fontSize: '14px', color: '#8f98a0', marginBottom: '15px' }}>
                        Backend API: <strong>{API_BASE_URL}</strong>
                    </p>
                    <button 
                        className="btn btn-primary"
                        onClick={testConnection}
                        disabled={testing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {testing ? (
                            <>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Testing...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} />
                                Test Connection
                            </>
                        )}
                    </button>
                </div>
            </div>

            {healthData && (
                <div className="card" style={{ marginBottom: '25px', background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)', border: '1px solid rgba(102, 192, 244, 0.3)' }}>
                    <div className="card-header">
                        <h3 className="card-title" style={{ color: '#e2eef8' }}>Storage Statistics</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '10px 0' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '36px', fontWeight: '700', color: '#66c0f4', marginBottom: '8px' }}>
                                {healthData.storage?.scraped_games || 0}
                            </div>
                            <div style={{ fontSize: '14px', color: '#c7d5e0', fontWeight: '600' }}>Scraped Games</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '36px', fontWeight: '700', color: '#b8d432', marginBottom: '8px' }}>
                                {healthData.storage?.analyzed_games || 0}
                            </div>
                            <div style={{ fontSize: '14px', color: '#c7d5e0', fontWeight: '600' }}>Analyzed Games</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '36px', fontWeight: '700', color: '#e2eef8', marginBottom: '8px' }}>
                                {(healthData.storage?.total_reviews || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '14px', color: '#c7d5e0', fontWeight: '600' }}>Total Reviews</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-2">
                <div className="card" style={{ background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)', border: '1px solid rgba(102, 192, 244, 0.3)' }}>
                    <div className="card-header">
                        <h3 className="card-title" style={{ color: '#e2eef8' }}>Model Information</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8f98a0', marginBottom: '4px' }}>Model Name</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2eef8' }}>
                                {systemInfo?.model_name || 'Not Available'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8f98a0', marginBottom: '4px' }}>Status</div>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                {systemInfo?.model_loaded ? (
                                    <span style={{ color: '#b8d432', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CheckCircle size={16} /> Loaded
                                    </span>
                                ) : (
                                    <span style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <XCircle size={16} /> Not Loaded
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8f98a0', marginBottom: '4px' }}>Device</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2eef8' }}>
                                {systemInfo?.device || 'Unknown'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#8f98a0', marginBottom: '4px' }}>Framework</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2eef8' }}>
                                {systemInfo?.framework || 'PyABSA'}
                            </div>
                        </div>
                        {systemInfo?.checkpoint_name && (
                            <div>
                                <div style={{ fontSize: '12px', color: '#8f98a0', marginBottom: '4px' }}>Checkpoint</div>
                                <div style={{ fontSize: '12px', fontWeight: '500', color: '#66c0f4', wordBreak: 'break-all' }}>
                                    {systemInfo.checkpoint_name}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)', border: '1px solid rgba(102, 192, 244, 0.3)' }}>
                    <div className="card-header">
                        <h3 className="card-title" style={{ color: '#e2eef8' }}>Model Capabilities</h3>
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', margin: 0, padding: 0 }}>
                        {(systemInfo?.capabilities || []).map((capability, index) => (
                            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#b8d432', fontSize: '16px' }}>✓</span>
                                <span style={{ fontSize: '14px', color: '#e2eef8', fontWeight: '600' }}>{capability}</span>
                            </li>
                        ))}
                        {(!systemInfo?.capabilities || systemInfo.capabilities.length === 0) && (
                            <li style={{ fontSize: '14px', color: '#8f98a0' }}>No capabilities available</li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="card" style={{ marginTop: '25px', background: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)', border: '1px solid rgba(102, 192, 244, 0.3)' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ color: '#e2eef8' }}>Model Performance Metrics</h3>
                </div>
                <div className="grid grid-3">
                    <div style={{
                        textAlign: 'center',
                        padding: '24px 20px',
                        background: 'linear-gradient(135deg, rgba(102, 192, 244, 0.15) 0%, rgba(102, 192, 244, 0.08) 100%)',
                        borderRadius: '8px',
                        border: '1px solid rgba(102, 192, 244, 0.4)',
                        boxShadow: '0 2px 8px rgba(102, 192, 244, 0.1)'
                    }}>
                        <div style={{ fontSize: '36px', fontWeight: '700', color: '#66c0f4', marginBottom: '8px' }}>
                            {systemInfo?.metrics?.apc_accuracy ? `${systemInfo.metrics.apc_accuracy}%` : '-'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', color: '#e2eef8' }}>
                            APC Accuracy
                        </div>
                        <div style={{ fontSize: '12px', color: '#8f98a0' }}>
                            Aspect Polarity Classification
                        </div>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '24px 20px',
                        background: 'linear-gradient(135deg, rgba(184, 212, 50, 0.15) 0%, rgba(184, 212, 50, 0.08) 100%)',
                        borderRadius: '8px',
                        border: '1px solid rgba(184, 212, 50, 0.4)',
                        boxShadow: '0 2px 8px rgba(184, 212, 50, 0.1)'
                    }}>
                        <div style={{ fontSize: '36px', fontWeight: '700', color: '#b8d432', marginBottom: '8px' }}>
                            {systemInfo?.metrics?.apc_f1 ? `${systemInfo.metrics.apc_f1}%` : '-'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', color: '#e2eef8' }}>
                            APC F1 Score
                        </div>
                        <div style={{ fontSize: '12px', color: '#8f98a0' }}>
                            Aspect Polarity Classification
                        </div>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '24px 20px',
                        background: 'linear-gradient(135deg, rgba(226, 238, 248, 0.15) 0%, rgba(226, 238, 248, 0.08) 100%)',
                        borderRadius: '8px',
                        border: '1px solid rgba(226, 238, 248, 0.4)',
                        boxShadow: '0 2px 8px rgba(226, 238, 248, 0.1)'
                    }}>
                        <div style={{ fontSize: '36px', fontWeight: '700', color: '#e2eef8', marginBottom: '8px' }}>
                            {systemInfo?.metrics?.ate_f1 ? `${systemInfo.metrics.ate_f1}%` : '-'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', color: '#e2eef8' }}>
                            ATE F1 Score
                        </div>
                        <div style={{ fontSize: '12px', color: '#8f98a0' }}>
                            Aspect Term Extraction
                        </div>
                    </div>
                </div>
            </div>

            {apiStatus !== 'connected' && (
                <div style={{
                    marginTop: '25px',
                    padding: '16px 20px',
                    background: 'rgba(255, 152, 0, 0.1)',
                    borderLeft: '4px solid #ff9800',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'start'
                }}>
                    <AlertCircle size={20} style={{ color: '#ff9800', flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '14px', color: '#e2eef8' }}>
                        <strong>Note:</strong> Connect to the API backend to see real-time system information and model status. Click "Test Connection" above.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SystemInfo;
