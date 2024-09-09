import jwt_decode from "jwt-decode";
import Constants from "../lib/constants";
import CookieUtil from "./cookieUtil";

// Utility function to check if the input is a Date object
const isDate = (date) => date instanceof Date;

// Utility function to format a date into a time string
const getTimeFromDate = (date) => {
  const dateObj = isDate(date) ? date : new Date(date);
  let hour = dateObj.getHours();
  const minute = dateObj.getMinutes();
  const meridian = hour >= 12 ? "pm" : "am";

  hour = hour % 12 || 12; // Convert 24-hour time to 12-hour time
  const formattedMinute = minute < 10 ? `0${minute}` : minute;

  return `${hour}:${formattedMinute} ${meridian}`;
};

// Utility function to get the user ID from the JWT token
const getUserId = () => {
  const token = CookieUtil.getCookie(Constants.ACCESS_PROPERTY);
  if (token) {
    try {
      const decodedToken = jwt_decode(token);
      return decodedToken.userId || "";
    } catch (error) {
      console.error("Failed to decode token:", error);
      return "";
    }
  }
  return "";
};

// Utility function to format chat users
const getFormatedChatUser = (chatUsers, onlineUserList) => {
  const userId = getUserId();
  
  if (!Array.isArray(chatUsers)) {
    console.warn("Expected chatUsers to be an array, but got:", chatUsers);
    return [];
  }

  return chatUsers.reduce((acumulator, item) => {
    if (item.type === "DM" || item.type === "SELF") {
      const newResult = {
        roomId: item.roomId,
        isOnline: onlineUserList?.includes(item.member?.find(user => user.id !== userId)?.id),
      };

      const member = item.member?.find(user => user.id !== userId) || (item.type === "SELF" ? item.member[0] : null);

      if (member) {
        newResult.name = `${member.first_name} ${member.last_name}`;
        newResult.image = member.image;
        newResult.id = member.id;
        acumulator.push(newResult);
      }
    }
    return acumulator;
  }, []);
};

// Utility function to get the active chat ID from the route match
const getActiveChatId = (match) => match?.params?.chatId || null;

// Exporting utility functions
const CommonUtil = {
  getTimeFromDate,
  getUserId,
  getFormatedChatUser,
  getActiveChatId,
};

export default CommonUtil;
