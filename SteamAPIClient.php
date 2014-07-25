<?php
//web API HTML docs: https://developer.valvesoftware.com/wiki/Steam_Web_API
//web API function list: http://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v0001/
//full app list: http://api.steampowered.com/ISteamApps/GetAppList/v0002/

class SteamAPIClient {

    protected
        $key,
        $request,
        $domain,
        $cacheDir,
        $cacheTtl,
        $lastCallSucceeded;

    public function __construct(
        $key,
        $request = array(),
        $domain = 'http://api.steampowered.com',
        $cacheDir = 'cache/',
        $cacheTtl = 300
    ) {
        $this->key = $key;
        $this->request = $request;
        $this->domain = preg_replace('/\/+$/', '', $domain);
        $this->cacheDir = $cacheDir;
        $this->cacheTtl = $cacheTtl;
        $this->lastCallSucceeded = false;
    }

    public function getGameAchievements($app) {
        return $this->get("ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid={$app}", $app);
    }

    public function getPlayerAchievements($app, $steamid) {
        return $this->get("ISteamUserStats/GetPlayerAchievements/v0001/?appid={$app}&key=" . API_KEY . "&steamid={$steamid}&l=en", $app, $steamid);
    }

    public function getPlayerStats($app, $steamid) {
        return $this->get("ISteamUserStats/GetUserStatsForGame/v0002/?appid={$app}&key=" . API_KEY . "&steamid={$steamid}&l=en", $app, $steamid);
    }

    public function getPlayerProfileSummaries($ids = array()) {
        return $this->getMulti("ISteamUser/GetPlayerSummaries/v0002/?key=" . API_KEY . "&steamids=", $ids);
    }

    public function lastCallSucceeded() {
        return $this->lastCallSucceeded;
    }

    protected function get($path, $app = '', $steamid = '') {
        $cachePath = $this->getCachePath($app, $steamid);
        if ($this->useCache($cachePath)) {
            $this->lastCallSucceeded = true;
            return json_decode(file_get_contents($cachePath), true);
        }

        $response = @file_get_contents("{$this->domain}/{$path}");
        if ($response !== false) {
            $this->lastCallSucceeded = true;
            $result = json_decode($response, true);
            file_put_contents($cachePath, preg_replace('/([^\n])?$/', "$1\n", json_encode($result)));
            return $result;
        }

        $this->lastCallSucceeded = false;
        return false;
    }

    protected function getMulti($path, $ids) {
        $cachedPlayerData = array();
        $newPlayerIDsToGet = array();

        foreach ($ids as $id) {
            $cachePath = $this->getCachePath('', $id);
            if ($this->useCache($cachePath)) {
                $this->lastCallSucceeded = true;
                $cachedPlayerData[] = json_decode(file_get_contents($cachePath), true);
            } else {
                $newPlayerIDsToGet[] = $id;
            }
        }

        $response = @file_get_contents("{$this->domain}/{$path}" . implode(',', $newPlayerIDsToGet));
        if ($response === false) {
            $this->lastCallSucceeded = false;
            return false;
        }

        $this->lastCallSucceeded = true;
        $result = json_decode($response, true);
        $result = $result['response']['players'];

        foreach ($result as $cacheItem) {
            $cachePath = $this->getCachePath('', $cacheItem['steamid']);
            file_put_contents($cachePath, json_encode($cacheItem) . "\n");
        }
        return array_merge($cachedPlayerData, $result);
    }

    protected function useCache($path) {
        if (!empty($this->request['offline'])) {
            return file_exists($path);
        }

        if (!empty($this->request['nocache'])) {
            return false;
        }

        return file_exists($path) && filemtime($path) + $this->cacheTtl > time();
    }

    protected function getCachePath($app, $steamid) {
        return "{$this->cacheDir}/{$app}_{$steamid}.json";
    }

}
