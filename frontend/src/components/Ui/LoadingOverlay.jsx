import React from 'react';
import './LoadingOverlay.css'; // Assuming you might want to style it with CSS

export const LoadingOverlay = ({ visible }) => {
    if (!visible) return null;

    return (
        <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading...</p>
        </div>
    );
};
