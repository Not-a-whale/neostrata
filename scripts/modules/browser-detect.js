define( ['modules/jquery-mozu' ],
    function ( $ ) {
    
        var BrowserDetect = {
            detect: function () {
                var e, r = navigator.userAgent, t = r.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
                return /trident/i.test(t[1]) ? (e = /\brv[ :]+(\d+)/g.exec(r) || [],
                    {
                        name: "IE",
                        version: e[1] || ""
                    }) : "Chrome" === t[1] && null !== (e = r.match(/\bOPR|Edge\/(\d+)/)) ? {
                    name: "Opera",
                    version: e[1]
                } : (t = t[2] ? [t[1], t[2]] : [navigator.appName, navigator.appVersion, "-?"],
                null !== (e = r.match(/version\/(\d+)/i)) && t.splice(1, 1, e[1]),
                    {
                        name: t[0],
                        version: t[1]
                    });
            }
        };
        
    $( document ).ready( function() {
        var info = BrowserDetect.detect();
        if( info.name && info.version && info.name.toLowerCase() === 'msie' && info.version <= 11 ){
            $( '.browser-detection-wrapper' ).show();
        }
    });
    
    
    return BrowserDetect;
});