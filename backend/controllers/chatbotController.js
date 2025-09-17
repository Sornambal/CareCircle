const Conversation = require('../models/Conversation');
const Sentiment = require('sentiment');
const googleTTS = require('google-tts-api');

const sentiment = new Sentiment();

// @desc    Chat with bot
// @route   POST /api/chatbot/chat
// @access  Private
const chatWithBot = async (req, res) => {
  const { message } = req.body;

  try {
    const result = sentiment.analyze(message);
    let sentimentType = 'neutral';
    if (result.score > 0) sentimentType = 'happy';
    else if (result.score < 0) sentimentType = 'sad';

    let response = 'I am here to help you. How are you feeling today?';
    if (sentimentType === 'sad') response = 'I am sorry you are feeling down. Would you like some breathing exercises?';
    if (sentimentType === 'happy') response = 'Great to hear you are happy! Keep it up.';

    // Generate voice URL
    const voiceUrl = googleTTS.getAudioUrl(response, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
    });

    const conversation = await Conversation.create({
      user: req.user._id,
      message,
      response,
      sentiment: sentimentType,
    });

    res.json({ response, voiceUrl, sentiment: sentimentType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get conversation history
// @route   GET /api/chatbot/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user._id }).sort({ timestamp: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  chatWithBot,
  getHistory,
};
