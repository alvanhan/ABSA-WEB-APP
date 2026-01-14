import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, TrendingUp, Settings } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const Sidebar = () => {
    const { theme } = useTheme();
    
    return (
        <div style={{
            width: '260px',
            height: '100vh',
            background: theme.sidebarBg,
            borderRight: `1px solid ${theme.border}`,
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000
        }}>
            {/* Logo/Header */}
            <div style={{
                padding: '24px 20px',
                borderBottom: `1px solid ${theme.border}`
            }}>
                <h1 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: theme.primary,
                    margin: 0,
                    letterSpacing: '0.5px'
                }}>
                    Steam ABSA
                </h1>
                <p style={{
                    fontSize: '12px',
                    color: theme.textSecondary,
                    margin: '4px 0 0 0'
                }}>
                    Sentiment Analyzer
                </p>
            </div>

            {/* Navigation Menu */}
            <nav style={{
                flex: 1,
                padding: '20px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                <NavLink
                    to="/"
                    end
                    style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        color: isActive ? theme.primary : theme.textSecondary,
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '500',
                        background: isActive ? `${theme.primary}1a` : 'transparent',
                        borderLeft: isActive ? `3px solid ${theme.primary}` : '3px solid transparent',
                        transition: 'all 0.2s ease'
                    })}
                    onMouseEnter={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                            e.currentTarget.style.background = theme.buttonHover;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                            e.currentTarget.style.background = 'transparent';
                        }
                    }}
                >
                    <Search size={18} />
                    <span>Game List</span>
                </NavLink>

                <NavLink
                    to="/analysis"
                    style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        color: isActive ? theme.primary : theme.textSecondary,
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '500',
                        background: isActive ? `${theme.primary}1a` : 'transparent',
                        borderLeft: isActive ? `3px solid ${theme.primary}` : '3px solid transparent',
                        transition: 'all 0.2s ease'
                    })}
                    onMouseEnter={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                            e.currentTarget.style.background = theme.buttonHover;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                            e.currentTarget.style.background = 'transparent';
                        }
                    }}
                >
                    <TrendingUp size={18} />
                    <span>Analysis Results</span>
                </NavLink>

                <NavLink
                    to="/system-info"
                    style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        color: isActive ? theme.primary : theme.textSecondary,
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '500',
                        background: isActive ? `${theme.primary}1a` : 'transparent',
                        borderLeft: isActive ? `3px solid ${theme.primary}` : '3px solid transparent',
                        transition: 'all 0.2s ease'
                    })}
                    onMouseEnter={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                            e.currentTarget.style.background = theme.buttonHover;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!e.currentTarget.classList.contains('active')) {
                            e.currentTarget.style.background = 'transparent';
                        }
                    }}
                >
                    <Settings size={18} />
                    <span>System Info</span>
                </NavLink>
            </nav>

            {/* Footer */}
            <div style={{
                padding: '16px 20px',
                borderTop: `1px solid ${theme.border}`,
                fontSize: '11px',
                color: theme.textSecondary
            }}>
                <p style={{ margin: 0 }}>Powered by PyABSA</p>
                <p style={{ margin: '4px 0 0 0', opacity: 0.7 }}>Version 1.0.0</p>
            </div>
        </div>
    );
};

export default Sidebar;
