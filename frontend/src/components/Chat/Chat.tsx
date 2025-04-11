import {memo, useEffect, useRef} from 'react';
import {
  ChatMessage, SendPermissionResponse,
  ThinkingMessage,
  ToolCallMessage,
  useChatService
} from './useChatService';
import {EnterMessage} from "./EnterMessage.tsx";
import {MarkdownRenderer} from './MarkdownRenderer.tsx';
import ChatBubbleIcon from "../../assets/icons/chat-bubble-icon.svg?react";
import DisconnectedIcon from "../../assets/icons/disconnected-icon.svg?react";
import { ToolPermissionRequest } from './ToolPermissionRequest.tsx';

const Chat = () => {
  const {state, closed, sendMessage, sendToolPermissionResponse} = useChatService();

  return (
    <div className="flex flex-col h-[100vh] justify-between items-stretch">
      <Header/>

      <Messages
        messages={state.messages}
        closed={closed}
        onPermissionResponse={sendToolPermissionResponse}
      />

      <EnterMessage onSubmit={sendMessage}
                    placeholder={state.messages.length === 0 ? "Send a message..." : "Type your reply..."}
                    disabled={closed}/>
    </div>
  );
};

function Messages({messages, closed, onPermissionResponse}: {
  messages: ChatMessage[],
  closed: boolean,
  onPermissionResponse: SendPermissionResponse,
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const typing = messages.length > 0 && messages[messages.length - 1].type === "user";

  useEffect(() => {
    requestAnimationFrame(() => anchorRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'}));
  }, [messages]);

  return <div className="flex-grow overflow-y-auto px-6 py-4 space-y-6 w-full max-w-4xl self-center">
    {messages.length === 0
      ? <NoMessages/>
      : messages.map((message, index) => <Message key={index} message={message}
                                                  onPermissionResponse={onPermissionResponse}/>
      )
    }

    {typing && <TypingIndicator/>}
    {closed && <ConnectionClosedMessage/>}

    <div ref={anchorRef}></div>
  </div>;
}

const Message = memo(({message, onPermissionResponse}: {
  message: ChatMessage,
  onPermissionResponse: SendPermissionResponse,
}) => {
  const isUserMessage = message.type === 'user';

  if (message.type === 'tool-call')
    return <ToolCall toolCall={message}/>;

  if (message.type === 'thinking')
    return <Thinking thinking={message}/>;

  if (message.type === 'tool-permission-request')
    return <ToolPermissionRequest request={message} onResponse={onPermissionResponse}/>;

  return <div className="flex items-start gap-3 animate-fade-in">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
      isUserMessage ? "bg-accent text-white" : "bg-tertiary-bg text-gray-200"
    }`}>
      {isUserMessage ? (
        <span>U</span>
      ) : (
        <ChatBubbleIcon className="w-4 h-4"/>
      )}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm text-gray-300">{isUserMessage ? "You" : "Envoy"}</span>
      </div>
      <MarkdownRenderer markdown={message.text}/>
    </div>
  </div>;
});

function ToolCall({toolCall}: { toolCall: ToolCallMessage }) {
  return <details className="ml-12 text-xs text-gray-400 text-md italic animate-fade-in">
    <summary>Calling tool {toolCall.tool}</summary>

    <div className="flex flex-col m-4 gap-4">
      <div>Input:</div>
      <div className="whitespace-pre font-mono">{toolCall.input}</div>
    </div>

    {toolCall.output && <div className="flex flex-col m-4 gap-4">
      <div>output:</div>
      <div className="whitespace-pre font-mono">{toolCall.output}</div>
    </div>}
  </details>;
}

function Thinking({thinking}: { thinking: ThinkingMessage }) {
  return <details className={'ml-12 text-xs text-gray-400 cursor-pointer'}>
    <summary>Thinking...</summary>
    <MarkdownRenderer markdown={thinking.text} className='text-xs text-gray-400 m-4'/>
  </details>
}

function NoMessages() {
  return <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 my-8">
    <ChatBubbleIcon className="w-12 h-12 mb-4 text-gray-700" strokeWidth="1.5"/>
    <p className="text-lg">No messages yet</p>
    <p className="text-sm mt-1">Start a conversation with Envoy</p>
  </div>;
}

function TypingIndicator() {
  return <div className="flex items-start gap-3 animate-fade-in">
    <div
      className="bg-gray-800 text-gray-200 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
      <ChatBubbleIcon className="w-4 h-4"/>
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-sm text-gray-300">Envoy</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-typing"></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-typing"
             style={{animationDelay: "200ms"}}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-typing"
             style={{animationDelay: "400ms"}}></div>
      </div>
    </div>
  </div>;
}

function Header() {
  return <header
    className="text-white bg-secondary-bg px-6 py-4 shadow-md flex justify-between items-center border-b border-b-white/10">
    <div className="flex items-center gap-2 text-accent-light font-semibold text-lg">
      <ChatBubbleIcon className="w-5 h-5"/>
      Envoy
    </div>
  </header>;
}

function ConnectionClosedMessage() {
  const reload = () => {
    window.location.reload();
  };

  return <div
    className="flex flex-col items-center justify-center text-center text-white my-8 p-6 bg-gray-800 rounded-lg">
    <DisconnectedIcon className="w-12 h-12 mb-2 text-gray-500"/>
    <p className="text-lg font-medium mb-2">Connection has been closed</p>
    <button
      onClick={reload}
      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors mt-2"
    >
      Reload Connection
    </button>
  </div>;
}

export default Chat;
