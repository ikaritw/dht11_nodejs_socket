var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {

    var hoursAgo = req.body.hoursAgo || req.query.hoursAgo;
    hoursAgo = hoursAgo || "3";

    hoursAgo = parseInt(hoursAgo, 10);

    var options = {
        from: Date.now() - hoursAgo * 60 * 60 * 1000,
        until: Date.now(),
        limit: 60 * 60 * hoursAgo,
        start: 0,
        order: 'asc',
        fields: ['timestamp', 'humidity', 'temperature']
    };

    //
    // Find items logged between today and yesterday.
    //
    sensorLog.query(options, function(err, results) {
        if (err) {
            res.json(err);
            throw err;
        } else {
            res.json(results);
        }
    });
});

router.get('/', function(req, res) {
    var result = {
        'title': 'WinstonQuery'
    };
    res.render('WinstonQuery', result);
});


module.exports = router;
