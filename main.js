$(document).ready(function() {
    var $mainTable = $('#mainTable'),
        $tbody = $mainTable.find('tbody');

    $.each(achievements, function() {
        var $tr = $('<tr></tr>'),
            $list = $('<ul class="earnedUnearnedList"></ul>'),
            percent;

        if (this.earned) {
            $.each(this.earned, function(index, name) {
                $list.append($('<li class="earned"></li>').append(document.createTextNode(name)));
            });
        }
        if (this.unearned) {
            $.each(this.unearned, function(index, name) {
                $list.append($('<li class="unearned"></li>').append(document.createTextNode(name)));
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

    players = players.sort();
    $.each(players, function(x) {
        var name = players[x],
            li = $('<li></li>');
        li.append('<input type="checkbox" value="' + name + '" id="' + name + 'PlayerFilter" checked />');
        li.append('<label for="' + name + 'PlayerFilter">' + name + '</label>');
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
        var checked = evt.currentTarget.checked,
            $elems,
            classesToShow;

        $('#playerFilter input').prop('checked', checked);
        if (checked) {
            $elems = $('#mainTable .earnedUnearnedList li');
            classesToShow = $('#earnedUnearnedFilter input:checked').map(function() { return this.value; }).get();

            $elems.each(function() {
                var $this = $(this);
                if ($.inArray(this.className, classesToShow) === -1) {
                    $this.hide();
                } else {
                    $this.show();
                }
            });
            checkRowVisibility($elems);
        } else {
            $('#mainTable tbody tr').hide();
        }
    });

    $('#playerFilter input[value]').change(function(evt) {
        var name = evt.currentTarget.value,
            $elems = $('#mainTable .earnedUnearnedList li'),
            classesToShow;

        if (evt.currentTarget.checked) {
            classesToShow = $('#earnedUnearnedFilter input:checked').map(function() { return this.value; }).get();
            $elems.each(function() {
                var $this = $(this);
                if ($this.text() === name) {
                    if ($.inArray(this.className, classesToShow) === -1) {
                        $this.hide();
                    } else {
                        $this.show();
                    }
                    checkRowVisibility($this);
                }
            });
        } else {
            $elems.each(function() {
                var $this = $(this);
                if ($this.text() === name) {
                    $this.hide();
                }
                checkRowVisibility($this);
            });
        }
    });

    $('#earnedUnearnedFilter input').change(function(evt) {
        var $elems = $('#mainTable .earnedUnearnedList li.' + evt.currentTarget.value),
            namesToShow;

        if (evt.currentTarget.checked) {
            namesToShow = $('#playerFilter input:checked').map(function() { return this.value; }).get();
            $elems.each(function() {
                var $this = $(this);
                if ($.inArray($this.text(), namesToShow) === -1) {
                    $this.hide();
                } else {
                    $this.show();
                }
                checkRowVisibility($this);
            });
        } else {
            $elems.hide();
            checkRowVisibility($elems);
        }
    });

});

function checkRowVisibility($elems) {
    $elems.each(function() {
        var $tr = $(this).closest('tr');
        $tr.show();
        if (!$tr.find('li:visible').length) {
            $tr.hide();
        }
    });
}
