$(document).ready(function() {
    var $mainTable = $('#mainTable'),
        $tbody = $mainTable.find('tbody');

    $.each(achievements, function() {
        if (this.name) {
            var $tr = $('<tr></tr>'),
                $list = $('<ul class="earnedUnearnedList"></ul>'),
                percent;

            if (this.earned) {
                $.each(this.earned, function(index, id) {
                    $list.append($('<li class="earned"></li>').append(document.createTextNode(players[id])).attr('data-id', id));
                });
            }
            if (this.unearned) {
                $.each(this.unearned, function(index, id) {
                    $list.append($('<li class="unearned"></li>').append(document.createTextNode(players[id])).attr('data-id', id));
                });
            }

            $tr.append(
                $('<td></td>').append(document.createTextNode(this.name))
                        .append('<br />')
                        .append($('<small></small>').append(document.createTextNode(this.description)))
            );

            $tr.append($('<td></td>').append($list));

            percent = this.percent || 0;
            testAchievement = (percent > 0 && percent < 0.1) ? true : false;
            $tr.append($('<td class="percent"></td>').attr('data-testAchievement',testAchievement)
                .append($('<abbr></abbr>').attr('title', percent + '%')
                        .append(percent.toFixed(2) + '%')
            ));

            $tbody.append($tr);
        }
    });

    $.each(players, function(id) {
        var name = players[id],
            li = $('<li></li>');
        li.append('<input type="checkbox" id="' + id + '" checked />');
        li.append('<label for="' + id + '">' + name + '</label>');
        $('#playerFilter').append(li);
    });

    $.each(players, function(id) {
        if ($('#mainTable').find('li.unearned[data-id=' + id + ']') //find all unearned achievements for this player...
            .closest('tr')
            .find('td.percent:not([data-testachievement=true])') //...that are not test achievements
            .length == 0) {
            /*$('#playerFilter input[id=' + id + ']')
                .attr('checked',false)
                .attr('disabled',true)
                .change();*/
            $('#playerFilter label[for=' + id + ']').addClass('earned');
        }
    });

    $mainTable.tablesorter({
        theme: 'grey',
        headerTemplate: '{content}{icon}',
        sortList: [[0, 0]],
        headers: {1: {sorter: false}},
        widgets: ['zebra']
    });

    $mainTable.find('li').tsort();
});

$(document).ready(function() {
    $('#filters input:not([id=hideTestAchievements])').prop('checked',true);
    $('#filters input[id=hideTestAchievements]').prop('checked',false);

    $('#toggleAllPlayers').change(function(evt) {
        var checked = evt.currentTarget.checked;
        $('#playerFilter input:not([id=toggleAllPlayers])').prop('checked', checked);

        $('#mainTable .earnedUnearnedList li').each(function() {
            var $this = $(this);
            $this.attr('data-hideid', !checked);
        });
        updateAllRowVisibility();
    });

    $('#playerFilter input:not([id=toggleAllPlayers])').change(function(evt) {
        var allPlayersSelected = true;
        var checkboxes = $('#playerFilter input:not([id=toggleAllPlayers])');
        if (checkboxes.filter(':checked').length < checkboxes.length) {allPlayersSelected = false;}
        $('#playerFilter #toggleAllPlayers').prop('checked',allPlayersSelected);

        var hide = !evt.currentTarget.checked;
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

    $('#hideTestAchievements').change(function(evt) {
        $('#mainTable .percent[data-testAchievement=true]').each(function() {
            var $this = $(this);
            $this.attr('data-hidetest', evt.currentTarget.checked);
        });
        updateAllRowVisibility();
    });
});

function updateAllRowVisibility() {
    $('#mainTable tbody tr').each(function() {
        updateRowVisibility($(this));
    });
}

function updateRowVisibility($tr) {
    if ($tr.find('li[data-hideid!=true][data-hidetype!=true]').length && !$tr.find('td[data-hidetest=true]').length) {
        $tr.show();
    } else {
        $tr.hide();
    }
}

