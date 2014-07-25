<?php

require('apiKey.php');
require('SteamAPIClient.php');

$api = new SteamAPIClient(API_KEY, $_GET);
$response = $api->getPlayerAchievements($_GET['app'], $_GET['id']);
if ($api->lastCallSucceeded()) {
    header('Content-type: application/json');
    echo json_encode($response['playerstats']['achievements']);
} else {
    http_response_code(503);
}
