define(['drawity'],
function(drawity) {

    var config = {
        historyLimit: 7,
        minWidth: 20,
        minHeight: 20
    };
    
    function getProxyUrl(url) {
        console.log('getProxyUrl', url);
        callback('http://localhost/cv/debug/13.png');
    }
    
    var paint = null;

    return function() {
        if (!paint) {
            paint = new drawity.Paint(null, config);
            //paint.on('getProxyUrl', getProxyUrl);
            //paint.tools.current('picker');
        }
        return paint;
    };
    
});