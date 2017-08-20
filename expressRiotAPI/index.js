var express = require('express');
var readline = require('readline');
var request = require('request');
var app = express();

var host = 'https://na1.api.riotgames.com/lol/'
var getIdUrl = 'summoner/v3/summoners/by-name/'
var getMatchListUrl = 'match/v3/matchlists/by-account/'
var apiKey = '?api_key=RGAPI-7a836ef2-9df4-40e9-8fa6-115b56af4828';

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var matchInfo;

var getMatchList = function(summonerId, callback) {
  request(host + getMatchListUrl + summonerId + apiKey, function(error, response, body){
    if(!error && response.statusCode == 200){
      var matchInfo = JSON.parse(body);
      console.log(matchInfo);
    }
    else{
      console.log(error);
    }
  });
}

var getSummonerId = function(summonerName, callback){
  request(host + getIdUrl + summonerName + apiKey, function(error, response, body){
      if(!error && response.statusCode == 200){
        info = JSON.parse(body);
        callback(info.accountId);
      }
      else{
        console.log(error);
      }
    });
}

rl.question("Input Summoner Name: ", (answer) => {
  getSummonerId(answer, getMatchList);
});


/*
app.get('/', (req, res) => {
  res.send(matchInfo);
});

app.listen(8000);
*/
