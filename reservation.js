reservation = {
    
    printed: function (id) {
        var data = [{C_PRINTED:1}];
		console.log( SOA004Client.post( id , data ) );
        SOA004Client.postasync(id , data, function( json ) {console.log( json );});
    },

    picked: function (id) {
        var data = [{C_PICKED:1}];
		console.log( SOA004Client.post( id , data ) );
        SOA004Client.postasync( id , data, function( json ) {console.log( json );} );
    }

}