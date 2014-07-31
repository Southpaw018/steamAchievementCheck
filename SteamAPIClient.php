<?php
//web API HTML docs: https://developer.valvesoftware.com/wiki/Steam_Web_API
//web API function list: http://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v0001/
//full app list: http://api.steampowered.com/ISteamApps/GetAppList/v0002/

class SteamAPIClient {

    protected
        $key,
        $domain,
        $cacheDir,
        $cacheTtl,
        $defaults = [
            'domain' => 'http://api.steampowered.com',
            'cacheDir' => 'cache/',
            'cacheTtl' => 300,
        ];

    public function __construct($key, $options) {
        $this->key = $key;
        foreach ($this->defaults as $key => $value) {
            $this->$key = isset($options[$key]) ? $options[$key] : $value;
        }
        $this->domain = rtrim($this->domain, '/');
    }

    public function getGameAchievements($appID, $forceCache = false) {
        return $this->get(
            "ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/",
            array('gameid' => $appID),
            $forceCache
        );
    }

    public function getPlayerAchievements($appID, $playerID, $forceCache = false) {
        return $this->get(
            "ISteamUserStats/GetPlayerAchievements/v0001/?key={$this->key}&l=en",
            array('appid' => $appID, 'steamid' => $playerID),
            $forceCache
        );
    }

    public function getPlayerStats($appID, $playerID, $forceCache = false) {
        return $this->get(
            "ISteamUserStats/GetUserStatsForGame/v0002/?key={$this->key}&l=en",
            array('appid' => $appID, 'steamid' => $playerID),
            $forceCache
        );
    }

    public function getPlayerProfileSummaries($ids, $forceCache = false) {
        return $this->getMulti(
            "ISteamUser/GetPlayerSummaries/v0002/?key={$this->key}&steamids=",
            (array) $ids,
            $forceCache
        );
    }

    protected function get($path, $data, $forceCache = false) {
        $cachePath = $this->getCachePath($data);
        if (file_exists($cachePath) && ($forceCache || !$this->isPastTtl($cachePath))) {
            return json_decode(file_get_contents($cachePath), true);
        }

        $url = "{$this->domain}/{$path}" . (strstr($path, '?') ? '&' : '?') . http_build_query($data);
        $response = @file_get_contents($url);
        if (!$response) {
            throw new SteamAPIFailException($url);
        }

        $data = json_decode($response, true);
        file_put_contents($cachePath, json_encode($data) . "\n");
        return $data;
    }

    protected function getMulti($path, $ids, $forceCache = false) {
        $cachedPlayerData = array();
        $newPlayerIDsToGet = array();

        foreach ($ids as $id) {
            $cachePath = $this->getCachePath($id);
            if (file_exists($cachePath) && ($forceCache || !$this->isPastTtl($cachePath))) {
                $cachedPlayerData[] = json_decode(file_get_contents($cachePath), true);
            } else {
                $newPlayerIDsToGet[] = $id;
            }
        }

        $url = "{$this->domain}/{$path}" . implode(',', $newPlayerIDsToGet);
        $response = @file_get_contents($url);
        if ($response === false) {
            throw new SteamAPIFailException($url);
        }

        $result = json_decode($response, true);
        $result = $result['response']['players'];

        foreach ($result as $cacheItem) {
            $cachePath = $this->getCachePath($cacheItem['steamid']);
            file_put_contents($cachePath, json_encode($cacheItem) . "\n");
        }
        return array_merge($cachedPlayerData, $result);
    }

    protected function isPastTTL($path) {
        return filemtime($path) + $this->cacheTtl < time();
    }

    protected function getCachePath($data) {
        $data = (array) $data;
        ksort($data);
        return "{$this->cacheDir}/" . implode('_', $data) . '.json';
    }
}
