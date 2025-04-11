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

interface ServerToolPermissionRequestMessage {
  type: "tool-permission-request";
  requestId: string;
  tool: string;
  input: string;
  dangerous: boolean;
}

type ServerMessage =
  ServerTextMessage
  | ServerThinkingMessage
  | ServerToolCallMessage
  | ServerToolPermissionRequestMessage;

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

export interface ToolPermissionRequestMessage {
  type: "tool-permission-request";
  requestId: string;
  tool: string;
  input: string;
}

export type ChatMessage =
  UserMessage
  | AssistantMessage
  | ToolCallMessage
  | ThinkingMessage
  | ToolPermissionRequestMessage;

export interface ChatState {
  messages: ChatMessage[];
}

export function useChatService() {
  const [state, setState] = useState<ChatState>({messages: []});
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
      setState(st => ({...st, messages: processServerMessage(st.messages, message)}));
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

  const send = (msg: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  };

  const sendMessage = (text: string) => {
    if (text && text.trim() !== '') {
      setState(st => ({...st, messages: [...st.messages, {type: 'user', text}]}));

      send({
        type: "message",
        message: text
      });
    }
  };

  const sendToolPermissionResponse: SendPermissionResponse = (requestId: string, selection: ToolPermissionResponseSelection) => {

    // Remove the permission request from the view
    setState(st => {
      const lastMessage = st.messages.length > 0 ? st.messages[st.messages.length - 1] : undefined;
      if (lastMessage?.type === "tool-permission-request") {
        return {...st, messages: st.messages.slice(0, -1)};
      } else {
        return st;
      }
    });

    send({
      type: "tool-permission-response",
      requestId,
      selection
    });
  };

  return {
    state,
    closed,
    sendMessage,
    sendToolPermissionResponse,
  };
}

type ToolPermissionResponseSelection = 'AllowOnce' | 'AllowAlways' | 'Deny';

export type SendPermissionResponse = (requestId: string, selection: ToolPermissionResponseSelection) => void;

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
        return replaceLastMessage({
          type: "tool-call",
          tool: message.tool,
          input: message.input,
          output: message.output
        });

    case "tool-permission-request":
      return appendMessage({
        type: "tool-permission-request",
        requestId: message.requestId,
        tool: message.tool,
        input: message.input,
      });
  }
}
