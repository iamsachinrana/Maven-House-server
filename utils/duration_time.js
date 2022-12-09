function datediff(first, second) {
    return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

function parseDate(str) {
    var mdy = str.split('-');
    return new Date(mdy[2], mdy[0] - 1, mdy[1]);
}

module.exports = { datediff, parseDate };

