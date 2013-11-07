$(document).ready(function() {
	$.each(achievements, function() {
		var output = '';
		if ($(this.earned).length > 0) output = '<li class="earned">' + this.earned.join('</li><li class="earned">') + '</li>';
		if ($(this.unearned).length > 0) output += '<li class="unearned">' + this.unearned.join('</li><li class="unearned">') + '</li>';

		var pct = (typeof(this.percent) == "undefined") ? 0 : this.percent;
		if (output != '') $('#mainTable tbody').append('<tr><td>' + this.name + '<br /><small>' + this.description + '</small></td> <td><ul class="earnedUnearnedList">' + output + '</ul></td> <td><abbr title="' + pct + '%">' + pct.toFixed(2) + '%</abbr></td></tr>');
	});

	players = players.sort();
	$.each(players, function(x) {
		var name = players[x];
		$('#playerFilter').append('<input type="checkbox" value="' + name + '" id="' + name + 'PlayerFilter" />');// + name + '</input>');
		$('#playerFilter').append('<label for="' + name + 'PlayerFilter">' + name + '</label><br />');
	});

	$('#mainTable').tablesorter({
		theme: 'grey',
		headerTemplate: '{content}{icon}',
		sortList: [[0,0]],
		headers: {1: {sorter: false}},
		widgets: ['zebra']
	});

	$('#mainTable li').tsort();

	$('#runFilter').click(function() {
		var filterElements = $('#mainTable .earnedUnearnedList li');
		var playersToDisplay = $('#playerFilter input:checked').map(function() {return this.value;}).get();
		var achievementsToDisplay = $('#earnedUnearnedFilter input:checked').map(function() {return this.value;}).get();

		if (playersToDisplay.length == 0) playersToDisplay = players;
		if (achievementsToDisplay.length == 0) achievementsToDisplay = ["earned","unearned"];

		resetTable();
		filterElements.hide();
		$.each(filterElements, function() {
			if (
				$.inArray($(this).text(),playersToDisplay) != -1 &&
				$.inArray($(this).attr('class'),achievementsToDisplay) != -1
			) $(this).show();
		});

		hideEmptyRows();
	});
});

function resetTable() {
	$('#mainTable tr').show();	
	$('#mainTable .earnedUnearnedList li').show();
	$('#mainTable').trigger('update');
}

function hideEmptyRows() {
	$('.earnedUnearnedList').each(function() {if ($(':visible',this).length == 0) $(this).closest('tr').hide();});
	$('#mainTable').trigger('update');
}

//Stuff for executing filters on checkbox change instead of filter button
/*$(document).ready(function() {
	$('#playerFilter input').change(function() {
		hidePlayer($(this).val());
	});
	$('#earnedUnearnedFilter').change(function(sel) {
		hideEarnedUnearned($(this).val());
	});
});

function hideEarnedUnearned(type) {
	//if (!String.match(/earned|unearned|none/,"unearned")) return;
	resetTable();
	if (type == "none") return;
	$('#mainTable .earnedUnearnedList li.' + type).hide();
	hideEmptyRows();
}

function hidePlayer(player) {
	resetTable();
	if ($('#playerFilter input:checked').length == 0) return;
	var filterElements = $('#mainTable .earnedUnearnedList li');
	$('#playerFilter input:checked').each(function(x,elemX) {
		var player = $(elemX).val();
		filterElements.each(function(y,elemY) {
			if ($(elemY).text() != player) $(elemY).hide();
		});
	});
}*/