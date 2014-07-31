<?php
require('helpers.php');
require('SteamAPIClient.php');
require('SteamAPIFailException.php');

$api = new SteamAPIClient(file_get_contents('api.key'), array('cacheTtl' => getTTLFromRequest($_GET)));
try {
    $response = $api->getPlayerAchievements($_GET['app'], $_GET['id']);
} catch (SteamAPIFailException $e) {
    http_response_code(503);
}

header('Content-type: application/json');
echo json_encode($response['playerstats']['achievements']);
