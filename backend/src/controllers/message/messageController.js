// controllers/message/messageController.js
import mongoose from "mongoose";
import Message from "../../models/message/Message.js";
import Conversation from "../../models/message/Conversation.js";

/**
 * @desc    Get all messages of a conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const messages = await Message.find({ conversationId })
      .populate("sender", "username name profileImage")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({
      message: "Failed to load messages",
    });
  }
};

/**
 * @desc    Create / Send a new message
 * @route   POST /api/messages
 * @access  Private
 */
export const createMessage = async (req, res) => {
  try {
    const { conversationId, text, media } = req.body;
    const senderId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    if (!text && !media) {
      return res.status(400).json({
        message: "Message text or media is required",
      });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: senderId,
      text,
      media,
      seenBy: [senderId],
    });

    // Update lastMessage in conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username name profileImage"
    );

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("createMessage error:", error);
    return res.status(500).json({
      message: "Failed to send message",
    });
  }
};

/**
 * @desc    Delete a message (only sender can delete)
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // Only sender can delete
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        message: "You are not allowed to delete this message",
      });
    }

    await message.deleteOne();

    return res.status(200).json({
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("deleteMessage error:", error);
    return res.status(500).json({
      message: "Failed to delete message",
    });
  }
};
