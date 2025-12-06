import React, { createContext, useState, useContext } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // 初始欢迎语
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: "Hey there! Welcome back.", 
      type: 'text' 
    },
    { 
      id: 2, 
      role: 'assistant', 
      content: "Ready to check in? I just noticed a cool insight about your spending this week.", 
      type: 'text' 
    }
  ]);

  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  const addMessage = (msg) => {
    setMessages(prev => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  };

  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat, messages, addMessage, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};