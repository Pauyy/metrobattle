# MetroBattle
A PokemonShowdown Bot that plays metronome battles.  
Complete traffic is logged to debug.log  
and the great thing, all of it just works  
yes, it works. It, it actually works perfectly.  
(except when pokemonshowdown restarts)  

## procedure
- logs in
- sets avatar (if defined in .env)
- chooses random team (if more than one is provided)
- searches for gen9metronomebattle
- chooses metronome every turn
- finishes battle
- repeats until passed number of battles were played

## output
Every* message the script recives is logged to a file called `debug.log`  
successful login and WebSocket connection as well as first search are printed to stdout  
the start and end of the battle, chosen moves and faints are also printed to stdout  
  
*There are messages prefixed "request", they are ignored  

## Setup
```bash 
npm install
```  
Configure .env
```
rename .env.example .env
```

## .env
```
SHOWDOWNNAME= your_showdown_username
PASSWORD= your_password
AVATAR= your_avatar [optional]
TERA = 1 or 2 [optional]
SEARCH = ladder or username [optional]
TEAM_1 = your_team_in_packed_format
TEAM_2 = another_team_in_packed_format [optional]
TEAM_N = any_aother_amount_of_packed_teams [optional]
```
TERA determines which pokemon will be terastallized, the first or the second one  
Mega-Pokemon can't be terastallized, if you try, the script won't fail anymore :)
SEARCH determines if you will play on the ladder or a private battle against the given username
TEAM_N determines the number of available teams to be selected randomly as used teams for every battle
## usage
```bash 
node metro.js <number_of_battle>
```