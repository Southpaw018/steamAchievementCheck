<?php
require('apiKey.php');

define('OFFLINE_FILE', 'testData.php');

//Games we play a lot
define("KILLING_FLOOR", 1250);
define("PAYDAY", 24240);
define("PAYDAY2", 218620);

//Steam ID lookup service: http://steamid.co/
$players = array(
    '76561197993313145' => 'Glorax',
    '76561197970314683' => 'Deagle',
    '76561197991652633' => 'Oten',
    '76561198015208150' => 'Fargi',
    '76561197966611402' => 'Moof',
    '76561198006448879' => 'Scibs',
    '76561197993231027' => 'Banana',
    '76561198014895533' => 'Bukkithead',
    '76561197972658071' => 'Chuffy',
    '76561197996816207' => 'Master',
    '76561197998922044' => 'Joe',
);

uasort($players, function($a, $b) {
    if ($a === $b) return 0;
    return $a < $b ? -1 : 1;
});

if (empty($_GET['offline']) && (!empty($_GET['nocache']) || filemtime(OFFLINE_FILE) + 300 < time())) {
    $app = isset($_GET['app']) ? $_GET['app'] : PAYDAY2;

    $response = @file_get_contents(getGameAchievements($app));
    $json = json_decode($response, true);
    $rawAchievements = $json['achievementpercentages']['achievements'];
    usort($rawAchievements, function($a, $b) {
        return strcasecmp($a['name'], $b['name']);
    });

    $achievements = array();
    foreach ($rawAchievements as $achievement) {
        $achievements[$achievement['name']] = array('percent' => $achievement['percent']);
    }

    foreach ($players as $id => $name) {
        $response = @file_get_contents(getPlayerAchievements($app, $id));
        if (!$response) {
            unset($players[$id]);
            continue;
        }

        $json = json_decode($response, true);
        $playerAchievements = $json['playerstats']['achievements'];

        foreach ($playerAchievements as $achievement) {
            $achData = &$achievements[$achievement['apiname']];
            $achData[$achievement['achieved'] ? 'earned' : 'unearned'][] = (string) $id;

            if (!isset($achData['name'])) $achData['name'] = $achievement['name'];
            if (!isset($achData['description'])) $achData['description'] = $achievement['description'];
        }

        usleep(100000);
    }

    // Update offline file
    $offline_data = array('achievements' => $achievements, 'players' => $players);
    file_put_contents(OFFLINE_FILE, serialize($offline_data));
} else {
    $offline_data = unserialize(file_get_contents(OFFLINE_FILE));
    foreach ($offline_data as $var => $value) {
        $$var = $value;
    }
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
        <section class="main">
            <form class="filters">
                <fieldset>
                    <legend>Show players</legend>
                    <ul id="playerFilter" class="playerFilter">
                        <li>
                            <input type="checkbox" id="toggleAllPlayers" checked />
                            <label for="toggleAllPlayers">All</label>
                        </li>
                    </ul>
                </fieldset>
                <fieldset>
                    <legend>Show achievements</legend>
                    <ul id="earnedUnearnedFilter">
                        <li>
                            <input type="checkbox" value="earned" id="earnedFilter" checked />
                            <label for="earnedFilter">Earned</label>
                        </li>
                        <li>
                            <input type="checkbox" value="unearned" id="unearnedFilter" checked />
                            <label for="unearnedFilter">Unearned</label>
                        </li>
                    </ul>
                </fieldset>
            </form>
            <table id="mainTable" class="mainTable">
                <thead>
                    <tr>
                        <th>Achievement</th>
                        <th>Players</th>
                        <th>Global %</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </section>
    </body>
</html>

