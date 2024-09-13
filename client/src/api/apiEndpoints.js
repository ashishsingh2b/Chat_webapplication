const ApiEndpoints = {
  SIGN_UP_URL: "api/v1/signup",
  LOGIN_URL: "api/v1/login",
  USER_URL: "api/v1/users",
  CHAT_URL: "api/v1/chats",
  USER_CHAT_URL: "api/v1/users/<userId>/chats",
  CHAT_MESSAGE_URL: "api/v1/chats/<chatId>/messages",
  PROFILE_URL: "api/v1/profile/<userId>/", // Updated profile URL with user ID placeholder

  // Example URLs for specific actions if needed
  PROFILE_UPDATE_URL: "api/v1/users/<userId>/profile/update", // For PUT/POST requests to update profile
};

export default ApiEndpoints;
