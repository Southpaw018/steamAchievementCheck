var $mainTable,
    $playerCheckboxes,
    $toggleAllPlayers,
    hideType = {},
    playerNodes = {},
    playerQueue = 0,
    testAchievements = {},
    typeNodes = {earned: [], unearned: []},
    nocache = false; // TODO: Figure out $.trigger's extra parameters

$(document).ready(function () {
    // Initialize
    $mainTable = $('#mainTable');
    $playerCheckboxes = $('#playerFilter input[data-name]');
    $toggleAllPlayers = $('#toggleAllPlayers');

    // Render error messages
    $.each(window.data.errors, function () {
        addError(this);
    });
});

function buildTable(playerData) {
    var $tbody = $mainTable.find('tbody'),
        metadata = {};

    $.each(playerData, function () {
        metadata[this.apiname] = {name: this.name, description: this.description};
    });

    $.each(window.data.achievements, function (id, percent) {
        if (!metadata[id]) {
            return true;
        }

        var $tr = $('<tr></tr>');

        if (percent < window.data.testThreshold) {
            $tr.addClass('testAchievement');
            testAchievements[id] = true;
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
            )
        );

        $tbody.append($tr);
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

//Event hooks
$(document).ready(function () {
    $('#close').click(function () {
        $(this).parent().css('display', '').find('li').remove();
    });

    $toggleAllPlayers.click(function () {
        var checked = this.checked;
        $playerCheckboxes.each(function () {
            if (this.checked !== checked) {
                $(this).trigger('click');
            }
        });
    });

    $('#hideTestAchievements').change(function () {
        $mainTable.toggleClass('hideTest', this.checked);
    });

    $('#toggleNames').change(function () {
        $mainTable.toggleClass('avatarOnly', !this.checked);
    });

    $mainTable.on('click', 'li', null, function () {
        window.open('http://steamcommunity.com/profiles/' + this.getAttribute('data-id'), '_blank');
    });

    $('#earnedUnearnedFilter input').change(function () {
        var hide = !this.checked,
            type = this.value;
        hideType[type] = hide;
        $.each(typeNodes[type], function () {
            this.setAttribute('data-hidetype', hide);
        });
        updateRowVisibility();
    });

    $('#playerFilter').on('click', '.loaded', null, function () {
        var $this = $(this).removeClass('loaded'),
            $checkbox = $this.siblings('input'),
            id = $checkbox.attr('id');

        $.each(playerNodes[id], function () {
            $(this).remove();
        });
        delete playerNodes[id];

        $checkbox.prop('checked', false);
        $toggleAllPlayers.prop('checked', false);
        nocache = true;
        $checkbox.trigger('click');
        nocache = false;
    });

    $playerCheckboxes.on('click', function () {
        var id = this.id,
            name = this.getAttribute('data-name'),
            checked = this.checked;

        $toggleAllPlayers.prop('checked', checked && !$playerCheckboxes.filter(':not(:checked)').length);
        playerQueue++;

        if (playerNodes[id]) {
            playerQueue--;
            $.each(playerNodes[id], function () {
                this.setAttribute('data-hideid', !checked);
            });
            updateRowVisibility();
        } else {
            var $checkbox = $(this).prop('disabled', true),
                $status = $checkbox.siblings('.status');
            $status.addClass('loading');
            playerNodes[id] = [];

            $.ajax('getPlayerData.php' + (nocache ? '?nocache=1' : window.location.search), {
                data: {id: id, app: window.data.app},
                dataType: 'json',
                error: function () {
                    $('#' + id).prop('checked', false);
                    $toggleAllPlayers.prop('checked', false);
                    $status.removeClass('loading');
                    addError('Could not load stats for ' + name);
                    delete playerNodes[id];
                },
                success: function (response) {
                    if ($mainTable.hasClass('hidden')) {
                        $mainTable.removeClass('hidden');
                        buildTable(response);
                    }

                    var perfectGame = true;
                    $.each(response, function () {
                        var $ul = $('#' + this.apiname),
                            li = document.createElement('li'),
                            type = this.achieved === 1 ? 'earned' : 'unearned';

                        perfectGame = perfectGame && (type === 'earned' || !!testAchievements[this.apiname]);
                        li.className = 'player p' + id + ' ' + type;
                        li.setAttribute('data-id', id);
                        li.setAttribute('data-hidetype', hideType[type]);
                        li.appendChild($('<span class="player-name"></span>').append(document.createTextNode(name)).get(0));
                        $ul.append(li);

                        playerNodes[id].push(li);
                        typeNodes[type].push(li);
                    });

                    $checkbox.closest('li').toggleClass('perfect', perfectGame);
                    $status.removeClass('loading');
                    $status.addClass('loaded');
                },
                complete: function () {
                    $checkbox.prop('disabled', false);
                    playerQueue--;
                    updateRowVisibility();
                }
            });
        }
    });

    // Reset checkboxes
    $('#filters input').prop('checked', false);
    $('#earnedUnearnedFilter input').trigger('click');
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
    $mainTable.find(selector).each(function () {
        var $tr = $(this);
        $tr.toggleClass('hidden', !$tr.find('.earnedUnearnedList').children('[data-hideid!=true][data-hidetype!=true]').length);
    });
}

function addError(error) {
    $('#flash ul').append($('<li></li>').append(document.createTextNode(error)));
    $('#flash').addClass('alert').css('display', 'block');
}
