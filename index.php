<?php
$phpStartTime = microtime(true);

require('apiKey.php');
require('SteamAPIClient.php');

//Games we play a lot
define("KILLING_FLOOR", 1250);
define("PAYDAY", 24240);
define("PAYDAY2", 218620);

$errors = array();

//Steam ID lookup service: http://steamid.co/
$player_ids = array(
    '76561197993313145', //Glorax
    '76561197970314683', //Deagle
    '76561197991652633', //Oten
    '76561198015208150', //Fargi
    '76561197966611402', //Moof
    '76561198006448879', //Scibs
    '76561197993231027', //Banana
    '76561198014895533', //Bukkithead
    '76561197972658071', //Chuffy
    '76561197996816207', //Master
    '76561197998922044', //Joe
    '76561197986608136', //Dagordae
);

$app = isset($_GET['app']) ? $_GET['app'] : PAYDAY2;
list($achievements, $players) = getPageData($app, $player_ids, $errors);

/**
 * Instantiate API, get achievement list, sort, and set up array with name and and global %
 */
function getPageData($app, $player_ids, &$errors) {
    $api = new SteamAPIClient(API_KEY, $_GET);
    $response = $api->getGameAchievements($app);
    if (!$api->lastCallSucceeded()) {
        $errors[] = "Failure getting global achievement stats. Aborting.";
        return;
    }

    $rawAchievements = $response['achievementpercentages']['achievements'];
    usort($rawAchievements, function($a, $b) {
        return strcasecmp($a['name'], $b['name']);
    });

    $achievements = array();
    foreach ($rawAchievements as $achievement) {
        $achievements[$achievement['name']] = array('percent' => $achievement['percent']);
    }

    //Get player names and info, then sort them by name
    $response = $api->getPlayerProfileSummaries($player_ids);
    if (!$api->lastCallSucceeded()) {
        $errors[] = "Failure getting player profiles. Aborting.";
        return;
    }

    $players = array();
    foreach ($response as $player) {
        $playerSteamID = $player['steamid'];

        $players[$playerSteamID] = array(
            'name' => $player['personaname'],
            'avatarSmallURL' => $player['avatar'],
            'avatarMediumURL' => $player['avatarmedium'],
            //'online' => $player['personastate'] == 1 ? 'true' : 'false'
        );
    }

    uasort($players, function($a, $b) {
        $a['name'] = strtolower($a['name']);
        $b['name'] = strtolower($b['name']);
        if ($a['name'] === $b['name']) return 0;
        return $a['name'] < $b['name'] ? -1 : 1;
    });

    //Add player status to each achievement
    foreach ($players as $id => $data) {
        $name = $data['name'];
        $response = $api->getPlayerAchievements($app, $id);
        if (!$api->lastCallSucceeded()) {
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

    return array($achievements, $players);
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
                                <input type="checkbox" value="useTextNames" id="useTextNames" />
                                <label for="useTextNames">Use player names</label>
                            </li>
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

