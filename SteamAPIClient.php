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

    public function getPlayerProfileSummaries($steamidlist = array()) {
        return $this->get("ISteamUser/GetPlayerSummaries/v0002/?key=" . API_KEY . "&steamids=" . implode(',', $steamidlist));
    }

    public function lastCallSucceeded() {
        return $this->lastCallSucceeded;
    }

    protected function get($path, $app = '', $steamid = '') {
        if ($steamid != '') { //Don't cache player data for now
            $cachePath = $this->getCachePath($app, $steamid);
            if ($this->useCache($cachePath)) {
                $this->lastCallSucceeded = true;
                return json_decode(file_get_contents($cachePath), true);
            }
        }

        $response = file_get_contents("{$this->domain}/{$path}");
        if ($response !== false) {
            $this->lastCallSucceeded = true;
            $result = json_decode($response, true);
            if ($steamid != '') {file_put_contents($cachePath, preg_replace('/([^\n])?$/', "$1\n", json_encode($result)));}
            return $result;
        }

        $this->lastCallSucceeded = false;
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
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir);
        }
        return "{$this->cacheDir}/{$app}_{$steamid}.json";
    }

}
