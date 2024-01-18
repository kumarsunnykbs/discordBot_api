const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  userMessage: { type: String },
  botMessage: { type: String },
  conversationId: {},
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
  created: { type: Date, default: Date.now },
});
