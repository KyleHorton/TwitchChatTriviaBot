require("dotenv").config();
const tmi = require("tmi.js");
const axios = require("axios");
const he = require("he");
const stringSimilarity = require("string-similarity");

let triviaAnswer = undefined;
let isWaitingForAnswer = false;
let hasBeenAnswered = false;
let leaderboard = [];

// SETTINGS
let channelBotLivesIn = 'bini' // set this variable to whatever twitch chat you want this bot to live inside
let ALLOWED_USERS = ["nosrettep_", "mcop77", "macgamble", "bini", "xoonies"];
let ALLOW_ANYONE = true; // if set to true, overrules the ALLOWED_USERS list

const client = new tmi.Client({
  connection: {
    reconnect: true,
  },
  channels: [channelBotLivesIn],
  identity: {
    username: process.env.TWITCH_BOT_USERNAME, // the twitch account the bot uses to send messages
    password: process.env.TWITCH_OAUTH_TOKEN, // the auth token of said twitch account
  },
});

client.connect();

client.on("message", async (channel, context, message) => {

  const isNotBot =
    context.username.toLowerCase() !==
    process.env.TWITCH_BOT_USERNAME.toLowerCase();

  if (!isNotBot) return;

  if (message.trim().toLowerCase() == "!trivialeaderboard") {
    if (leaderboard.length === 0) {
      client.say(channel, `The leaderboard is empty. You all suck!`);
    } else {
      let leaders = "The current Top 10 leaderboard is as follows: ";

      leaderboard.sort((a, b) => a.score - b.score);
      leaderboard.reverse();

      let place = 1;
      leaderboard.forEach((chatter) => {
        if (place < 11) {
          if (chatter.score === 1) {
            leaders += `${place}. ${chatter.name} (${chatter.score} point), `;
          } else {
            leaders += `${place}. ${chatter.name} (${chatter.score} points), `;
          }
        }

        place++;
      });

      client.say(channel, leaders);
    }
  }

  if (isWaitingForAnswer) {
    if (!hasBeenAnswered) {
      if (message.toLowerCase() === triviaAnswer.toLowerCase()) {
        client.say(
          channel,
          `${context.username} was correct! The answer was: ${triviaAnswer}. +1 point!`
        );

        if (leaderboard.some((x) => x.name === context.username)) {
          let person = leaderboard.find((x) => x.name === context.username);
          person.score += 1;
        } else {
          let chatter = {
            name: context.username,
            score: 1,
          };
          leaderboard.push(chatter);
        }

        hasBeenAnswered = true;
      } else if (
        stringSimilarity.compareTwoStrings(
          message.toLowerCase(),
          triviaAnswer.toLowerCase()
        ) > 0.75
      ) {
        client.say(
          channel,
          `${context.username} was mostly correct! We'll give it to them! The answer was: ${triviaAnswer}. +1 point!`
        );

        if (leaderboard.some((x) => x.name === context.username)) {
          let person = leaderboard.find((x) => x.name === context.username);
          person.score += 1;
        } else {
          let chatter = {
            name: context.username,
            score: 1,
          };
          leaderboard.push(chatter);
        }

        hasBeenAnswered = true;
      } else if (
        // answer given matches parenthetical in official answer
        stringSimilarity.compareTwoStrings(
          message.toLowerCase(),
          parentheticalExtracted(triviaAnswer.toLowerCase())
        ) > 0.75
        ||
        // answer given matches what's outside parenthetical in official answer
        stringSimilarity.compareTwoStrings(
          message.toLowerCase(),
          nonparentheticalExtracted(triviaAnswer.toLowerCase())
        ) > 0.75
      ) {
        client.say(
          channel,
          `${context.username} was mostly correct! We'll give it to them! The answer was: ${triviaAnswer}. +1 point!`
        );

        if (leaderboard.some((x) => x.name === context.username)) {
          let person = leaderboard.find((x) => x.name === context.username);
          person.score += 1;
        } else {
          let chatter = {
            name: context.username,
            score: 1,
          };
          leaderboard.push(chatter);
        }

        hasBeenAnswered = true;
      }
    }
  } else {
    if (message.trim().toLowerCase() == "!trivia" && (ALLOWED_USERS.some((x) => x === context.username) || ALLOW_ANYONE)) {
      axios
      /*
        .get(
          "https://the-trivia-api.com/api/questions?limit=1&difficulties=easy,medium,hard" //documentation link for api in readme
        )
        .then((response) => {
          let data = response.data[0];
          let question = he.decode(data.question);
          triviaAnswer = he.decode(data.correctAnswer);
          */
          .get(
            "https://jservice.io/api/random?count=1"
          )
          .then((response) => {
            let data = response.data[0];
            let category = he.decode(data.category.title);
            let question = he.decode(data.question) + ` (Category: ${category})`;
            triviaAnswer = he.decode(data.answer).replace("<i>", "").replace("</i>", "");
          
          if (
            question.includes("Which of these") ||
            question.includes("Which one of") ||
            question.includes("following")
          ) {
            let choices = data.incorrectAnswers;
            choices.push(triviaAnswer);

            shuffleArray(choices);

            choices.forEach((choice, index) => {
              if (index === choices.length - 1) {
                question += ` or ${he.decode(choice)}?`;
              } else {
                question += ` ${he.decode(choice)},`;
              }
            });
          }
          console.log("Question = ", question);
          console.log("Answer = ", triviaAnswer);

          client.say(channel, question);

          setTimeout(WaitingForAnswer, 25000);
        })
        .catch((err) => {
          console.log("Error: ", err.message);

          return "Question could not be retrieved";
        });

      isWaitingForAnswer = true;
    }
  }
});

const WaitingForAnswer = () => {
  if (!hasBeenAnswered) {
    client.say(channelBotLivesIn, `Time has expired! The answer was: ${triviaAnswer}.`);
  }
  hasBeenAnswered = false;
  isWaitingForAnswer = false;
  canReceiveCommand = false;
};


const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};


const hasParenthetical = (s) => {
  rx = /\(([^()]*)\)/g;
  if (s.match(rx)) {
    return true;
  } else {
    return false;
  }
}


const parentheticalExtracted = (s) => {
  rx = /\(([^()]*)\)/g;
  if (!hasParenthetical(s)) {
    return "";
  }
  return s.match(rx).pop().replace("(", "").replace(")", "");
}


const nonparentheticalExtracted = (s) => {
  rx2 = /\s*(?:\[[^\]]*\]|\([^)]*\))\s*/gm;
  return s.replace(rx2, "");
}