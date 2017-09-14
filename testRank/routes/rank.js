var express = require('express');
var router = express.Router();
var request = require('request');
var bodyParser = require('body-parser');
var async = require('async');
var router = express.Router();
var app = express();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));

var host = 'https://na1.api.riotgames.com/lol/';
var getIdUrl = 'summoner/v3/summoners/by-name/';
var getMatchListUrl = 'match/v3/matchlists/by-account/';
var getRankLpUrl = 'league/v3/leagues/by-summoner/';
var getSpectator = '/spectator/v3/active-games/by-summoner/';
var apiKey = '?api_key=RGAPI-b458ec80-adff-41b8-abcd-774f17b68039';

var summonerId;
var matchInfo;

var getCurrentGame = function(summonerId, callback){
  request(host + getSpectator + summonerId + apiKey, function(error, response, body){
    console.log(summonerId);
    if(!error && response.statusCode == 200){
      var inGame = true;
      if(JSON.parse(body) == null){
        inGame = false;
      }
    }

    callback(null, summonerId, inGame);
  })
}

var getMatchList = function(summonerId, accountId,callback) {
  request(host + getMatchListUrl + accountId + "/recent" + apiKey, function(error, response, body){
    if(!error && response.statusCode == 200){
      var matchInfo = JSON.parse(body);
      var matches = matchInfo["matches"];
      var today = new Date().getTime();
      var recentMatches = [];
      for(var i = 0; i < 20; i++){
        if((today - matches[i]["timestamp"]) / 86400000 <= 7)
          recentMatches.push(matches[i]["gameId"]);
      }
      console.log(recentMatches);
    }
    else{
      console.log(error);
    }
    callback(null, summonerId);
  });
}

var getRankLp = function(summonerId, inGame, callback){
  request(host + getRankLpUrl + summonerId + apiKey, function(error, response, body){
    if(!error && response.statusCode == 200){
      var playerInfo = JSON.parse(body);
      //console.log(playerInfo);
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
      callback(null,rank,tier,lp,inGame);
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
        summonerId = info.id;
        callback(null,info.id,info.accountId);
      }
      else{
        console.log(error);
      }
    });
}


router.post('/', (req, res, next) => {
  var user = req.body.name;
  console.log(user);
  async.waterfall([
    function(callback){
      callback(null, user);
    },
    getSummonerId,
    getMatchList,
    getCurrentGame,
    getRankLp,
    function(rank,tier,lp, inGame,callback){
      var currentGame = "";
      if(inGame){
        currentGame = "Currently in Game";
      }
      else{
        currentGame = "Not in game";
      }
      res.render('rank',{title: 'Rank', inGame : currentGame, rank : rank, tier : tier, lp: lp, summonerName: user});
      callback(null, 'done');
    }
  ],
  function(err, string){
    console.log(string);
  });
});

router.get('/', (req,res,next) => {
  var user = summonerId;
  async.waterfall([
    function(callback){
      callback(null,user);
    },
    getCurrentGame,
    function(summonerId, inGame,callback){
      if(inGame){
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ a: "Currently in game" }));
      }
      else{
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ a: "Not in game" }));
      }
    }
  ],
  function(err, string){
    console.log(string);
  });
});


module.exports = router;
