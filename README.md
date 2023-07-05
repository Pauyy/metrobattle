# MetroBattle
A PokemonShowdown Bot that plays metronome battles.  
Complete traffic is logged to debug.log  
and the great thing, all of it just works  
yes, it works. It, it actually works perfectly.  
(except when pokemonshowdown restarts)  

## procedure
- logs in
- sets avatar (if defined in .env)
- searches for gen9metronomebattle
- chooses metronome every turn
- finishes battle
- repeats until passed number of battles were played
the entire communication is logged to `debug.log`


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
AVATAR= your_avatar
TEAM= your_team_in_packed_format
```

## usage
```bash 
node metro.js <number_of_battle>
```