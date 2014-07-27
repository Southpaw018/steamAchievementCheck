<?php
$phpStartTime = microtime(true);

require('apiKey.php');
require('SteamAPIClient.php');

//Config
define("TEST_THRESHOLD", 0.1);

//Games we play a lot
define("KILLING_FLOOR", 1250);
define("PAYDAY", 24240);
define("PAYDAY2", 218620);

$errors = array();
$app = isset($_GET['app']) ? $_GET['app'] : PAYDAY2;
$api = new SteamAPIClient(API_KEY, $_GET);
$player_ids = getPlayerIDs();
$achievements = getAchievementData($api, $app, $errors);
$players = getPlayerData($api, $player_ids, $errors);

/**
 * Return a list of player Steam IDs.
 */
function getPlayerIDs() {
    $lines = file('playerIDs.txt');
    $ids = array();
    foreach ($lines as $line) {
        if (preg_match('/^\s*(?![#;=]).*(?<!\d)(\d{17})(?!\d)/', $line, $matches)) {
            $ids[] = $matches[0];
        }
    }
    return $ids;
}

/**
 * Return a list of $apiname => $percent, sorted by $apiname.
 */
function getAchievementData($api, $app, &$errors) {
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
        if ($achievement['name']) {
            $achievements[$achievement['name']] = $achievement['percent'];
        }
    }

    return $achievements;
}

/**
 * Return a list of $id => $data, sorted by name.
 */
function getPlayerData($api, $ids, &$errors) {
    $response = $api->getPlayerProfileSummaries($ids);
    if (!$api->lastCallSucceeded()) {
        $errors[] = "Failure getting player profiles. Aborting.";
        return;
    }

    $players = array();
    foreach ($response as $player) {
        $data = array();
        foreach (array('personaname', 'avatar') as $key) {
            $data[$key] = $player[$key];
        }
        $players[$player['steamid']] = $data;
    }

    uasort($players, function($a, $b) {
        $a['personaname'] = strtolower($a['personaname']);
        $b['personaname'] = strtolower($b['personaname']);
        if ($a['personaname'] === $b['personaname']) return 0;
        return $a['personaname'] < $b['personaname'] ? -1 : 1;
    });

    return $players;
}

$phpExecutionTime = microtime(true) - $phpStartTime;
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Mumble Crew Steam Achievement Check</title>
        <meta charset="utf-8" />

        <link rel="stylesheet" type="text/css" href="css/flash.css" />
        <link rel="stylesheet" type="text/css" href="css/tablesorter.css" />
        <link rel="stylesheet" type="text/css" href="css/main.css" />
        <link rel="stylesheet" type="text/css" href="css/theme.css" />
        <style type="text/css">
        <?php foreach ($players as $id => $player): ?>
            .p<?= $id; ?>:before {background-image: url('<?= $player['avatar']; ?>');}
        <?php endforeach; ?>
        </style>

        <script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
        <script src="js/jquery.tablesorter.min.js"></script>
        <script src="js/jquery.tinysort.min.js"></script>
        <script src="js/main.js"></script>
        <script>
            window.data = {
                achievements: <?= json_encode($achievements); ?>,
                errors: <?= json_encode($errors); ?>,
                app: <?= json_encode($app); ?>,
                testThreshold: <?= json_encode(TEST_THRESHOLD); ?>
            };
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
                                <input type="checkbox" id="toggleAllPlayers" />
                                <label for="toggleAllPlayers">All</label>
                            </li>
                            <?php foreach ($players as $id => $player): ?>
                                <li>
                                    <span class="status"></span>
                                    <input type="checkbox" id="<?= $id; ?>" data-name="<?= $player['personaname']; ?>" />
                                    <label for="<?= $id; ?>"><span class="player p<?= $id; ?>"><?= htmlspecialchars($player['personaname']); ?></span></label>
                                </li>
                            <?php endforeach; ?>
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
                    <fieldset class="tableFormat">
                        <legend>Display options</legend>
                        <ul>
                            <li>
                                <input type="checkbox" id="toggleNames">
                                <label for="toggleNames">Show player names</label>
                            </li>
                            <li>
                                <input type="checkbox" value="hideTest" id="hideTestAchievements" />
                                <label for="hideTestAchievements">Hide &lt;<?= TEST_THRESHOLD; ?>% earned</label>
                            </li>
                        </ul>
                    </fieldset>
                </form>
            </div>
            <table id="mainTable" class="mainTable hidden avatarOnly">
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

        <div class="timeProfile">PHP time: <?= round($phpExecutionTime, 2); ?> seconds</div>
    </body>
</html>
