//*
// * Sample SOA004 JS Client
// *
// * Initialize first by calling
// * SOA004Client.init();
// * Set system and data object to the properties of the class
// *        SOA004Clienbt.system="MAXIMO";
// *        SOA004Client.dataobject="REST_INRESERVE";
// *
// * Create a filter:
// *        var filter = {maxRows:10,fields:[{SITEID:TAR}]};
// * Get data from the source system
// *        var json = SOA004Client.get( filter );
// *
// *
// *To post data create a data object
// *		var data = [{C_PICKINDICATOR:1}];
// *Update a post using the ID
// *		SOA004Client.post( "261214", data );
// *
// *Methods can be run async as well using the getasynbc and postasync, adding a callback method to the methods parameters.
// The parsed json will be passed to the callback as it's only argument
// */

SOA004Client = {
	//_RESTURI: "http://bolsrv0138.boliden.internal:7802/SOA004/rest/BI/",
	// _RESTURI: "http://bolsrv0461.boliden.internal:4181/",	// TEST
   //_RESTURI: "http://bolsrv0461.boliden.internal:6081/",	// QA
   _RESTURI: "http://bolsrv0461.boliden.internal:8081/",	// PROD
	_AUTHSTR: "mxIntBi", //PROD
	//_AUTHSTR: "test", // TEST
	AJAX: null,
	get: function (filter, id, fields) {
		try {
		if (this.AJAX === null) {
            return null;
        }
		if (this.system === "" || this.dataobject === "") {
            return null;
        }
		var url = this._RESTURI + this.system + "/" + this.dataobject;
		if (id) {
            url += "/" + id;
        }
		url += "?filter=" + JSON.stringify(filter);
		this.AJAX.open("GET", url, false);
		this.AJAX.setRequestHeader("Authorization", "Basic " + this._AUTHSTR);
		this.AJAX.send();
		return JSON.parse(this.AJAX.responseText);
	} catch (e) {
	 return e;
	}
	},
	getasync: function (filter, id, fields, callback) {
		if (this.AJAX === null) {
            return null;
        }
		if (this.system === "" || this.dataobject === "") {
            return null;
        }
		var url = this._RESTURI + this.system + "/" + this.dataobject;
		if (id) {
            url += "/" + id;
        }
        url += "?filter=" + JSON.stringify(filter);
		this.AJAX.open("GET", url, true);
		this.AJAX.setRequestHeader("Authorization", "Basic " + this._AUTHSTR);
		this.AJAX.onreadystatechange = function () {
			if (this.readyState === 4) {
                callback(JSON.parse(this.responseText));
			}
		};
		this.AJAX.send();
	},
	init: function () {
		this.AJAX = (window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
	},
	post: function (id, data) {
		if (this.AJAX === null) {
            return null;
        }
		if (this.system === "" || this.dataobject === "" || !data) {
            return null;
        }
		var url = this._RESTURI + this.system + "/" + this.dataobject;
		if (id) {
            url += "/" + id;
        }
		url += "?data=" + JSON.stringify(data);
		this.AJAX.open("POST", url, false);
		this.AJAX.setRequestHeader("Authorization", "Basic " + this._AUTHSTR);
		this.AJAX.send();
		return JSON.parse(this.AJAX.responseText);
	},
	postasync: function (id, data, callback) {
		if (this.AJAX === null) {
            return null;
        }
		if (this.system === "" || this.dataobject === "" || !data) {
            return null;
        }
		var url = this._RESTURI + this.system + "/" + this.dataobject;
		if (id) {
            url += "/" + id;
        }
		url += "?data=" + JSON.stringify(data);
		this.AJAX.open("POST", url, true);
		this.AJAX.setRequestHeader("Authorization", "Basic " + this._AUTHSTR);
		this.AJAX.onreadystatechange = function () {
			if (this.readyState === 4) {
				callback(JSON.parse(this.responseText));
			}
		};
		this.AJAX.send();
	},

	system: "",
	dataobject: ""
};
