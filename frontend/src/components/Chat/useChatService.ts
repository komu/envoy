import { useEffect, useRef, useState } from 'react';

// Define message types
export interface AssistantMessage {
  type: "assistant";
  message: string;
}

export interface ToolCallMessage {
  type: "tool-call";
  tool: string;
  input: string;
}

export interface DeltaMessage {
  type: "delta";
  delta: string;
}

export interface UserMessage {
  type: "user";
  message: string;
}

export interface DeltaThinkingMessage {
  type: "delta-thinking";
  delta: string;
}

export interface ThinkingMessage {
  type: "thinking";
  message: string;
}

export type ChatMessage = AssistantMessage | ToolCallMessage | DeltaMessage | UserMessage | DeltaThinkingMessage | ThinkingMessage;

export interface DisplayedToolCallMessage {
  type: "tool-call";
  tool: string;
  input: string;
}

export interface DisplayedAssistantMessage {
  type: "assistant";
  message: string;
  complete: boolean;
}

export interface DisplayedThinkingMessage {
  type: "thinking";
  message: string;
  complete: boolean;
}

export interface DisplayedUserMessage {
  type: "user";
  message: string;
}

export type DisplayedMessage = DisplayedAssistantMessage | DisplayedToolCallMessage | DisplayedUserMessage | DisplayedThinkingMessage;

export function useChatService() {
  const [messages, setMessages] = useState<DisplayedMessage[]>([]);
  const [closed, setClosed] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    socketRef.current = socket;

    socket.onopen = () => {
      setClosed(false);
    };

    // Handle messages from the server
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as ChatMessage;
      processMessage(message);
    };

    // Handle errors
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Handle connection close
    socket.onclose = () => {
      console.log("on close")
      setClosed(true);
    };

    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, []);

  const processMessage = (message: ChatMessage) => {
    switch (message.type) {
      case "assistant": {
        setMessages(prevMessages => {
          const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : undefined;
          const newMessage: DisplayedMessage = {type: "assistant", message: message.message, complete: true};
          if (lastMessage?.type === "assistant" && !lastMessage.complete) {
            return [...prevMessages.slice(0, -1), newMessage];
          } else {
            return [...prevMessages, newMessage];
          }
        });
        break;
      }
      case "thinking": {
        setMessages(prevMessages => {
          const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : undefined;
          const newMessage: DisplayedMessage = {type: "thinking", message: message.message, complete: true};
          if (lastMessage?.type === "thinking" && !lastMessage.complete) {
            return [...prevMessages.slice(0, -1), newMessage];
          } else {
            return [...prevMessages, newMessage];
          }
        });
        break;
      }
      case "user":
        appendMessage({type: "user", message: message.message});
        break;
      case "tool-call":
        appendMessage({type: "tool-call", tool: message.tool, input: message.input});
        break;
      case "delta": {
        setMessages(prevMessages => {
          const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : undefined;
          if (lastMessage?.type === "assistant" && !lastMessage.complete) {
            return [...prevMessages.slice(0, -1), {
              type: "assistant",
              message: lastMessage.message + message.delta,
              complete: false
            }];
          } else {
            return [...prevMessages, {type: "assistant", message: message.delta, complete: false}];
          }
        });
        break;
      }
      case "delta-thinking":
      {
        setMessages(prevMessages => {
          const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : undefined;
          if (lastMessage?.type === "thinking" && !lastMessage.complete) {
            return [...prevMessages.slice(0, -1), {
              type: "thinking",
              message: lastMessage.message + message.delta,
              complete: false
            }];
          } else {
            return [...prevMessages, {type: "thinking", message: message.delta, complete: false}];
          }
        });
        break;
      }
    }
  };

  const appendMessage = (message: DisplayedMessage) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const sendMessage = (message: string) => {
    if (message && message.trim() !== '') {
      appendMessage({type: 'user', message});

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({message}));
      }
    }
  };

  return {
    messages,
    closed,
    sendMessage,
  };
}
