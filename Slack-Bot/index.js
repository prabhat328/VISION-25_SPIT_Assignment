const { App } = require("@slack/bolt");
require("dotenv").config();

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Listen for messages containing the word "task"
app.message("task", async ({ message, say }) => {
  console.log("Received message:", message); // Log the incoming message for debugging

  // Extract the task description from the message text (after the word "task")
  const taskDescription = message.text.replace("task", "").trim();

  if (!taskDescription) {
    await say({
      text: 'Please provide a task description after the word "task". For example: `task Buy groceries`.',
    });
    return;
  }

  // Respond with a confirmation message
  await say({
    text: `Task created: *${taskDescription}*`,
  });
});

app.message(
  /assign task (.*) to <@([A-Z0-9]+)>/,
  async ({ message, say, context }) => {
    const taskDescription = message.text
      .split("assign task")[1]
      .split("to")[0]
      .trim();
    const assignedUser = message.text.match(/<@([A-Z0-9]+)>/)[1]; // Extract user ID

    if (!taskDescription || !assignedUser) {
      await say("Please provide both a task description and an assignee.");
      return;
    }

    console.log("Received message to assign task:", message); // Log the incoming message for debugging

    // Respond to the user
    await say(
      `Task *${taskDescription}* has been assigned to <@${assignedUser}>`
    );

    // Optionally, you can set a reminder for the assignee (e.g., in 30 minutes)

    // Set a reminder for the assignee in 30 minutes
    setTimeout(async () => {
      await say(
        `<@${assignedUser}>, reminder: You have a task assigned to you: *${taskDescription}*`
      );
    }, 1800000); // 30 minutes in milliseconds
  }
);

// Start the app
(async () => {
  try {
    await app.start();
    console.log("Bot is running!");
  } catch (error) {
    console.error("Error starting the app:", error);
  }
})();
