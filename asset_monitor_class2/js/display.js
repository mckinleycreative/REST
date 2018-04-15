function displaynew() {
  if (!(newjson== null)) {
    if (!(newjson.QueryREST_ASSETWResponse.rsTotal === undefined)) {
      var newrecords = newjson.QueryREST_ASSETWResponse.rsTotal;
      if (newrecords > 0) {
        swapnew();
        var i = 0;
        var uexists = false;
        var dexists = false;
        var umessage = "";
        var dmessage = "";
        d = new Date();
        set("messup", null);
        set("messdown", null);
        document.getElementById("output").style.display = '';
        document.getElementById("messup").style.display = '';
        document.getElementById("messdown").style.display = '';
        for (i; i < newrecords; ++i) {
          newcurr = newjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
          department = newcurr.LOCATIONS[0].DESCRIPTION;
          if ((newcurr.PRIORITY <= chosenpriority) &&
            (chosendept == department || chosendept == "All") &&
            ((!newcurr.ISRUNNING && running == "Down") ||
              running == "All" ||
              (newcurr.ISRUNNING && running == "Available"))) {
            var locald = new Date(newcurr.CHANGEDATE);
            message = maximo.leftpad(daysBetween(locald, d), 5, " ") + " : " + newcurr.ASSETNUM + (chosenpriority > 1 ? " (" + newcurr.PRIORITY + ") " : " ") + newcurr.DESCRIPTION;
            if (newcurr.ISRUNNING == 0) {
              dmessage += dexists ? "<br/>" : "";
              dmessage += message
              dexists = true;
            } else {
              umessage += uexists ? "<br/>" : "";
              umessage += message
              uexists = true;
            }
          }
        };
        if (uexists) set("messup", umessage);
        if (dexists) set("messdown", dmessage);
        if (!uexists && !dexists) {
          document.getElementById("output").style.display = 'none';
        } else {
          document.getElementById("output").style.display = '';
        }
        if (!uexists) {
          document.getElementById("messup").style.display = 'none';
        }
        if (!dexists) {
          document.getElementById("messdown").style.display = 'none';
        }
      } else {
        document.getElementById("output").style.display = 'none';
      }
    } else {
      document.getElementById("output").style.display = 'none';
    }
  }
}
