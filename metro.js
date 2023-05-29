require('dotenv').config();
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const util = require('util');
const log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
console.log_f = function(d) {
  log_file.write(util.format(d) + '\n');
};
// etsablish websocket-connection
const ws = new WebSocket('ws://sim.smogon.com:80/showdown/websocket');
const numOfBattles = process.argv[2] == null ? 1 : process.argv[2]; 
let numOfBattlesCounter = 0;
const username = process.env.SHOWDOWNNAME;
const team = process.env.TEAM;

class Battle{
	playerNumber = "p";
	id = null;
	constructor(){
		this.playerNumber = "p";
		this.id = null;
		this.alive = [true, true];
	}
	reset(){
		this.alive[0] = true;
		this.alive[1] = true;
		this.id = null;
		this.playerNumber = null;
	}
}
let b = new Battle();

function searchBattle(){
	ws.send(`|/utm ${team}`);
	ws.send("|/search gen9metronomebattle");
}

function login(challstr){
	const postData = JSON.stringify({
		act: 'login',
		name: `${username}`,
		pass: process.env.PASSWORD,
		challstr: '4|' + challstr
	});

	const options = {
		hostname: 'play.pokemonshowdown.com',
		port: 443,
		path: '/api/login',
		method: 'POST',
		headers: {
		'Content-Type': 'application/json',
		'Content-Length': postData.length
		}
	};
	
	const req = https.request(options, (res) => {
		console.log(`Statuscode: ${res.statusCode}`);
		if(res.statusCode != 200)
			return;
		
		let answer ='';
		res.on('data', (chunk) => {
			answer += chunk;
			});
		res.on('end', () => {
			answer = answer.substring(1);
			answer = JSON.parse(answer);
			ws.send(`|/trn ${username},0,` + answer.assertion);
			console.log("Searching");
			searchBattle();
		});
	});
	
	req.on('error', (error) => {
		console.error('Error:', error);
	});

	req.write(postData);
	req.end();
}

function attack(){
	const pokemon1 = b.alive[0] ? "move 1" : "pass";
	const pokemon2 = b.alive[1] ? "move 1" : "pass";
	console.log(`${b.id}|/choose ${pokemon1}, ${pokemon2}`);
	ws.send(`${b.id}|/choose ${pokemon1}, ${pokemon2}`);
}

function updateFaint(action){
	if(action[2].substring(0,2) === b.playerNumber){
		if(action[2].substring(2,3) === "a"){
			b.alive[0] = false;
		} else {
			b.alive[1] = false;
		} 
	}
	console.log(JSON.stringify(action));
}

function finishBattle(){
	b.reset();
	numOfBattlesCounter++;
	console.log("Battle " + numOfBattlesCounter + " out of " + numOfBattles);
	if(numOfBattles > numOfBattlesCounter)
		searchBattle();
}

function handlePlayer(action){ 
	if(action[3] === `${username}`){
		b.playerNumber = action[2];
	}
}

function startBattle(action){
	const j = JSON.parse(action[2]);
	if(j.games != null)
		b.id = Object.keys(j['games']).pop();
}

function handleMessage(data){
	action = data.toString().split("|");
	  if(action[0].substring(0,1) === ">"){
		  b.id = action[0].substring(1);
	  } else if(action[1] === "challstr"){
		login(action[3])
	  } else if(action[1] === "turn"){
		  attack();
	  } else if(action[1] === "faint"){
		  updateFaint(action);
	  } else if(action[1] === "win"){
		  finishBattle();
	  } else if(action[1] === "updatesearch"){
		  startBattle(action);
	  } else if(action[1] === "player"){
		  handlePlayer(action);
	  } else if(action[1] === "raw"){
		  console.log(JSON.stringify(action));
	  }
	  if(action[1] !== "request")
		console.log_f(data.toString()); 
}

// connection established
ws.on('open', () => {
  console.log('connection established.');
});

// got message
ws.on('message', (data) => {
    data.toString().split(/\r?\n/).forEach((action) => handleMessage(action));
});

// connection closed
ws.on('close', () => {
  console.log('connection closed.');
});
