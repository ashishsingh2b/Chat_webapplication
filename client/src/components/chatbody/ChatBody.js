import React, { useEffect, useState, useCallback, useRef } from "react";
import ApiConnector from "../../api/apiConnector";
import ApiEndpoints from "../../api/apiEndpoints";
import ServerUrl from "../../api/serverUrl";
import Constants from "../../lib/constants";
import SocketActions from "../../lib/socketActions";
import CommonUtil from "../../util/commonUtil";
import "./chatBodyStyle.css";
import { FaPaperclip } from 'react-icons/fa';

const ChatBody = ({ match, currentChattingMember, setOnlineUserList }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState({ results: [] });
  const [typing, setTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingSignalSentRef = useRef(false);

  const getDateLabel = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    console.log('Message Date:', messageDate); // Debug log

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const fetchChatMessage = useCallback(async (currentChatId) => {
    if (currentChatId) {
      try {
        const url =
          ApiEndpoints.CHAT_MESSAGE_URL.replace(
            Constants.CHAT_ID_PLACE_HOLDER,
            currentChatId
          ) + "?limit=20&offset=0";
        const chatMessages = await ApiConnector.sendGetRequest(url);

        const messagesWithLabels = chatMessages.results.map((message) => ({
          ...message,
          dateLabel: getDateLabel(message.timestamp),
        }));

        console.log('Fetched Messages:', messagesWithLabels); // Debug log

        setMessages({ results: messagesWithLabels });
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
      }
    }
  }, []);

  useEffect(() => {
    const currentChatId = CommonUtil.getActiveChatId(match);
    fetchChatMessage(currentChatId);
  }, [match, fetchChatMessage]);

  useEffect(() => {
    socketRef.current = new WebSocket(
      ServerUrl.WS_BASE_URL + `ws/users/${CommonUtil.getUserId()}/chat/`
    );

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      const chatId = CommonUtil.getActiveChatId(match);
      const userId = CommonUtil.getUserId();

      if (chatId === data.roomId) {
        if (data.action === SocketActions.MESSAGE) {
          data["userImage"] = ServerUrl.BASE_URL.slice(0, -1) + data.userImage;
          data.dateLabel = getDateLabel(data.timestamp);
          setMessages((prevState) => ({
            results: [data, ...prevState.results],
          }));
          setTyping(false);
        } else if (data.action === SocketActions.TYPING && data.user !== userId) {
          setTyping(data.typing);
        }
      }
      if (data.action === SocketActions.ONLINE_USER) {
        setOnlineUserList(data.userList);
      }
    };

    socketRef.current.addEventListener("message", handleMessage);

    return () => {
      socketRef.current.removeEventListener("message", handleMessage);
      socketRef.current.close();
    };
  }, [match, setOnlineUserList]);

  const loggedInUserId = CommonUtil.getUserId();
  const getChatMessageClassName = (userId) => {
    return loggedInUserId === userId
      ? "chat-message-right pb-3"
      : "chat-message-left pb-3";
  };

  const messageSubmitHandler = (event) => {
    event.preventDefault();
    if (inputMessage || selectedFile) {
      const messageData = {
        action: SocketActions.MESSAGE,
        user: CommonUtil.getUserId(),
        roomId: CommonUtil.getActiveChatId(match),
        timestamp: new Date().toISOString(),
      };

      if (inputMessage) {
        messageData.message = inputMessage;
        messageData.message_type = 'text';
      }

      if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          messageData.media_file = reader.result;
          messageData.message_type = selectedFile.type.startsWith('image/')
            ? 'image'
            : 'document';
          socketRef.current.send(JSON.stringify(messageData));
        };
        reader.readAsDataURL(selectedFile);
      } else {
        socketRef.current.send(JSON.stringify(messageData));
      }
    }
    setInputMessage("");
    setSelectedFile(null);
  };

  const sendTypingSignal = (typing) => {
    socketRef.current.send(
      JSON.stringify({
        action: SocketActions.TYPING,
        typing: typing,
        user: CommonUtil.getUserId(),
        roomId: CommonUtil.getActiveChatId(match),
      })
    );
  };

  const chatMessageTypingHandler = (event) => {
    if (event.keyCode !== Constants.ENTER_KEY_CODE) {
      if (!isTypingSignalSentRef.current) {
        sendTypingSignal(true);
        isTypingSignalSentRef.current = true;
      }
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendTypingSignal(false);
        isTypingSignalSentRef.current = false;
      }, 3000);
    } else {
      clearTimeout(typingTimerRef.current);
      isTypingSignalSentRef.current = false;
    }
  };

  const handleImageClick = (src) => {
    setPreviewImage(src);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="col-12 col-sm-8 col-md-8 col-lg-8 col-xl-10 pl-0 pr-0">
      <div className="py-2 px-4 border-bottom d-none d-lg-block">
        <div className="d-flex align-items-center py-1">
          <div className="position-relative">
            <img
              src={currentChattingMember?.image || '/path/to/default-image.png'}
              className="rounded-circle mr-1"
              alt="User"
              width="40"
              height="40"
            />
          </div>
          <div className="flex-grow-1 pl-3">
            <strong>{currentChattingMember?.name || 'Unknown User'}</strong>
          </div>
        </div>
      </div>
      <div className="position-relative">
        <div
          id="chat-message-container"
          className="chat-messages pl-4 pt-4 pr-4 pb-1 d-flex flex-column-reverse"
        >
          {typing && (
            <div className="chat-message-left chat-bubble mb-1">
              <div className="typing">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
          {messages.results.map((message, index) => (
            <div key={index}>
              {index === 0 || messages.results[index - 1].dateLabel !== message.dateLabel ? (
                <div className="chat-date-label">{message.dateLabel}</div>
              ) : null}
              <div className={getChatMessageClassName(message.user)}>
                <div>
                  <img
                    src={message.userImage || '/path/to/default-image.png'}
                    className="rounded-circle mr-1"
                    alt={message.userName}
                    width="40"
                    height="40"
                  />
                  <div className="">
                    {CommonUtil.getTimeFromDate(message.timestamp)}
                  </div>
                </div>
                <div className="flex-shrink-1 bg-light ml-1 rounded py-2 px-3 mr-3">
                  <div className="font-weight-bold mb-1">{message.userName}</div>
                  {message.message_type === 'text' && message.message}
                  {message.message_type === 'image' && (
                    <div>
                      <img
                        src={message.media_file}
                        alt="media preview"
                        style={{
                          maxWidth: '300px',
                          maxHeight: '300px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(message.media_file)}
                      />
                    </div>
                  )}
                  {message.message_type === 'document' && (
                    <div>Document: {message.media_file}</div>
                  )}
                  {message.message_type === 'contact' && (
                    <div>Contact: {message.message}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-grow-0 py-3 px-4 border-top">
        <form onSubmit={messageSubmitHandler}>
          <div className="input-group">
            <div className="input-group-prepend">
              <label className="input-group-text" htmlFor="chat-message-file">
                <FaPaperclip />
              </label>
              <input
                type="file"
                id="chat-message-file"
                className="d-none"
                onChange={(event) => setSelectedFile(event.target.files[0])}
              />
            </div>
            <input
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyUp={chatMessageTypingHandler}
              value={inputMessage}
              id="chat-message-input"
              type="text"
              className="form-control"
              placeholder="Type your message"
              autoComplete="off"
            />
            <button
              id="chat-message-submit"
              className="btn btn-outline-warning"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="image-preview-modal" onClick={closePreview}>
          <img src={previewImage} alt="Preview" className="image-preview" />
        </div>
      )}
    </div>
  );
};

export default ChatBody;
