var $mainTable,
    $playerCheckboxes,
    hideType = {},
    playerNodes = {},
    playerQueue = 0,
    typeNodes = {earned: [], unearned: []},
    nocache = false; // TODO: Figure out $.trigger's extra parameters

$(document).ready(function() {
    // Initialization
    $mainTable = $('#mainTable');
    $playerCheckboxes = $('#playerFilter input[data-name]');

    // Handle errors
    $.each(errors, function(index, error) {
        addError(error);
    });
});

function buildTable(playerData) {
    var $tbody = $mainTable.find('tbody'),
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
        var hide = !evt.currentTarget.checked,
            type = evt.currentTarget.value;
        hideType[type] = hide;
        $.each(typeNodes[type], function() {
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
        $playerCheckboxes.each(function() {
            if (this.checked !== checked) {
                $(this).trigger('click');
            }
        });
    });

    $('#hideTestAchievements').change(function(evt) {
        $mainTable.toggleClass('hideTest', evt.currentTarget.checked);
    });

    $('#toggleNames').change(function(evt) {
        $mainTable.toggleClass('avatarOnly', !evt.currentTarget.checked);
    });

    $mainTable.on('click', 'li', null, function(evt) {
        window.open('http://steamcommunity.com/profiles/' + evt.currentTarget.getAttribute('data-id'), '_blank');
    });

    $('#playerFilter').on('click', '.loaded', null, function() {
        var $this = $(this).removeClass('loaded'),
            $checkbox = $this.siblings('input'),
            id = $checkbox.attr('id');

        $.each(playerNodes[id], function() {
            $(this).remove();
        });
        delete(playerNodes[id]);

        $checkbox.prop('checked', false);
        nocache = true;
        $checkbox.trigger('click');
        nocache = false;
    });

    $playerCheckboxes.on('click', function(evt) {
        var id = this.id,
            name = this.getAttribute('data-name');

        playerQueue++;
        if (playerNodes[id]) {
            playerQueue--;
            $.each(playerNodes[id], function() {
                this.setAttribute('data-hideid', !evt.currentTarget.checked);
            });
            updateRowVisibility();
        } else {
            var $checkbox = $(this).prop('disabled', true),
                $status = $checkbox.siblings('.status');
            $status.addClass('loading');
            playerNodes[id] = [];

            $.ajax('getPlayerData.php' + (nocache ? '?nocache=1' : window.location.search), {
                data: {id: id, app: app},
                dataType: 'json',
                error: function(response) {
                    $('#' + id).prop('checked', false);
                    $status.removeClass('loading');
                    addError('Could not load stats for ' + name);
                    delete(playerNodes[id]);
                },
                success: function(response) {
                    if ($mainTable.hasClass('hidden')) {
                        $mainTable.removeClass('hidden');
                        buildTable(response);
                    }

                    $.each(response, function() {
                        var $ul = $('#' + this.apiname),
                            li = document.createElement('li'),
                            type = this.achieved === 1 ? 'earned' : 'unearned';

                        li.className = 'player p' + id + ' ' + type;
                        li.setAttribute('data-id', id);
                        li.setAttribute('data-hidetype', hideType[type]);
                        li.appendChild($('<span class="player-name"></span>').append(document.createTextNode(name)).get(0));
                        $ul.append(li);

                        playerNodes[id].push(li);
                        typeNodes[type].push(li);
                    });

                    $status.removeClass('loading');
                    $status.addClass('loaded');
                },
                complete: function() {
                    $checkbox.prop('disabled', false);
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

    var selector = 'tbody tr';
    if ($('#hideTestAchievements').prop('checked')) {
        selector += ':not(".testAchievement")';
    }
    $mainTable.find(selector).each(function() {
        $tr = $(this);
        $tr.toggleClass('hidden', !$tr.find('.earnedUnearnedList').children('[data-hideid!=true][data-hidetype!=true]').length);
    });
}

function addError(error) {
    $('#flash ul').append($('<li></li>').append(document.createTextNode(error)));
    $('#flash').addClass('alert').css('display', 'block');
}
