var express = require('express');
var router = express.Router();
var request = require('request');
var bodyParser = require('body-parser');
var async = require('async');
var router = express.Router();
var app = express();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:false}));

var firebase = require('firebase').initializeApp({
  serviceAccount: "./firebase/firebase-service-account.json",
  databaseURL: "https://stats-tracker-league.firebaseio.com/"
});

var ref = firebase.database().ref().child('node-client');
var logsRef = ref.child('logs');
var messagesRef = ref.child('messages');
//var messageRef = messagesRef.push(message);

var host = 'https://na1.api.riotgames.com/lol/';
var getIdUrl = 'summoner/v3/summoners/by-name/';
var getMatchListUrl = 'match/v3/matchlists/by-account/';
var getMatchesUrl = 'match/v3/matches/'
var getRankLpUrl = 'league/v3/leagues/by-summoner/';
var getSpectator = '/spectator/v3/active-games/by-summoner/';
var apiKey = '?api_key=RGAPI-eae074dc-6df2-4306-b8e4-4780c6a8e38f';

var matchInfo;

var getCurrentGame = function(matches, summonerId, callback){
  request(host + getSpectator + summonerId + apiKey, function(error, response, body){
    if(!error && response.statusCode == 200){
      var inGame = true;
      if(JSON.parse(body) == null){
        inGame = false;
      }
    }
    callback(null, summonerId, inGame, matches);
  })
}

var getCurrentGameRefresh = function(summonerId, callback){
  request(host + getSpectator + summonerId + apiKey, function(error, response, body){
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
    }
    else{
      console.log(error);
    }
    callback(null, summonerId, recentMatches);
  });
}

var getRankLp = function(summonerId, inGame, matches,callback){
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
      callback(null,rank,tier,lp,inGame, matches);
    }
    else{
      console.log(error);
    }
  });
}


var getMatches = function(summonerId, matchList, callback){
  var matches = [];
  for(i = 0; i < matchList.length; i++){
    request(host + getMatchesUrl + matchList[i] + apiKey, function(error, response, body){
      if(!error && response.statusCode == 200){
        var info = JSON.parse(body);
        var playerIdentity;

        for(j = 0; j < 10; j++){
          if(info["participantIdentities"][j]["player"]["summonerId"] == summonerId){
            playerIdentity = j;

            var match = {
              kills: info["participants"][j]["stats"]["kills"],
              assists: info["participants"][j]["stats"]["assists"],
              deaths: info["participants"][j]["stats"]["deaths"]
            }
            matches.push(match);
            if(matches.length == matchList.length){
              callback(null, matches, summonerId);
            }
          }
        }
      }
      else{
        console.log(error);
      }
    })
  }

}

var getSummonerId = function(summonerName, callback){
  request(host + getIdUrl + summonerName + apiKey, function(error, response, body){
      if(!error && response.statusCode == 200){
        info = JSON.parse(body);
        summonerId = info.id;
        ref.push(summonerId);
        callback(null,info.id,info.accountId);
      }
      else{
        console.log(error);
      }
    });
}


router.post('/', (req, res, next) => {
  var user = req.body.name;
  async.waterfall([
    function(callback){
      callback(null, user);
    },
    getSummonerId,
    getMatchList,
    getMatches,
    getCurrentGame,
    getRankLp,
    function(rank,tier,lp, inGame, matches, callback){
      var currentGame = "";
      if(inGame){
        currentGame = "Currently in Game";
      }
      else{
        currentGame = "Not in game";
      }
      res.render('rank',{title: 'Rank', inGame : currentGame, rank : rank, tier : tier, lp: lp, summonerName: user, matches:matches});
      callback(null, 'done');
    }
  ],
  function(err, string){
    console.log(string);
  });
});

router.post('/refresh', (req,res,next) => {
  var user = req.body.summonerName;
  async.waterfall([
    function(callback){
      callback(null,user);
    },
    getCurrentGameRefresh,
    function(summonerId, inGame,callback){
      if(inGame){
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ a: "Currently in game" }));
      }
      else{
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ a: "Not in game" }));
      }
      callback(null,'done');
    }
  ],
  function(err, string){
    console.log(string);
  });
});


module.exports = router;
