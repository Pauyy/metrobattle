require('dotenv').config();
const chat = require('./chat');
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
const teraPokemon = process.env.TERA;
const search = process.env.SEARCH;

class Battle{
	playerNumber = "p";
	id = null;
	constructor(){
		this.playerNumber = "p";
		this.id = null;
		this.alive = [true, true];
		this.tera = false;
	}
	reset(){
		this.alive[0] = true;
		this.alive[1] = true;
		this.id = null;
		this.playerNumber = null;
		this.tera = false;
	}
}
let b = new Battle();

function searchBattle(){
	ws.send(`|/utm ${team}`);
	if(search == undefined || search == "ladder")
		ws.send("|/search gen9metronomebattle");
	else
		ws.send(`|/challenge ${search}, gen9metronomebattle`);
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
			if(process.env.AVATAR != undefined)
				ws.send(`|/avatar ${process.env.AVATAR}`);
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
	const t1 = !b.tera && teraPokemon == 1 ? "terastallize" : "";
	const t2 = !b.tera && teraPokemon == 2 ? "terastallize" : "";
	const pokemon1 = b.alive[0] ? "move 1" : "pass";
	const pokemon2 = b.alive[1] ? "move 1" : "pass";
	console.log(`${b.id}|/choose ${pokemon1} ${t1}, ${pokemon2} ${t2}`);
	ws.send(`${b.id}|/choose ${pokemon1} ${t1}, ${pokemon2} ${t2}`);
	if(!b.tera)
		b.tera = true;
}

function updateFaint(action){
	if(action[2].substring(0,2) === b.playerNumber){
		if(action[2].substring(2,3) === "a"){
			b.alive[0] = false;
		} else {
			b.alive[1] = false;
		} 
	}
	console.log(action[1], action[2]);
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
	if(j.games != null){
		b.id = Object.keys(j['games']).pop();
	}
}

function startTimer(){
	ws.send(`${b.id}|/timer on`);
}

function handleChatMessage(action){
	if(action[2] == `☆${username}`)
		return;
	const message = chat.answerChatMessage(action[3]);
	if(message == "")
		return;
	ws.send(`${b.id}|${message}`);
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
	} else if(action[1] === "init"){
		startTimer();
	} else if(action[1] === "player"){
		handlePlayer(action);
	} else if(action[1] === "raw"){
		console.log(action[2]);
	} else if(action[1] === "title"){
		console.log(action[2]);
	} else if(action[1] === "c"){
		handleChatMessage(action);
	} else if(action[1] === "nametaken") {
		console.log(data.toString())
		process.exit(-1);
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
