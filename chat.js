function answerChatMessage(message){
	if(["gg", "Gg", "GG", "Ggs", "ggs"].includes(message)){
		return "wp";
	} else if(/^good luck/.test(message.toLowerCase()) || message.toLowerCase() == "gl"){
		return "have fun";
	} else if(/^have fun/.test(message.toLowerCase()) || message.toLowerCase() == "hf"){
		return "good luck";
	}
	return "";
}


module.exports = { answerChatMessage };