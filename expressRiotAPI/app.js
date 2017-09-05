var express = require('express');
var readline = require('readline');
var request = require('request');
var bodyParser = require('body-parser');
var where = require('lodash.where');
var async = require('async');
var router = express.Router();
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

var host = 'https://na1.api.riotgames.com/lol/';
var getIdUrl = 'summoner/v3/summoners/by-name/';
var getMatchListUrl = 'match/v3/matchlists/by-account/';
var getRankLpUrl = 'league/v3/leagues/by-summoner/';
var apiKey = '?api_key=RGAPI-aa43a194-b04c-4133-ac09-7cddfa3e48d7';


var matchInfo;

var getMatchList = function(summonerId, callback) {
  console.log(host + getMatchListUrl + summonerId + apiKey);
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

var getRankLp = function(summonerId, callback){
  request(host + getRankLpUrl + summonerId + apiKey, function(error, response, body){
    if(!error && response.statusCode == 200){
      var playerInfo = JSON.parse(body);
      var leagueInfo;

      if(playerInfo[0]["queue"] == "RANKED_SOLO_5x5"){
        leagueInfo = playerInfo[0];
      }
      else{
        leagueInfo = playerInfo[1];
      }

      var tier = leagueInfo.tier;
      var players = leagueInfo.entries;
      var player = players.filter(function(o){
        return o["playerOrTeamId"] == summonerId;
      });
      var rank = player[0].rank;
      var lp = player[0].leaguePoints;
      console.log(rank + lp + tier);
      callback(null,rank,tier,lp);
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
        console.log(info.id);
        callback(null,info.id);
      }
      else{
        console.log(error);
      }
    });
}




app.get('/', (req,res) => {
  res.sendFile(__dirname + "/input.html");
});

app.post('/rank', (req, res) => {
  var user = req.body.name;
  async.waterfall([
    function(callback){
      callback(null, user);
    },
    getSummonerId,
    getRankLp,
    function(rank,tier,lp,callback){
      res.send(tier + " " + rank + " " + lp +"LP");
      callback(null, 'done');
    }
  ],
  function(err, string){
    console.log(string);
  });
});




app.listen(3000);
