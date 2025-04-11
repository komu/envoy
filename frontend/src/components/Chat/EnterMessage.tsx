import React, {FormEvent, useEffect, useRef, useState} from "react";
import SendIcon from "../../assets/icons/send-icon.svg?react";

export function EnterMessage(props: {
  onSubmit: (text: string) => void,
  placeholder: string,
  disabled: boolean,
}) {
  const [messageText, setMessageText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
  };

  const doSubmit = (e: FormEvent) => {
    e.preventDefault();

    props.onSubmit(messageText);
    setMessageText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey)
      doSubmit(e);
  };

  // Resize text area when ever message text changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);

  return <div className="p-4 w-full max-w-4xl self-center">
    <form onSubmit={doSubmit} className="space-y-2">
      <div
        className="flex items-end gap-3 bg-secondary-bg rounded-lg p-1 border border-gray-700 focus-within:border-gray-600 focus-within:ring-1 focus-within:ring-indigo-500/20 transition duration-200 ease-in">
            <textarea
              value={messageText}
              onChange={onChange}
              placeholder={props.placeholder}
              required
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full bg-transparent text-white p-3 border-0 focus:ring-0 focus:outline-none resize-none min-h-10 max-h-40 overflow-y-auto"
              ref={textareaRef}
            />

        <SendButton disabled={!messageText.trim() || props.disabled}/>
      </div>
    </form>
  </div>;
}

const SendButton = (props: { disabled: boolean }) => {
  return <button
    disabled={props.disabled}
    className={`px-4 py-2 rounded-lg flex items-center gap-1.5 mb-1 mr-1 disabled:opacity-50 disabled:cursor-not-allowed ${
      !props.disabled ? 'bg-accent hover:bg-accent-light text-white' : 'bg-gray-700 text-gray-500'
    }`}
  >
    <SendIcon className="w-4 h-4" />
    Send
  </button>
}
