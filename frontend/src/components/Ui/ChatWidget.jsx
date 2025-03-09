import React from 'react';

export const ChatWidget = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="chat-widget">
            <button onClick={onClose}>Close Chat</button>
            <div className="chat-content">
                {/* Chat content goes here */}
                <p>Chat with us!</p>
            </div>
        </div>
    );
};
