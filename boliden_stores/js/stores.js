stores = {
    printed: function(id) {
        var data = [{
            C_PRINTED: 1
        }];
        //		console.log( SOA004Client.post( id , data ) );
        SOA004Client.post(id, data, function(json) {
            console.log(json);
        });
    },

    picked: function(id) {
        var data = [{
            C_PICKED: 1
        }];
        //		console.log( SOA004Client.post( id , data ) );
        SOA004Client.post(id, data, function(json) {
            console.log(json);
        });
    },

    getUrlParams: function() {
        var url = location.href;
        consolelog("getUrlParams:" + url);
        var queryString = url.split("?")[1]
        if (queryString === undefined) {
          var lang = navigator.language.substr(navigator.language.length - 2).toUpperCase();
          if ( lang == "IE" || lang == "GB" ) {
            queryString = "SITE=TAR";
          } else if ( lang == "SE" ) {
            queryString = "SITE=GAR";
          } else if ( lang == "NO" ) {
            queryString = "SITE=ODD";
          }
        }
        queryString= queryString.toString().toUpperCase();
        var keyValuePairs = queryString === undefined ? "" : queryString.split("&");
        var keyValue, params = {};
        keyValuePairs.forEach(function(pair) {
            keyValue = pair.split("=");
            params[keyValue[0]] = decodeURIComponent(keyValue[1]).replace("+", " ");
        });
        return params
    },

    sortbydate: function(json) {
        var start = 0;
        var allrecords = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE.length
        var swap = true;
        var endstop = 1;
        var endstart = 0;
        var i = 0;
        var j = 0;
        var records = allrecords - 1;
        
        console.log("Before >");
		for (i = 0; i < allrecords; i++) {
                curr = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i];
            if ( curr.WONUM == "485386"){
                console.log(i+":      <"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
            }else
                console.log(i+":<"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
		};
        console.log("Before >");

        while (swap) {
            j = 0;
            swap = false;
            for (i = start; i < records; i++) {
                curr = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i];
                nextcurr = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i + 1];
                if (curr.REQUIREDDATE < nextcurr.REQUIREDDATE) {
                    swap = true
                    endstop = i;
                    json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i + 1] = curr;
                    json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i] = nextcurr;
                    j++;
                }
            }
//            if ( !swap ) break;
        console.log("halfway start>");
		for (k = 0; k < allrecords; k++) {
                curr = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[k];
            if ( curr.WONUM == "485386"){
                console.log(k+":      <"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
            }else
                console.log(k+":<"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
		};
        console.log("halfway end>");
            records--;
            endstart = endstop ;
            swap = false;
//                console.log(i+" last :<"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
            for (i = endstart; i > start; --i) {
                curr = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i];
//                console.log(i+" reverse :<"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
                nextcurr = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i - 1];
                if (curr.REQUIREDDATE > nextcurr.REQUIREDDATE) {
                    swap = true
                    start = i;
                    json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i - 1] = curr;
                    json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i] = nextcurr;
                    j++;
                }
            }
            start++;

        console.log("end of ph2 start>");
		for (k = 0; k < allrecords; k++) {
                curr = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[k];
            if ( curr.WONUM == "485386"){
                console.log(k+":      <"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
            }else
                console.log(k+":<"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
		};
        console.log("end of ph2 end>");

        }
        
                console.log("After >");
		for (i = 0; i < allrecords; i++) {
                curr = json.QueryREST_INRESERVEResponse.REST_INRESERVESet.INVRESERVE[i];
            if ( curr.WONUM == "485386"){
                console.log(i+":      <"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
            }else
                console.log(i+":<"+curr.INVRESERVEID+">:<"+curr.ITEMNUM+">:"+curr.REQUIREDDATE);
		};

    }


}
