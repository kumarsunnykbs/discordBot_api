require("dotenv").config();
const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "reminder",
    description: "Replies with reminder",
  },
  {
    name: "exchange",
    description: "Exchange currency data",
    options: [
      {
        name: "amount",
        description: "Amount to convert",
        type: 3, // Type 3 represents STRING
        required: true,
      },
      {
        name: "basecurrency",
        description: "Base currency code",
        type: 3, // Type 3 represents STRING
        required: true,
      },
      {
        name: "targetcurrency",
        description: "Target currency code",
        type: 3, // Type 3 represents STRING
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
