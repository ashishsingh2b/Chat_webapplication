import React, { useEffect, useState } from "react";
import "./sidebar.css";
import { Link } from "react-router-dom";
import CookieUtil from "../../util/cookieUtil";
import AppPaths from "../../lib/appPaths";
import ApiConnector from "../../api/apiConnector";
import ApiEndpoints from "../../api/apiEndpoints";
import CommonUtil from "../../util/commonUtil";
import Constants from "../../lib/constants";
import Modal from "../modal/modal";

const Sidebar = (props) => {
  const [chatUsers, setChatUsers] = useState([]); // sidebar users
  const [users, setUsers] = useState([]); // popup users
  const [isShowAddPeopleModal, setIsShowAddPeopleModal] = useState(false);

  const redirectUserToDefaultChatRoom = (chatUsers) => {
    if (chatUsers.length === 0) return; // Avoid error if chatUsers is empty

    if (props?.location?.pathname === AppPaths.HOME) {
      // Ensure chatUsers[0] is valid
      if (chatUsers[0] && chatUsers[0].roomId) {
        props.setCurrentChattingMember(chatUsers[0]);
        props.history.push("/c/" + chatUsers[0].roomId);
      }
    } else {
      const activeChatId = CommonUtil.getActiveChatId(props.match);
      const chatUser = chatUsers.find((user) => user.roomId === activeChatId);
      if (chatUser) {
        props.setCurrentChattingMember(chatUser);
      }
    }
  };

  const fetchChatUser = async () => {
    try {
      const url = ApiEndpoints.USER_CHAT_URL.replace(
        Constants.USER_ID_PLACE_HOLDER,
        CommonUtil.getUserId()
      );
      const response = await ApiConnector.sendGetRequest(url);
      const formatedChatUser = CommonUtil.getFormatedChatUser(
        response,
        props.onlineUserList
      );
      setChatUsers(formatedChatUser);
      redirectUserToDefaultChatRoom(formatedChatUser);
    } catch (error) {
      console.error("Error fetching chat users:", error);
      // Optionally handle the error here (e.g., show an error message)
    }
  };

  useEffect(() => {
    fetchChatUser();
  }, [props.onlineUserList]); // Include dependencies if needed

  const getConnectedUserIds = () => {
    return chatUsers.map((user) => user.id).join(",");
  };

  const fetchUsers = async () => {
    try {
      const url = ApiEndpoints.USER_URL + "?exclude=" + getConnectedUserIds();
      const response = await ApiConnector.sendGetRequest(url);
      setUsers(response);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Optionally handle the error here (e.g., show an error message)
    }
  };

  const addPeopleClickHandler = async () => {
    await fetchUsers();
    setIsShowAddPeopleModal(true);
  };

  const addMemberClickHandler = async (memberId) => {
    try {
      const userId = CommonUtil.getUserId();
      let requestBody = {
        members: [memberId, userId],
        type: "DM",
      };
      await ApiConnector.sendPostRequest(
        ApiEndpoints.CHAT_URL,
        JSON.stringify(requestBody),
        true,
        false
      );
      await fetchChatUser(); // Await fetchChatUser to ensure chatUsers is updated
      setIsShowAddPeopleModal(false);
    } catch (error) {
      console.error("Error adding member:", error);
      // Optionally handle the error here (e.g., show an error message)
    }
  };

  const getActiveChatClass = (roomId) => {
    const activeChatId = CommonUtil.getActiveChatId(props.match);
    return roomId === activeChatId ? "active-chat" : "";
  };

  const logoutClickHandler = () => {
    CookieUtil.deleteCookie(Constants.ACCESS_PROPERTY);
    CookieUtil.deleteCookie(Constants.REFRESH_PROPERTY);
    window.location.href = AppPaths.LOGIN;
  };

  const getChatListWithOnlineUser = () => {
    return chatUsers.map((user) => ({
      ...user,
      isOnline: props.onlineUserList.includes(user.id),
    }));
  };

  return (
    <div className="col-12 col-sm-4 col-md-4 col-lg-4 col-xl-2 border-right">
      <div className="d-none d-md-block">
        <button
          onClick={addPeopleClickHandler}
          className="btn btn-outline-warning btn-block my-1 mt-4"
        >
          Add People
        </button>
      </div>
      <div className="user-list-container">
        {getChatListWithOnlineUser().map((chatUser) => (
          <Link
            onClick={() => props.setCurrentChattingMember(chatUser)}
            to={`/c/${chatUser.roomId}`}
            className={
              "pl-1 list-group-item list-group-item-action border-0 " +
              getActiveChatClass(chatUser.roomId)
            }
            key={chatUser.id}
          >
            <div className="d-flex align-items-start">
              <img
                src={chatUser.image}
                className="rounded-circle mr-1"
                alt={chatUser.name}
                width="40"
                height="40"
              />
              <div className="flex-grow-1 ml-3">
                {chatUser.name}
                <div className="small">
                  {chatUser.isOnline ? (
                    <>
                      <span className="fas fa-circle chat-online"></span>{" "}
                      Online
                    </>
                  ) : (
                    <>
                      <span className="fas fa-circle chat-offline"></span>{" "}
                      Offline
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <button
        onClick={logoutClickHandler}
        className="btn btn-outline-danger btn-block mt-1"
      >
        Log Out
      </button>
      <hr className="d-block d-lg-none mt-1 mb-0" />
      <Modal
        modalCloseHandler={() => setIsShowAddPeopleModal(false)}
        show={isShowAddPeopleModal}
      >
        {users.length > 0 ? (
          users.map((user) => (
            <div
              key={user.id}
              className="d-flex align-items-start pt-1 pb-1 d-flex align-items-center"
            >
              <img
                src={user.image}
                className="rounded-circle mr-1"
                alt={user.first_name + " " + user.last_name}
                width="40"
                height="40"
              />
              <div className="flex-grow-1 ml-2 mr-5">
                {user.first_name + " " + user.last_name}
              </div>
              <button
                onClick={() => addMemberClickHandler(user.id)}
                className="btn btn-sm btn-success"
              >
                Add
              </button>
            </div>
          ))
        ) : (
          <h3>No More Users Found</h3>
        )}
      </Modal>
    </div>
  );
};

export default Sidebar;
  