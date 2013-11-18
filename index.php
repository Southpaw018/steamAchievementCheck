<?php
$phpStartTime = microtime(true);

require('apiKey.php');

define('CACHE_DIR', 'cache/');
define('CACHE_TTL', 300);

//Games we play a lot
define("KILLING_FLOOR", 1250);
define("PAYDAY", 24240);
define("PAYDAY2", 218620);

$errors = array();

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
    '76561197986608136' => 'Dagordae',
);

uasort($players, function($a, $b) {
    if ($a === $b) return 0;
    return $a < $b ? -1 : 1;
});

$app = isset($_GET['app']) ? $_GET['app'] : PAYDAY2;

$response = getGameAchievements($app);
if (!apiSucceeded()) $errors[] = "Failure getting global achievement stats. Aborting.";

$rawAchievements = $response['achievementpercentages']['achievements'];
usort($rawAchievements, function($a, $b) { return strcasecmp($a['name'], $b['name']); });

$achievements = array();
foreach ($rawAchievements as $achievement) {
    $achievements[$achievement['name']] = array('percent' => $achievement['percent']);
}

foreach ($players as $id => $name) {
    $response = getPlayerAchievements($app, $id);
    if (!apiSucceeded()) {
        $errors[] = "Failure getting achievements for {$name}. Continuing to process.";
        continue;
    }

    $playerAchievements = $response['playerstats']['achievements'];

    foreach ($playerAchievements as $achievement) {
        $achData = &$achievements[$achievement['apiname']];
        $achData[$achievement['achieved'] ? 'earned' : 'unearned'][] = (string) $id;

        if (!isset($achData['name'])) $achData['name'] = $achievement['name'];
        if (!isset($achData['description'])) $achData['description'] = $achievement['description'];
    }

    usleep(100000);
}

//web API HTML docs: https://developer.valvesoftware.com/wiki/Steam_Web_API
//web API function list: http://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v0001/
//full app list: http://api.steampowered.com/ISteamApps/GetAppList/v0002/
function getApiResponse($path, $app, $steamid = '') {
    global $_api_success;

    $cachePath = getCachePath($app, $steamid);
    if (useCache($cachePath)) {
        $_api_success = true;
        return json_decode(file_get_contents($cachePath), true);
    }

    $response = file_get_contents("http://api.steampowered.com/{$path}");
    if ($response === false) {
        $_api_success = false;
    } else {
        $_api_success = true;
        file_put_contents($cachePath, preg_replace('/([^\n])?$/', "$1\n", $response));
    }
    return json_decode($response, true);
}
function apiSucceeded() {
    global $_api_success;
    return $_api_success;
}

function getGameAchievements($app) {
    return getApiResponse("ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid={$app}", $app);
}
function getPlayerAchievements($app, $steamid) {
    return getApiResponse("ISteamUserStats/GetPlayerAchievements/v0001/?appid={$app}&key=" . API_KEY . "&steamid={$steamid}&l=en", $app, $steamid);
}
function getPlayerStats($app, $steamid) {
    return getApiResponse("ISteamUserStats/GetUserStatsForGame/v0002/?appid={$app}&key=" . API_KEY . "&steamid={$steamid}&l=en", $app, $steamid);
}

function useCache($path) {
    if (!empty($_GET['offline'])) {
        return file_exists($path);
    }

    if (!empty($_GET['nocache'])) {
        return false;
    }

    return file_exists($path) && filemtime($path) + CACHE_TTL > time();
}
function getCachePath($app, $steamid) {
    return CACHE_DIR . "{$app}_{$steamid}.json";
}

$phpEndTime = microtime(true);
$phpExecutionTime = $phpEndTime - $phpStartTime;
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <script>var javascriptStartTime = new Date().getTime();</script>
        <title>Mumble Crew Steam Achievement Check</title>
        <meta charset="utf-8" />

        <link rel="stylesheet" type="text/css" href="flash.css" />
        <link rel="stylesheet" type="text/css" href="main.css" />

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>

        <script src="//mottie.github.io/tablesorter/js/jquery.tablesorter.js"></script>
        <link rel="stylesheet" type="text/css" href="//mottie.github.io/tablesorter/css/theme.grey.css" />

        <script src="//raw.github.com/Sjeiti/TinySort/master/src/jquery.tinysort.js"></script>

        <script src="main.js"></script>

        <script>
            var achievements = <?=json_encode($achievements);?>;
            var players = <?=json_encode($players);?>;
            var errors = <?=json_encode($errors);?>;
            var phpExecutionTime = <?=$phpExecutionTime;?>;
        </script>
    </head>
    <body>
        <section class="main">
            <div id="flash" class="flash">
                <a id="close" class="close">&times;</a>
                <ul></ul>
            </div>
            <div id="filters" class="filters">
                <form>
                    <fieldset>
                        <legend>Show players</legend>
                        <ul id="playerFilter" class="playerFilter">
                            <li>
                                <input type="checkbox" id="toggleAllPlayers" checked />
                                <label for="toggleAllPlayers">All</label>
                            </li>
                        </ul>
                    </fieldset>
                    <fieldset class="achievements">
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
                    <fieldset class="special">
                        <legend>Special</legend>
                        <ul>
                            <li>
                                <input type="checkbox" value="hideTest" id="hideTestAchievements" />
                                <label for="hideTestAchievements">Hide &lt;0.1% earned</label>
                            </li>
                        </ul>
                    </fieldset>
                </form>
            </div>
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
        <script>
            var javascriptEndTime = new Date().getTime(),
                javascriptExecutionTime = (javascriptEndTime - javascriptStartTime) / 1000,
                totalExecutionTime = phpExecutionTime + javascriptExecutionTime;
            $('<p class="timeProfile">This page generated in ' + totalExecutionTime.toFixed(2) + ' seconds. [PHP: ' + phpExecutionTime.toFixed(2) + 's; JS: ' + javascriptExecutionTime.toFixed(2) + 's]</p>').appendTo($('body'));
        </script>
    </body>
</html>

