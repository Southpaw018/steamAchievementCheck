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

    $('#mainTable').tablesorter({
        theme: 'grey',
        headerTemplate: '{content}{icon}',
        sortList: [[0, 0]],
        headers: {1: {sorter: false}},
        widgets: ['zebra']
    });

    $('#mainTable li').tsort();
});

function hideEmptyRows() {
    $('.earnedUnearnedList').each(function() {
        var tr = $(this).closest('tr');
        if ($(':visible', this).length) {
            tr.show();
        } else {
            tr.hide();
        }
    });
    $('#mainTable').trigger('update');
}

$(document).ready(function() {
    $('#playerFilter input').change(function(evt) {
        var name = evt.currentTarget.value,
            elems = $('.earnedUnearnedList li'),
            classesToShow;

        if (evt.currentTarget.checked) {
            classesToShow = $('#earnedUnearnedFilter input:checked').map(function() { return this.value; }).get();
            elems.each(function(index, elem) {
                var $elem = $(elem);
                if ($elem.text() === name) {
                    if ($.inArray(elem.className, classesToShow) === -1) {
                        $elem.hide();
                    } else {
                        $elem.show();
                    }
                }
            });
        } else {
            elems.each(function(index, elem) {
                var $elem = $(elem);
                if ($elem.text() === name) {
                    $elem.hide();
                }
            });
        }
        hideEmptyRows();
    });

    $('#earnedUnearnedFilter input').change(function(evt) {
        var elems = $('#mainTable .earnedUnearnedList li.' + evt.currentTarget.value),
            namesToShow;

        if (evt.currentTarget.checked) {
            namesToShow = $('#playerFilter input:checked').map(function() { return this.value; }).get();
            elems.each(function(index, elem) {
                var $elem = $(elem);
                if ($.inArray($elem.text(), namesToShow) === -1) {
                    $elem.hide();
                } else {
                    $elem.show();
                }
            });
        } else {
            elems.hide();
        }
        hideEmptyRows();
    });
});

