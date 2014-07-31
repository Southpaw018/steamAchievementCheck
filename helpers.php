<?php
function getTTLFromRequest($request) {
    if (isset($request['offline'])) {
        return PHP_INT_MAX;
    }
    if (isset($_GET['nocache'])) {
        return 0;
    }
}
