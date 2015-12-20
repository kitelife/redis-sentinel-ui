/**
 * Created by xiayf on 15/12/4.
 */
var $ = jQuery = require('jquery');

$(function () {

    $('#submit_cmd').on('click', function ($e) {
        $e.preventDefault();
        $('#cmd_output').empty();

        var cmd = $('input[name="cmd"]').val(),
            cmdParts = cmd.split(' '),
            params = '';
        cmd = cmdParts[0];
        if (cmdParts.length > 1) {
            params = cmdParts.slice(1).join(' ');
        }

        var req = $.ajax({
            "method": "POST",
            "url": "/cmd",
            "data": {
                "cmd": cmd,
                "params": params
            },
            dataType: "json"
        });
        req.done(function (resp) {
            resp = '<pre>' + resp + '</pre>';
            $('#cmd_output').html(resp);
        });
    });
});
