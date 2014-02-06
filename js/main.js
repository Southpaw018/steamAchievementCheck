//Handle errors
$(document).ready(function() {
    $.each(errors, function(index, error) {
        addError(error);
    });
});

$(document).ready(function() {
    var requestCount = 0,
        responseCount = 0,
        $progress = $('#playerDataProgress');

    $progress.attr('max', Object.keys(players).length);

    $.each(players, function(id) {
        window.setTimeout(function() {
            $.ajax('getPlayerData.php', {
                data: {id: id, app: app},
                dataType: 'json',
                error: function(response) {
                    addError('Could not load stats for ' + players[id].name);
                    delete players[id];
                },
                success: function(response) {
                    $.each(response, function(index, data) {
                        var achievement = achievements[data.apiname],
                            type = data.achieved === 1 ? 'earned' : 'unearned';
                        achievement[type].push(id);
                        if (!achievement.name || !achievement.description) {
                            achievement.name = data.name;
                            achievement.description = data.description;
                        }
                    });
                },
                complete: function() {
                    if (++responseCount === requestCount) {
                        buildDOM();
                        $progress.remove();
                    } else {
                        $progress.attr('value', responseCount);
                    }
                }
            });
        }, requestCount++ * 100);
    });
});

//Build DOM
function buildDOM() {
    var $mainTable = $('#mainTable'),
        $tbody = $mainTable.find('tbody'),
        $nonTestAchvs;

    $.each(achievements, function() {
        if (this.name) {
            var $tr = $('<tr></tr>'),
                $list = $('<ul class="earnedUnearnedList"></ul>'),
                percent = this.percent || 0;

            if (percent < 0.1) {
                $tr.addClass('testAchievement');
            }

            if (this.earned) {
                $.each(this.earned, function(index, id) {
                    $list.append($('<li class="earned"></li>').append(playerHTML(players[id])).attr('data-id', id));
                });
            }
            if (this.unearned) {
                $.each(this.unearned, function(index, id) {
                    $list.append($('<li class="unearned"></li>').append(playerHTML(players[id])).attr('data-id', id));
                });
            }

            $tr.append(
                $('<td></td>').append(document.createTextNode(this.name))
                        .append('<br />')
                        .append($('<small></small>').append(document.createTextNode(this.description)))
            );

            $tr.append($('<td></td>').append($list));

            $tr.append($('<td></td>')
                .append($('<abbr></abbr>').attr('title', percent + '%')
                    .append(percent.toFixed(2) + '%')
            ));

            $tbody.append($tr);
        }
    });

    $.each(players, function(id) {
        var name = players[id].name,
            li = $('<li></li>');
        li.append('<input type="checkbox" id="' + id + '" checked />');
        li.append('<label for="' + id + '">' + name + '</label>');
        $('#playerFilter').append(li);
    });

    $nonTestAchvs = $mainTable.find('tr:not(.testAchievement)');
    $.each(players, function(id) {
        if (!$nonTestAchvs.find('li.unearned[data-id=' + id + ']').length) {
            $('#playerFilter label[for=' + id + ']').addClass('earned');
        }
    });

    $('#playerFilter input:not([id=toggleAllPlayers])').change(function(evt) {
        var hide = !evt.currentTarget.checked;

        $('#toggleAllPlayers').prop('checked', !$('#playerFilter input:not(:checked):not([id=toggleAllPlayers])').length);

        $('#mainTable .earnedUnearnedList li[data-id=' + evt.currentTarget.id + ']').each(function() {
            var $this = $(this);
            $this.attr('data-hideid', hide);
        });

        updateAllRowVisibility();
    });

    $('#earnedUnearnedFilter input').change(function(evt) {
        var hide = !evt.currentTarget.checked;
        $('#mainTable .earnedUnearnedList li.' + evt.currentTarget.value).each(function() {
            var $this = $(this);
            $this.attr('data-hidetype', hide);
            updateRowVisibility($this.closest('tr'));
        });
    });

    //Init sort plugins
    $mainTable.tablesorter({
        theme: 'grey',
        headerTemplate: '{content}{icon}',
        sortList: [[0, 0]],
        headers: {1: {sorter: false}}
    });
    $mainTable.find('li').tsort();

    addExecutionTime();
}

//Initial manipulation
$(document).ready(function() {
    $('#filters fieldset:not([class=special],[class=tableFormat]) input').prop('checked', true);
    $('#filters fieldset[class=special] input').prop('checked', false);
    $('#tableFormatFull').prop('checked', true);
    $('#hideTestAchievements').prop('checked', false);
});

//Event hooks
$(document).ready(function() {
    $('#close').click(function() {
        $(this).parent().css('display', '');
    });

    $('#toggleAllPlayers').change(function(evt) {
        var checked = evt.currentTarget.checked;
        $('#playerFilter input:not([id=toggleAllPlayers])').prop('checked', checked);

        $('#mainTable .earnedUnearnedList li').each(function() {
            var $this = $(this);
            $this.attr('data-hideid', !checked);
        });
        updateAllRowVisibility();
    });

    $('#hideTestAchievements').change(function(evt) {
        $('#mainTable tr.testAchievement').each(function() {
            $(this).attr('data-hidetest', evt.currentTarget.checked);
        });
    });

    $('.tableFormat input').change(function(evt) {
        $('#mainTable').toggleClass('full textNames compact', false);
        $('#mainTable').toggleClass(evt.currentTarget.value, true);
    });
});

//Utility functions
function playerHTML(player) {
    return $('<img width="64" height="64" />').attr('src', player.avatarMediumURL).attr('alt', player.name).attr('title', player.name)
                .add($('<p></p>').append(document.createTextNode(player.name)));
}

function updateAllRowVisibility() {
    $('#mainTable tbody tr').each(function() {
        updateRowVisibility($(this));
    });
}

function updateRowVisibility($tr) {
    if ($tr.find('li[data-hideid!=true][data-hidetype!=true]').length) {
        $tr.css('display', '');
    } else {
        $tr.css('display', 'none');
    }
}

function addExecutionTime() {
    $('<li></li>').append('JavaScript time: ' + ((new Date().getTime() - javascriptStartTime) / 1000).toFixed(2) + ' seconds').appendTo($('.timeProfile'));
}

function addError(error) {
    $('#flash ul').append($('<li></li>').append(document.createTextNode(error)));
    $('#flash').addClass('alert').css('display', 'block');
}

