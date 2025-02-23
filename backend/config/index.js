// config/index.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  wcdUrl: process.env.REACT_APP_WCD_URL,
  wcdApiKey: process.env.REACT_APP_WCD_API_KEY,
  openAiKey: process.env.REACT_APP_OPENAI_KEY,
};
