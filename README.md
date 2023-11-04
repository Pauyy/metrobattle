# MetroBattle
A PokemonShowdown Bot that plays metronome battles.  
Complete traffic is logged to debug.log  
and the great thing, all of it just works  
yes, it works. It, it actually works perfectly.  
(except when pokemonshowdown restarts)  

## procedure
- logs in
- sets status (if defined in .env, otherwise clears it)
- sets avatar (if defined in .env)
- chooses random team (if more than one is provided)
- searches for gen9metronomebattle (default)
- terastallize pokemon (if defined in .env)
- chooses metronome every turn
- finishes battle and leaves room (after 10 seconds)
- repeats until passed number of battles were played
## output
Every* message the script recives is logged to a file called `debug.log`  
Every chat message and private message is logged to a file called `info.log`  
successful login and WebSocket connection as well as first search are printed to stdout  
the start and end of the battle and faints are also printed to stdout  
  
*There are messages prefixed "request", they are ignored  

## Setup
Install the required libraries with
```bash 
npm install
```  
Configure the .env file
Available templates
1. .env.example.min
2. .env.example.med
3. .env.example.full

### .env.example.min
Contains the absolute minimum of settings 
```
SHOWDOWNNAME= your_showdown_username
PASSWORD= your_password
TEAM_1 = your_team_in_packed_format
```

### .env.example.med
Contains meaningfull bonus settings to make the bot work better
```
SHOWDOWNNAME= your_showdown_username
PASSWORD= your_password
TERA = 1 or 2 [optional]
SEARCH = ladder or username [optional]
PRIVATE_CHALLENGE= reject or ignore or accept [optional]
TEAM_1 = your_team_in_packed_format
TEAM_2 = another_team_in_packed_format [optional]
TEAM_N = any_other_amount_of_packed_teams [optional]
```
TERA determines which pokemon will be terastallized, the first or the second one  
SEARCH determines if you will play on the ladder or a private battle against the given username  
PRIVATE_CHALLENGE determines if the bot will accept gen9metronome battle requests  
TEAM_N pool of teams where one gets randomly selected, every battle a new one will be selected  

### .env.example.full
Contains every setting available
```
SHOWDOWNNAME= your_showdown_username
PASSWORD= your_password
AVATAR= your_avatar [optional]
TERA = 1 or 2 [optional]
SEARCH = ladder or username [optional]
STATUS = String seen on player card [optional]
PSA = String to send in chat on the first ever battle between you and the other trainer [optional]
PRIVATE_CHALLENGE= reject or ignore or accept [optional]
PRIVATE_CHALLENGE_REJECT_MESSAGE= string that gets send after rejecting a challenge [optional]
TEAM_1 = your_team_in_packed_format
TEAM_2 = another_team_in_packed_format [optional]
TEAM_N = any_other_amount_of_packed_teams [optional]
```
PSA determines if the bot will send a chat message if the opposing trainer has not been seen before. If psa is blank no message will be sent and no players will be marked as seen    
PRIVATE_CHALLENGE_REJECT_MESSAGE will be sent after rejecting a challenge because of PRIVATE_CHALLENGE= reject  

### advanced .env settings
If you want a team to be represented more than once you can add '_M' where M is the number of times this team will be represented  
```
TEAM_1 = your_team_in_packed_format
TEAM_2_3 = another_team_in_packed_format
```
there will be a 3/4 chance of selecting TEAM_2

### Overview
|key|value|
|-|-|
|SHOWDOWNNAME|pokemon showdown username|
|PASSWORD|pokemon showdown password|
|TERA| which pokemon will be terastallized, the first or the second one  |
|AVATAR| number or name of the avatar|
|STATUS| status that is shown on your playercard|
|SEARCH| search on the ladder or a private battle against the given username  |
|PRIVATE_CHALLENGE| will the bot accept gen9metronome battle requests  |
|TEAM_N| a team that will be used  |
|PSA| String to send in chat on the first ever battle between you and the other trainer|
|PRIVATE_CHALLENGE| reject or ignore or accept a private challenge|
|PRIVATE_CHALLENGE_REJECT_MESSAGE| message sent when private challenges are rejected|

## usage
The bot can ladder, challenge specific trainers or just wait for challenges.  
To play on the ladder or challenge specific trainer modify `.env`  
To wait for challenges pass -p or --passiv (or a non numeric value) as an argument.  
Challenges are ignored by default. To enable it modify `.env`  
```bash 
node metro.js [number_of_battle | -p --passiv]
```