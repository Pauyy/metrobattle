# MetroBattle
A PokemonShowdown Bot that plays metronome battles.
Complete traffic is logged to debug.log

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
rename .env.example to .env and fill in your data

## usage
```bash 
node metro.js <number_of_battle>
```