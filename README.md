# TwitchChatTriviaBot
Node.js chat bot for randomized trivia questions. Includes a leaderboard command that stores scores while the app is live. Resets when app is killed.

Node commands to run for all necessary packages:

npm install dotenv
npm install tmi.js
npm install axios
npm install he
npm install string-similarity

API documentation:
https://the-trivia-api.com/docs/v2/

Make sure to update the .env.txt file to store the twitch account name and oauth token for the chat bot. The .env file should contains contents as below:

to generate an oauth token do the following:

1. be signed into the bot's twitch account
2. go to https://twitchtokengenerator.com/
3. click 'bot chat token'
4. authorize the generator application
5. prove youre not a robot (scary moment if u are)
6. copy the "access token" and paste it in the "oauth token" field in your .env file
7. remove the ".txt" append from your .env file so that the file name is exactly ".env"

