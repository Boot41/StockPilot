import React from "react";
import { Button } from "./Ui/Button";
import { ChatWidget } from "./Ui/ChatWidget"; 
import { LoadingOverlay } from "./Ui/LoadingOverlay"; 
import { ErrorMessage } from "./Ui/ErrorMessage"; 

export const CommonComponents = ({ loading, error, onDismissError, isChatOpen, onCloseChat }) => {
    return (
        <>  
            <LoadingOverlay visible={loading} />
            <ErrorMessage error={error} onDismiss={onDismissError} />
            <ChatWidget isOpen={isChatOpen} onClose={onCloseChat} />
        </>
    );
};
