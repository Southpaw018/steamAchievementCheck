var playersLoaded = {},
    playerQueue = 0;

//Handle errors
$(document).ready(function() {
    $.each(errors, function(index, error) {
        addError(error);
    });
});

function buildTable(playerData) {
    var $mainTable = $('#mainTable'),
        $tbody = $mainTable.find('tbody'),
        metadata = {};

    $.each(playerData, function(id) {
        metadata[this.apiname] = {name: this.name, description: this.description};
    });

    $.each(achievements, function(id, percent) {
        if (!metadata[id]) {
            return true;
        }

        var $tr = $('<tr></tr>');

        if (percent < 0.1) {
            $tr.addClass('testAchievement');
        }

        $tr.append(
            $('<td></td>')
                .append($('<span class="achievement-name"></span>').append(document.createTextNode(metadata[id].name)))
                .append($('<span class="achievement-desc"></span>').append(document.createTextNode(metadata[id].description)))
        );

        $tr.append($('<td></td>').append($('<ul class="earnedUnearnedList"></ul>').attr('id', id)));

        $tr.append($('<td></td>')
            .append($('<abbr></abbr>').attr('title', percent + '%')
                .append(percent.toFixed(2) + '%')
        ));

        $tbody.append($tr);
    });

    $('#earnedUnearnedFilter input').change(function(evt) {
        var hide = !evt.currentTarget.checked;
        var type = evt.currentTarget.value;
        $('#mainTable').toggleClass('hide' + evt.currentTarget.value, hide);
        updateRowVisibility();
    });

    //Init sort plugins
    $mainTable.tablesorter({
        theme: 'grey',
        headerTemplate: '{content}{icon}',
        sortList: [[0, 0]],
        headers: {1: {sorter: false}}
    });
    $mainTable.find('li').tsort();

    $mainTable.removeClass('hidden');
}

//Initial manipulation
$(document).ready(function() {
    $('#filters input').prop('checked', false);
    $('#earnedUnearnedFilter input').prop('checked', true);
});

//Event hooks
$(document).ready(function() {
    $('#close').click(function() {
        $(this).parent().css('display', '');
    });

    $('#toggleAllPlayers').click(function(evt) {
        var checked = evt.currentTarget.checked;
        $('#playerFilter input[data-name]').each(function() {
            if (this.checked !== checked) {
                $(this).trigger('click');
            }
        });
    });

    $('#hideTestAchievements').change(function(evt) {
        $('#mainTable').toggleClass('hideTest', evt.currentTarget.checked);
    });

    $('#toggleNames').change(function(evt) {
        $('#mainTable').toggleClass('avatarOnly', !evt.currentTarget.checked);
    });

    $('#mainTable').on('click', 'li', null, function(evt) {
        window.open('http://steamcommunity.com/profiles/' + evt.currentTarget.getAttribute('data-id'), '_blank');
    });

    $('#playerFilter input[data-name]').change(function(evt) {
        var id = evt.currentTarget.id,
            name = evt.currentTarget.getAttribute('data-name');

        playerQueue++;
        $('#mainTable').toggleClass('hide' + id, !evt.currentTarget.checked);

        if (playersLoaded[id]) {
            playerQueue--;
            updateRowVisibility();
        } else {
            playersLoaded[id] = true;
            $.ajax('getPlayerData.php' + window.location.search, {
                data: {id: id, app: app},
                dataType: 'json',
                error: function(response) {
                    $('#' + id).prop('checked', false);
                    addError('Could not load stats for ' + name);
                    delete(playersLoaded[id]);
                },
                success: function(response) {
                    var $mainTable = $('#mainTable');
                    if ($mainTable.hasClass('hidden')) {
                        $mainTable.removeClass('hidden');
                        buildTable(response);
                    }

                    $.each(response, function() {
                        var $ul = $('#' + this.apiname),
                            $li = $('<li class="player p' + id + '"></li>');

                        $li.addClass(this.achieved === 1 ? 'earned' : 'unearned');
                        $li.attr('data-id', id);
                        $li.append($('<span class="player-name"></span>').append(document.createTextNode(name)));
                        $ul.append($li);
                    });
                },
                complete: function() {
                    playerQueue--;
                    updateRowVisibility();
                }
            });
        }
    });
});

//Utility functions
function playerHTML(player) {
    return $('<img width="32" height="32" />')
            .attr('src', player.avatar)
            .attr('alt', player.personaname)
            .attr('title', player.personaname)
        .add($('<span></span>').append(document.createTextNode(player.personaname)));
}

function updateRowVisibility() {
    if (playerQueue) {
        return;
    }

    $('#mainTable tbody tr').each(function() {
        $tr = $(this);
        $tr.toggleClass('hidden-visibly', !$tr.find('.earnedUnearnedList').children(':visible').length);
    });
}

function addError(error) {
    $('#flash ul').append($('<li></li>').append(document.createTextNode(error)));
    $('#flash').addClass('alert').css('display', 'block');
}
