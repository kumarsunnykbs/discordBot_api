require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const axios = require("axios");
const schedule = require("node-schedule");
const { OpenAI } = require("openai");

const openai = new OpenAI();
const openaiApiKey = process.env.OPENAI_API_KEY;
const openWeatherMapApiKey = process.env.OPENWEATHERMAP_API_KEY;

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: "You are a helpful assistant." }],
    model: "gpt-3.5-turbo",
  });

  console.log("chhhaaaaaaatttttttttttttttttttttttt", completion.choices[0]);
}

main();
// Store scheduled meetings
const scheduledReminders = {};

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on("ready", (c) => {
  console.log(`${c.user.tag}is online.`);
});

client.on("interactionCreate", async (interaction) => {
  console.log(interaction, "ressssssssssss");
  if (!interaction.isCommand()) return;
  if (interaction.user.bot) return;

  const { commandName } = interaction;

  if (commandName === "reminder") {
    await interaction.reply(
      "Please provide a date and time for your reminder. (e.g., 2023-10-03 14:30)"
    );

    // Wait for the user to respond with a message
    const filter = (response) => response.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 60000, // 60 seconds timeout, adjust as needed
    });

    collector.on("collect", async (message) => {
      const dateTimeString = message.content;

      try {
        const reminderDate = new Date(dateTimeString);
        if (isNaN(reminderDate)) {
          await interaction.followUp(
            "Invalid date and time format. Please use (e.g., 2023-10-03 14:30)."
          );
        } else {
          const fifteenMinutesBefore = new Date(
            reminderDate.getTime() - 15 * 60000
          );
          const reminderJob = schedule.scheduleJob(
            fifteenMinutesBefore,
            async function () {
              try {
                await interaction.followUp({
                  content: `Reminder: Your event is in 15 minutes!`,
                });
              } catch (error) {
                console.error("Error sending reminder:", error);
              }
            }
          );

          scheduledReminders[interaction.user.id] = reminderJob;
          await interaction.followUp(`Reminder set for ${reminderDate}`);
        }
      } catch (error) {
        console.error("Error parsing date and time:", error);
        await interaction.followUp("Error processing your request.");
      } finally {
        collector.stop(); // Stop collecting messages
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        interaction.followUp("You took too long to provide the date and time.");
      }
    });
  } else if (commandName === "exchange") {
    const amount = interaction.options.getString("amount");
    const baseCurrency = interaction.options
      .getString("basecurrency")
      .toUpperCase();
    const targetCurrency = interaction.options
      .getString("targetcurrency")
      .toUpperCase();
    console.log("PPPPPPPPPPPPPPPP", amount, baseCurrency, targetCurrency);
    const apiUrl = `http://api.currencylayer.com/convert?access_key=${process.env.API_KEY}&from=${baseCurrency}&to=${targetCurrency}&amount=${amount}`;
    console.log("appiiiuuuuuuuuuuurrll", apiUrl);
    axios
      .get(apiUrl)
      .then((response) => {
        console.log("RESSSSSSSSSSSSSSSSS", response);
        const exchangeRate = response.data.result.toFixed(2);
        interaction.reply(`Exchange Amount is ${exchangeRate} `);
      })
      .catch((error) => {
        console.error("Error fetching exchange rates:", error);
        interaction.reply(
          "Error fetching exchange rates. Please try again later."
        );
      });
  }
});

// client.on("messageCreate", (message) => {
//   if (message.author.bot) {
//     return;
//   }

//   if (message.content.toLowerCase().includes("hello")) {
//     message.reply("hello, i am trickyyyy.");
//   }
//   console.log(message.content);
// });

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase().includes("weather")) {
    await message.reply(
      "Sure, I can help you with the weather. Please provide the city name."
    );
    const filter = (response) => response.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({
      filter,
      time: 60000, // 60 seconds timeout, adjust as needed
    });

    collector.on("collect", async (userMessage) => {
      const cityName = userMessage.content;
      try {
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${openWeatherMapApiKey}`
        );
        const weatherData = weatherResponse.data;
        const temperature = weatherData.main.temp;
        const description = weatherData.weather[0].description;
        message.reply(
          `Weather in ${cityName}: Temperature: ${temperature}°C, Description: ${description}`
        );
      } catch (error) {
        console.error("Error fetching weather data:", error);
        message.reply(
          "Sorry, I couldn't fetch weather data for the specified city."
        );
      } finally {
        collector.stop(); // Stop collecting messages
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        message.reply("You took too long to provide the city name.");
      }
    });
  } else {
    // Use OpenAI to generate responses based on user input
    if (message.author.bot) return;
    const prompt = message.content;
    try {
      const openaiResponse = await axios.post(
        "https://api.openai.com/v1/completions",
        {
          model: "text-davinci-003",
          prompt: prompt,
          max_tokens: 150,
          temperature: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      const openaiReply = openaiResponse.data.choices[0].text.trim();
      console.log(">>>?????OOOPPPPOOPPP", openaiReply);
      message.reply(openaiReply);
    } catch (error) {
      console.error("Error generating OpenAI response:", error);
      message.reply(
        "I'm sorry, but I couldn't process your request at the moment."
      );
    }
  }
});

client.login(process.env.TOKEN);
