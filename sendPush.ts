import axios from 'axios';

export const sendPushNotification = async () => {
  await axios.post('https://onesignal.com/api/v1/notifications', {
    app_id: "7343439a-c7d9-44d3-9d70-2e89156d82fa",
    included_segments: ["Subscribed Users"],
    headings: { en: "Laksha Update!" },
    contents: { en: "Check your financial goals now 💰" },
    url: "https://lakshacoach.com",
  }, {
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
};