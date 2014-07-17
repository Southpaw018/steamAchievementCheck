var playerNodes = {},
    playerQueue = 0,
    typeNodes = {earned: [], unearned: []};

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
        $.each(typeNodes[type], function () {
            this.setAttribute('data-hidetype', hide);
        });
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
        if (playerNodes[id]) {
            playerQueue--;
            $.each(playerNodes[id], function () {
                this.setAttribute('data-hideid', !evt.currentTarget.checked);
            });
            updateRowVisibility();
        } else {
            playerNodes[id] = [];
            evt.currentTarget.disabled = 'disabled';
            $.ajax('getPlayerData.php' + window.location.search, {
                data: {id: id, app: app},
                dataType: 'json',
                error: function(response) {
                    $('#' + id).prop('checked', false);
                    addError('Could not load stats for ' + name);
                    delete(playerNodes[id]);
                },
                success: function(response) {
                    var $mainTable = $('#mainTable'),
                        hide = {};
                    if ($mainTable.hasClass('hidden')) {
                        $mainTable.removeClass('hidden');
                        buildTable(response);
                    }

                    $('#earnedUnearnedFilter input').each(function() {
                        hide[this.value] = !this.checked;
                    });

                    $.each(response, function() {
                        var $ul = $('#' + this.apiname),
                            $li = $('<li class="player p' + id + '"></li>'),
                            li = $li.get(0),
                            className = this.achieved === 1 ? 'earned' : 'unearned';

                        $li.addClass(className);
                        $li.attr('data-id', id);
                        $li.attr('data-hidetype', hide[className]);
                        $li.append($('<span class="player-name"></span>').append(document.createTextNode(name)));
                        $ul.append($li);

                        playerNodes[id].push(li);
                        typeNodes[className].push(li);
                    });
                },
                complete: function() {
                    evt.currentTarget.removeAttribute('disabled');
                    playerQueue--;
                    updateRowVisibility();
                }
            });
        }
    });
});

//Utility functions
function updateRowVisibility() {
    if (playerQueue) {
        return;
    }

    var selector = '#mainTable tbody tr';
    if ($('#hideTestAchievements').prop('checked')) {
        selector += ':not(".testAchievement")';
    }
    $(selector).each(function() {
        $tr = $(this);
        $tr.toggleClass('hidden', !$tr.find('.earnedUnearnedList').children('[data-hideid!=true][data-hidetype!=true]').length);
    });
}

function addError(error) {
    $('#flash ul').append($('<li></li>').append(document.createTextNode(error)));
    $('#flash').addClass('alert').css('display', 'block');
}
