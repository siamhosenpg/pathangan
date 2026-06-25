import Expo from "expo-server-sdk";

const expo = new Expo();

export const sendPushNotification = async ({
  pushToken,
  title,
  body,
  data = {},
  imageUrl = null,
}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid push token: ${pushToken}`);
    return;
  }

  const message = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
    ...(imageUrl && { richContent: { image: imageUrl } }),
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error("Push notification error:", err);
  }
};
