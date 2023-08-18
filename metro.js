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
const pokemon_to_tera = process.env.TERA;
const search = process.env.SEARCH == undefined ? "ladder" : process.env.SEARCH;
const team = []

if(process.env.TEAM != undefined){
	team.push(process.env.TEAM);
} else {
	for (const key in process.env) {
		if (key.startsWith('TEAM_')) {
			const index = key.lastIndexOf('_') + 1; //last index of _ behind the first one ofcourse
			const number_of = parseInt(key.substring(index));
			if(!isNaN(number_of) && index > 5){ //if index smaller than 5 it got the first _
				for(let i = 0; i < number_of; i++){
					team.push(process.env[key]);
				}
			} else {
				team.push(process.env[key]);
			}
		}
	}
}

if(team.length == 0){
	console.log("\x1b[31m|Metro Error|\x1b[0mNo Team provided. Check .env File and Readme")
	process.exit(1);
}


class Battle{
	playerNumber = "p";
	id = null;
	constructor(){
		this.playerNumber = "p";
		this.id = null;
		this.alive = [true, true];
		this.tera = false;
		this.running = false; //is a battle currently running
		this.team_id = 0;
	}
	reset(){
		this.alive[0] = true;
		this.alive[1] = true;
		this.id = null;
		this.playerNumber = null;
		this.tera = false;
		this.running = false;
		this.team_id = 0;
	}
}
let b = new Battle();

function setRandomTeam(){
	const team_id = Math.floor(Math.random() * team.length);
	b.team_id = team_id;
	ws.send(`|/utm ${team[team_id]}`);
	const selected_team = team[team_id].split("]");
	const pokemon1 = selected_team[0].substring(0, selected_team[0].indexOf("|"));
	const pokemon2 = selected_team[1].substring(0, selected_team[1].indexOf("|"));

	console.log("Next Team: " + pokemon1 + " " + pokemon2);
}

function searchBattle(){
	const date_ob = new Date();
	if(date_ob.getHours() < 16 && search == "ladder"){
		setTimeout(searchBattle, 600000);
		return;
	}
	setRandomTeam();
	if(search == "ladder")
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
	const t1 = !b.tera && pokemon_to_tera == 1 ? "terastallize" : "";
	const t2 = !b.tera && pokemon_to_tera == 2 ? "terastallize" : "";
	const pokemon1 = b.alive[0] ? "move 1" : "pass";
	const pokemon2 = b.alive[1] ? "move 1" : "pass";
	//console.log(`${b.id}|/choose ${pokemon1} ${t1}, ${pokemon2} ${t2}`);
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
	const bid = b.id;
	b.reset();
	numOfBattlesCounter++;
	console.log("Battle " + numOfBattlesCounter + " out of " + numOfBattles);
	if(numOfBattles > numOfBattlesCounter){
		setTimeout((bid) => ws.send(`|/leave ${bid}`),10000, bid); //wait 10 secondes before leaving the room
		setTimeout(searchBattle, search == "ladder" ? 300000 : 0);
	} else {
		console.log("All Battles done");
		//Wait 3 Seconds to let the Script finish every message coming after the last win
		setTimeout(process.exit, 3000, 0);
	}
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


function handlePopUp(action){
	if(/The user .* was not found./.test(action[2])){
		console.log("\x1b[32m|Metro Hotfix|\x1b[0mRetry sending a request in 10 seconds");
		setTimeout(searchBattle, 10000);
	} else if (action[2] == "Your team was rejected for the following reasons:"){
		console.log("\x1b[32m|Metro Hotfix|\x1b[0mRemove this Team from the pool of available Teams and try again");
		team.splice(b.team_id, 1);
		if(team.length == 0){
			console.log("\x1b[31m|Metro Error|\x1b[0mNo legal Team remains");
			console.log("Abort");
			process.exit(0);
		}
		searchBattle();
	} else if (/You challenged less than 10 seconds after your last challenge!.*/.test(action[2])){
		console.log("\x1b[31m|Metro Hotfix|\x1b[0mRetry sending a request in 5 seconds");
		setTimeout(searchBattle, 5000);
	}
	
}

function handleError(action){
	if(/[Invalid choice] Can't move: .* can't Terastallize./.test(action[2])){
		console.log("\x1b[31m|Metro Hotfix|\x1b[0mPretend we terastallized and attack again")
		b.tera = true;
		attack();
	}
}

function handlePrivateMessage(action){
	//console.log(action);
	//substring(1) because it has a trailing space
	if(action[2].substring(1) === username) //if it is a message we send ourself we ignore it
		return;

	if(action[4].startsWith("/challenge")) {
		if(action[4].substring(11) === "gen9metronomebattle"){
			setRandomTeam();
			ws.send(`|/accept ${action[2]}`);
		} else {
			ws.send(`|/pm ${action[2]}, Sorry, I only play gen9metronomebattle`)
			ws.send(`|/reject ${action[2]}`)
		}
	}

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
		finishBattle(); //finish battle resets battle, wich in turn sets running false
	} else if(action[1] === "updatesearch"){
		startBattle(action);
	} else if(action[1] === "init"){
		startTimer();
		b.running = true;
	} else if(action[1] === "player"){
		handlePlayer(action);
	} else if(action[1] === "raw"){
		console.log(action[2]);
	} else if(action[1] === "title"){
		console.log(action[2]);
	} else if(action[1] === "nametaken") {
		console.log(data.toString())
		process.exit(-1);
	} else if(action[1] === "popup") {
		console.log("\x1b[31m|Showdown Popup|\x1b[0m", action.slice(2).join());
		handlePopUp(action)
	} else if(action[1] === "error"){
		console.log("\x1b[31m|Showdown Error|\x1b[0m", action.slice(2).join());
		handleError(action)
	} else if(action[1] === "pm"){
		handlePrivateMessage(action);
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
