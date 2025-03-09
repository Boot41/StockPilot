import React from 'react';

export const ErrorMessage = ({ error, onDismiss }) => {
    if (!error) return null;

    return (
        <div className="error-message">
            <p>{error}</p>
            <button onClick={onDismiss}>Dismiss</button>
        </div>
    );
};
