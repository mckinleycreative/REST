maximo = {
    
    printed: function (id) {
        var data = [{C_PRINTED:1}];
		console.log( SOA004Client.post( id , data ) );
        SOA004Client.post(id , data, function( json ) {console.log( json );});
    },

    picked: function (id) {
        var data = [{C_PICKED:1}];
		console.log( SOA004Client.post( id , data ) );
        SOA004Client.post( id , data, function( json ) {console.log( json );} );
    },
	
	startTime: function () {
			var today = new Date();
			var h = today.getHours();
			var m = today.getMinutes();
			var s = today.getSeconds();
			m = maximo.checkTime(m);
			s = maximo.checkTime(s);
			document.getElementById('datetime').innerHTML = " Asset Status          "+
			h + ":" + m + ":" + s;
			var t = setTimeout(maximo.startTime, 500);
		},
		
	checkTime: function (i) {
			if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
			return i;
		}
}