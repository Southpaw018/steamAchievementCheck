$(document).ready(function() {
    var $mainTable = $('#mainTable'),
        $tbody = $mainTable.find('tbody');

    $.each(achievements, function() {
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
        $tr.append($('<td></td>').append(
            $('<abbr></abbr>').attr('title', percent + '%')
                    .append(percent.toFixed(2) + '%')
        ));

        $tbody.append($tr);
    });

    $.each(players, function(id) {
        var name = players[id],
            li = $('<li></li>');
        li.append('<input type="checkbox" id="' + id + '" checked />');
        li.append('<label for="' + id + '">' + name + '</label>');
        $('#playerFilter').append(li);
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

    $('#toggleAllPlayers').change(function(evt) {
        var checked = evt.currentTarget.checked;
        $('#playerFilter input[id]').prop('checked', checked);

        $('#mainTable .earnedUnearnedList li').each(function() {
            var $this = $(this);
            $this.attr('data-hideid', !checked);
        });
        updateAllRowVisibility();
    });

    $('#playerFilter input[id]').change(function(evt) {
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

});

function updateAllRowVisibility() {
    $('#mainTable tbody tr').each(function() {
        updateRowVisibility($(this));
    });
}

function updateRowVisibility($tr) {
    if ($tr.find('li[data-hideid!=true][data-hidetype!=true]').length) {
        $tr.show();
    } else {
        $tr.hide();
    }
}

