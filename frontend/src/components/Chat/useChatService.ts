import {useEffect, useRef, useState} from 'react';

interface ServerTextMessage {
  type: "text";
  text: string;
  delta: boolean;
}

interface ServerThinkingMessage {
  type: "thinking";
  text: string;
  delta: boolean;
}

interface ServerToolCallMessage {
  type: "tool-call";
  tool: string;
  input: string;
  output: string | null;
}

type ServerMessage = ServerTextMessage | ServerThinkingMessage | ServerToolCallMessage;

export interface UserMessage {
  type: "user";
  text: string;
}

export interface AssistantMessage {
  type: "assistant";
  text: string;
  complete: boolean;
}

export interface ThinkingMessage {
  type: "thinking";
  text: string;
  complete: boolean;
}

export interface ToolCallMessage {
  type: "tool-call";
  tool: string;
  input: string;
  output?: string;
}

export type ChatMessage = UserMessage | AssistantMessage | ToolCallMessage | ThinkingMessage;

export function useChatService() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
      const message = JSON.parse(event.data) as ServerMessage;
      setMessages(prevMessages => processServerMessage(prevMessages, message));
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

  const sendMessage = (text: string) => {
    if (text && text.trim() !== '') {
      setMessages(prevMessages => [...prevMessages, {type: 'user', text}]);

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({message: text}));
      }
    }
  };

  return {
    messages,
    closed,
    sendMessage,
  };
}

function processServerMessage(prevMessages: ChatMessage[], message: ServerMessage): ChatMessage[] {
  const lastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : undefined;

  const appendMessage = (message: ChatMessage) => [...prevMessages, message];
  const replaceLastMessage = (message: ChatMessage) => [...prevMessages.slice(0, -1), message];

  const type = message.type;
  switch (type) {
    case "text": {
      if (lastMessage?.type !== "assistant" || lastMessage.complete) {
        return appendMessage({type: "assistant", text: message.text, complete: !message.delta});
      } else {
        return replaceLastMessage({
          type: "assistant",
          text: message.delta ? (lastMessage.text + message.text) : message.text,
          complete: false
        });
      }
    }
    case "thinking": {
      if (lastMessage?.type !== "thinking" || lastMessage.complete) {
        return appendMessage({type: "thinking", text: message.text, complete: !message.delta});
      } else {
        return replaceLastMessage({
          type: "thinking",
          text: message.delta ? (lastMessage.text + message.text) : message.text,
          complete: false
        });
      }
    }
    case "tool-call":
      if (lastMessage?.type !== "tool-call" || lastMessage.output !== undefined || message.output === null)
        return appendMessage({type: "tool-call", tool: message.tool, input: message.input});
      else
        return replaceLastMessage({type: "tool-call", tool: message.tool, input: message.input, output: message.output});
  }
}
