<?php
require('apiKey.php');

//Games we play a lot
define("KILLING_FLOOR", 1250);
define("PAYDAY", 24240);
define("PAYDAY2", 218620);

//Steam ID lookup service: http://steamid.co/
$mumblol = array(
    "Glorax" =>         array("steam32id" => "STEAM_0:1:16523708",  "steam64id" => "76561197993313145"),
    "Deagle" =>         array("steam32id" => "STEAM_0:1:5024477",   "steam64id" => "76561197970314683"),
    "Oten" =>           array("steam32id" => "STEAM_0:1:15693452",  "steam64id" => "76561197991652633"),
    "Fargi" =>          array("steam32id" => "STEAM_0:0:27471211",  "steam64id" => "76561198015208150"),
    "funkylobster" =>   array("steam32id" => "STEAM_0:0:31660345",  "steam64id" => "76561198023586418"),
    "Moof" =>           array("steam32id" => "STEAM_0:0:3172837",   "steam64id" => "76561197966611402"),
    "Scibs" =>          array("steam32id" => "STEAM_0:1:23091575",  "steam64id" => "76561198006448879"),
    "Phrosty" =>        array("steam32id" => "STEAM_0:0:11257",     "steam64id" => "76561197960288242"),
    "Balthazar" =>      array("steam32id" => "STEAM_0:0:18255024",  "steam64id" => "76561197996775776"),
    "Pixelation" =>     array("steam32id" => "STEAM_0:1:24785854",  "steam64id" => "76561198009837437"),
    "Banana" =>         array("steam32id" => "STEAM_0:1:16482649",  "steam64id" => "76561197993231027"),
    "Bukkithead" =>     array("steam32id" => "STEAM_0:1:27314902",  "steam64id" => "76561198014895533"),
    "Chuffy" =>         array("steam32id" => "STEAM_0:1:6196171",   "steam64id" => "76561197972658071"),
    "Master" =>         array("steam32id" => "STEAM_0:1:18275239",  "steam64id" => "76561197996816207"),
    "Joe" =>            array("steam32id" => "STEAM_0:0:19328158",  "steam64id" => "76561197998922044"),
    "Kaiser" =>         array("steam32id" => "STEAM_0:0:17778159",  "steam64id" => "76561197995822046")
);

if (empty($_GET['offline'])) {
    $response = @file_get_contents(getGameAchievements(PAYDAY2));
    $players = array_keys($mumblol);
    $json = json_decode($response, true);
    $achievements = json_decode($json, true);
    $rawAchievements = $json['achievementpercentages']['achievements'];
    usort($rawAchievements, function($a, $b) {
        return strcasecmp($a['name'], $b['name']);
    });

    foreach ($rawAchievements as $achievement) {
        $achievements[$achievement['name']] = array('percent' => $achievement['percent']);
    }

    foreach ($mumblol as $name => $id) {
        $response = @file_get_contents(getPlayerAchievements(PAYDAY2, $id['steam64id']));
        if (!$response) {
            unset($mumblol[$name]);
            continue;
        }

        $json = json_decode($response, true);
        $playerAchievements = $json['playerstats']['achievements'];

        foreach ($playerAchievements as $achievement) {
            if ($achievement['achieved']) $achievements[$achievement['apiname']]['earned'][] = $name;
            else $achievements[$achievement['apiname']]['unearned'][] = $name;

            if (!isset($achievements[$achievement['apiname']]['name'])) $achievements[$achievement['apiname']]['name'] = $achievement['name'];
            if (!isset($achievements[$achievement['apiname']]['description'])) $achievements[$achievement['apiname']]['description'] = $achievement['description'];
        }

        usleep(100000);
    }
} else {
    include('testData.php');
}

//web API HTML docs: https://developer.valvesoftware.com/wiki/Steam_Web_API
//web API function list: http://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v0001/
//full app list: http://api.steampowered.com/ISteamApps/GetAppList/v0002/
function getGameAchievements($app) {
    return "http://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid={$app}";
}
function getPlayerAchievements($app, $steamid) {
    return "http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid={$app}&key=" . API_KEY . "&steamid={$steamid}&l=en";
}
function getPlayerStats($app, $steamid) {
    return "http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid={$app}&key=" . API_KEY . "&steamid={$steamid}&l=en";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Mumble Crew Steam Achievement Check</title>
    <meta charset="utf-8" />

    <link rel="stylesheet" type="text/css" href="main.css" />

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>

    <script src="//mottie.github.io/tablesorter/js/jquery.tablesorter.js"></script>
    <link rel="stylesheet" type="text/css" href="//mottie.github.io/tablesorter/css/theme.grey.css" />

    <script src="//raw.github.com/Sjeiti/TinySort/master/src/jquery.tinysort.js"></script>

    <script src="main.js"></script>

    <script>
        var achievements = <?=json_encode($achievements);?>;
        var players = <?=json_encode($players);?>;
    </script>
</head>
<body>
<div id="filters">
    <div>
        <p>Show only:</p>
        <form id="playerFilter"></form>
    </div>
    <div>
        <p>Show achievements:</p>
        <form id="earnedUnearnedFilter">
            <input type="checkbox" value="earned" id="earnedFilter" />
            <label for="earnedFilter">Earned</label><br />

            <input type="checkbox" value="unearned" id="unearnedFilter" />
            <label for="unearnedFilter">Unearned</label>
        </select>
    </div>
    <div>
            <input type="button" value="Filter" id="runFilter" />
    </div>
</div>
<table id="mainTable">
    <thead>
        <tr>
            <td>Achievement</td>
            <td>Players</td>
            <td>Global %</td>
        </tr>
    </thead>
    <tbody/>
</table>
</body>
</html>

