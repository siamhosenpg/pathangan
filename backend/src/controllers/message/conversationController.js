// controllers/message/conversationController.js
import mongoose from "mongoose";
import Conversation from "../../models/message/Conversation.js";

/**
 * @desc    Get existing conversation or create a new one
 * @route   POST /api/messages/conversations
 * @access  Private
 */
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (userId === currentUserId) {
      return res
        .status(400)
        .json({ message: "You cannot start a conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] },
    })
      .populate("participants", "username name profileImage")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username name profileImage",
        },
      });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, userId],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "username name profileImage")
        .populate({
          path: "lastMessage",
          populate: {
            path: "sender",
            select: "username name profileImage",
          },
        });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error("getOrCreateConversation error:", error);
    return res.status(500).json({
      message: "Failed to get or create conversation",
    });
  }
};

/**
 * @desc    Get all conversations of logged-in user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username name profileImage")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username name profileImage",
        },
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json(conversations);
  } catch (error) {
    console.error("getMyConversations error:", error);
    return res.status(500).json({
      message: "Failed to load conversations",
    });
  }
};

/**
 * @desc    Get single conversation by ID
 * @route   GET /api/messages/conversations/:conversationId
 * @access  Private
 */
export const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    })
      .populate("participants", "username name profileImage")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "username name profileImage",
        },
      });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error("getConversationById error:", error);
    return res.status(500).json({
      message: "Failed to load conversation",
    });
  }
};
