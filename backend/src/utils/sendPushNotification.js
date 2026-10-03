import { Expo } from "expo-server-sdk";
import User from "../models/usermodel.js";

const expo = new Expo({
  // Expo dashboard-e "Enhanced Security" on thakle .env-e EXPO_ACCESS_TOKEN dis
  accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
});

export const sendPushNotification = async ({
  pushToken,
  title,
  body,
  data = {},
  imageUrl = null,
}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid push token: ${pushToken}`);
    // invalid token DB theke muche felo
    await User.updateOne({ pushToken }, { $unset: { pushToken: 1 } });
    return;
  }

  const message = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
    priority: "high",
    channelId: "default", // Android channel (frontend-er sathe mil thakte hobe)
    // richContent shudhu iOS-e kaj kore (notification service extension lagbe)
    ...(imageUrl && { richContent: { image: imageUrl }, mutableContent: true }),
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);

      for (const ticket of tickets) {
        if (ticket.status === "error") {
          console.error("Push ticket error:", ticket.message, ticket.details);

          // device uninstall / token expire hole token muche felo
          if (ticket.details?.error === "DeviceNotRegistered") {
            await User.updateOne({ pushToken }, { $unset: { pushToken: 1 } });
          }
        }
      }
    }
  } catch (err) {
    console.error("Push notification error:", err);
  }
};
