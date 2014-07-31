<?php

require('apiKey.php');
require('SteamAPIClient.php');
require('SteamAPIFailException.php');

$api = new SteamAPIClient(API_KEY, $_GET);
try {
    $response = $api->getPlayerAchievements($_GET['app'], $_GET['id']);
} catch (SteamAPIFailException $e) {
    http_response_code(503);
}

header('Content-type: application/json');
echo json_encode($response['playerstats']['achievements']);
