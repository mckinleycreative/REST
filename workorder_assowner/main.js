SOA004Client.init();
SOA004Client.system = "MAXIMO";
SOA004Client.dataobject = "REST_WO";

var interval = 600000;
var days = 7;
var daysback = -7;
var daysforward = 7;
var debug = false;
var json = null;
var HeaderCells;
var stopwonum = "669158";
//var deptBox = document.getElementById('department');
//var priBox = document.getElementById('priority');
//var runningBox = document.getElementById('running');

function set(id, val) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = val;
}


function compile(curr, dept) {
  var d = new Date();
  var currdescription = curr.LOCATIONS[0].DESCRIPTION;
  currdescription += curr.FAILURECODE[0].DESCRIPTION;
  currdescription += curr.ASSET[0].ISRUNNING;
  //      locald =  curr.ASSETSTATUS ? new Date(curr.ASSETSTATUS[0].CHANGEDATE) : new Date(curr.CHANGEDATE);
  locald = curr.ASSETSTATUS ? new Date(curr.ASSETSTATUS[0].CHANGEDATE) : new Date(curr.CHANGEDATE);
  downtime = daysDiff(locald, d);
  currdescription += downtime;
  currdescription += curr.ASSETNUM;
  //					console.log('desc:'+currdescription);
  return currdescription;
}

function outputconsole(text, json) {
  var start = 0;
  var allrecords = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET.length;
  var i = 0;
  var records = allrecords - 1;
  if (debug) {
    for (i = start; i < allrecords; ++i) {
      curr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i];
      console.log(text + "::" + compile(curr));
    };
    console.log("===================");
  }
}

function setfilter(sdate, edate) {
  var filter;
  // temp to cause delta data set
  var stext = ">" + sdate.toISOString();
  var etext = "<=" + edate.toISOString();
  filter = {
    maxrows: 600,
    offset: 0,
    fields: [{
      SITEID: "=TAR"
    }, {
      HISTORYFLAG: "N"
    }, {
      ISTASK: "N"
    }, {
      PMNUM: "!~null~"
    }, {
      PARENT: "~null~"
    }, {
      STATUS: "=APPR,=INPRG,=SCH,=SCHE"
    }, {
      AMCREW: chosendept
    }, {
      SCHEDSTART: stext
      //    }, {
      //      CHANGEDATE: etext
    }]
  };
  return filter;
}


function builddeptbox1(json) {
  for (var j = deptBox.options.length - 1; j >= 0; j--) {
    deptBox.remove(j); // Clears all old values
  }
  //			var opt = document.createElement("OPTION");
  //			opt.value = currdept;
  //			opt.text = currdept;
  //			deptBox.add(opt);
  for (i = 0; i < json.QueryREST_WOResponse.REST_WOSet.WORKORDER.length; i++) {
    var curr = json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
    department = curr.AMCREW[0].DESCRIPTION;
    if (currdept != department) {
      var opt = document.createElement("OPTION");
      opt.value = department;
      opt.text = department;
      deptBox.add(opt);
    }
    currdept = department;
  }
  deptBox.value = chosendept;
}

function sortbydept(json, dept) {
  var start = 0;
  var allrecords = json.QueryREST_WOResponse.REST_WOSet.WORKORDER.length;
  var swap = true;
  var endstop = 0;
  var endstart = 0;
  var i = 0;
  var records = allrecords - 1;

  outputconsole("dirty", json);

  // stript out repeated text from department names
  for (i = start; i < allrecords; ++i) {
    curr = json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
    curr.LOCATIONS[0].DESCRIPTION = curr.LOCATIONS === undefined ? "Unknown" : curr.LOCATIONS[0].DESCRIPTION.replace('Mine ', '').replace(' Fleet', '');
    //				curr.LOCATIONS[0].DESCRIPTION = curr.LOCATIONS === undefined ?"Unknown": curr.LOCATIONS[0].DESCRIPTION.replace('Mine ','').replace(' Fleet','').replace(' Light','').replace(' Vehicles','');
    //				.replace(' Equipment','').replace('Mobile ','').replace('Equipment ','');
    json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = curr;
  };

  outputconsole("clean", json);

  while (swap) {
    swap = false;
    for (i = start; i < records; ++i) {
      curr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i];
      nextcurr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i + 1];
      var currdescription = compile(curr, dept);
      var nextdescription = compile(nextcurr, dept);
      if (currdescription > nextdescription) {
        swap = true
        endstop = i;
        json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i + 1] = curr;
        json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = nextcurr;
        //						displaytable(json);
      }
    }

    outputconsole("mid:" + start + ":" + endstop, json);
    records--;
    //                records--;
    endstart = endstop - 1;
    if (!swap) break;

    swap = false;
    for (i = records; i > start; --i) {
      curr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i];
      nextcurr = json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i - 1];
      var currdescription = compile(curr, dept);
      var nextdescription = compile(nextcurr, dept);
      if (currdescription < nextdescription) {
        swap = true
        endstop = i;
        json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i - 1] = curr;
        json.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = nextcurr;
      }
    }
    //                start++;
    outputconsole("end:" + start + ":" + endstop, json);
  }
  outputconsole("final", json);
}

function finddisplaydate(curr) {
  //  if (curr.STATUS == "INPRG") {
  //    displaydate = new Date(curr.CHANGEDATE);
  //  } else {
  if (curr.WONUM == stopwonum)
    stop = 1;

  if (curr.STATUS == 'INPRG') {
    displaydate = new Date(curr.STATUSDATE);
  } else {
    if (curr.SCHEDSTART) {
      displaydate = new Date(curr.SCHEDSTART);
    } else if (curr.TARGSTARTDATE) {
      displaydate = new Date(curr.TARGSTARTDATE);
    } else {
      displaydate = new Date(curr.REPORTDATE);
    }
  }
  return displaydate;
}


function displaytable(json) {
  var tr = null;
  var assetupcount = 0;
  var assetdowncount = 0;
  var assetservice = 0;
  var assetbreakdowncount = 0;
  var assettotal = 0;
  var cellLength = 0;
  //  var d = new Date();
  var toptbl = null;
  var toptbl = document.getElementById("tgt");
  tblhead = toptbl.getElementsByTagName("thead")[0];
  tbl = toptbl.getElementsByTagName("tbody")[0];

  set("lastupdated", d.toLocaleString());

  var workcount = json.QueryREST_WOResponse.rsCount;
  var sectionname = null;
  var oldsectionname = null;
  var nocolumns = 0;
  var found = false;
  var asstitle;
  var options = {
    day: 'numeric',
    month: 'short',
    year: '2-digit'
  };


  //			builddeptbox ( json );

  tablelength = toptbl.rows.length;
  for (var i = 0; i < tablelength; i++) {
    toptbl.deleteRow(0);
  }
  // start rebuild the header with the single version of the description
  tr = tblhead.insertRow(0);

  // add columns for the machine types currently using FAILURECODE
  td = tr.insertCell(-1);
  td.innerHTML = "Wo."
  td = tr.insertCell(-1);
  td.className = "desc";
  td.innerHTML = "Description"
  //  td = tr.insertCell(-1);
  //  td.innerHTML = "Asset"
  td = tr.insertCell(-1);
  td.className = "status";
  td.innerHTML = "Status"
  td = tr.insertCell(-1);
  td.className = "status";
  td.innerHTML = "Type"
  //  td = tr.insertCell(-1);
  //  td.innerHTML = "Priority"
  td = tr.insertCell(-1);
  td.className = "datecol";
  td.innerHTML = "Date"
  td = tr.insertCell(-1);
  td.className = "areacol";
  td.innerHTML = "Area"
  for (i = daysback; i <= daysforward; i++) {
    td = tr.insertCell(-1);
    td.className = (i == 0 ? "datetoday" : "datecol");
    //    td.innerHTML = i == 0 ? "Today" : (i < 0 ? "-" : "+") + i;
    d = new Date();
    d.setHours(d.getHours() + (i * 24));
    td.innerHTML = (i == 0 ? "Today" : (i < 0 ? "" : "+") + i) + "<br>" + d.toLocaleDateString('en-GB', options);
  }

  HeaderCells = toptbl.rows.item(0).cells;
  cellLength = HeaderCells === undefined ? 0 : HeaderCells.length;

  if (cellLength < 1) {
    toptbl.deleteRow(0);
    tr = toptbl.insertRow(0);
    td = tr.insertCell(-1);
    td.innerHTML = cellLength + " type(s) found but not with chosen options";
    return;
  }

  d = new Date();

  for (i = 0; i < workcount; i++) {
    var curr = json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
    curprior = curr.CALCPRIORITY;
    if (chosenpriority >= curprior) {
      if (a = 1) {
        displaydate = finddisplaydate(curr);
        //displaydate = new Date(curr.SCHEDSTART);
        daysbetween = daysDiff(d, displaydate)
        if (daysbetween >= daysback &&
          daysbetween <= daysforward) {
          tr = tbl.insertRow(-1);
          td = tr.insertCell(-1);
          td.innerHTML = curr.WONUM;
          td = tr.insertCell(-1);
          td.className = "desc";
          td.innerHTML = curr.DESCRIPTION;
          //      td = tr.insertCell(-1);
          //      td.innerHTML = curr.ASSETNUM === undefined ? "" : curr.ASSETNUM;
          td = tr.insertCell(-1);
          td.className = "status";
          td.innerHTML = curr.STATUS;
          td = tr.insertCell(-1);
          td.className = "status";
          td.innerHTML = curr.WORKTYPE;
          //      td = tr.insertCell(-1);
          //      td.innerHTML = curr.CALCPRIORITY;
          td = tr.insertCell(-1);
          td.className = "datecol";
          //        displaydate = finddisplaydate(curr);
          displaydate = new Date(curr.SCHEDSTART);
          td.innerHTML = displaydate.toLocaleDateString('en-GB', options);
          td = tr.insertCell(-1);
          td.className = "areacol";
          td.innerHTML = curr.LOCATIONS === undefined ? "unknown" : curr.LOCATIONS[0].DESCRIPTION;

          for (k = daysback; k <= daysforward; k++) {
            if (curr.WONUM == stopwonum)
              stop = 1;
            td = tr.insertCell(-1);
            td.className = (k == 0 ? "datetoday" : "datecol");

            diffDays = daysDiff(d, displaydate);

            if (diffDays == k) {
              found = true;
              td.innerHTML = curr.WONUM;
            }
            if (!found) {

            }
          }
          assetupcount += 1;
          assettotal += 1;
          assetdowncount += curr.STATUS === "APPR" ? 1 : 0;
          assetbreakdowncount += curr.STATUS === "INPRG" ? 1 : 0;
        }

      }
    }
  }
  set("assetupcount", assetupcount);
  set("assetdowncount", assetdowncount);
  set("assetservice", assetservice);
  set("assetbreakdowncount", assetbreakdowncount);
  set("uppct", (Math.round(1000.0 * assetupcount / assettotal) / 10.0) + "%");
  set("downpct", (Math.round(1000.0 * assetdowncount / assettotal) / 10.0) + "%");
  set("servicepct", (Math.round(1000.0 * assetservice / assettotal) / 10.0) + "%");
  set("breakpct", (Math.round(1000.0 * assetbreakdowncount / assettotal) / 10.0) + "%");

}

function sortrecords(json) {
  j = json.QueryREST_WOResponse.rsCount;
  var swap = true;
  while (swap) {
    swap = false;
    for (i = 0; i < j - 1; ++i) {
      var curr = json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
      var nextcurr = json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i + 1];
      var displaydate = finddisplaydate(curr);
      var nextdisplaydate = finddisplaydate(nextcurr);
      if (minsDiff(nextdisplaydate, displaydate) > 0) {
        swap = true;
        endstop = i;
        //        console.log("loop:" + i, curr.WONUM, displaydate, nextdisplaydate);
        json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i + 1] = curr;
        json.QueryREST_WOResponse.REST_WOSet.WORKORDER[i] = nextcurr;
      }
    }
  }

}


function refresh(json) {
  sortrecords(json);
  displaytable(json);
}

function daysDiffx(date1, date2) {
  // Get 1 day in milliseconds
  var one_day = 1000 * 60 * 60;
  var one_hour = 1000 * 60 * 60;
  var one_min = 1000 * 60;
  var mins;
  var hours;
  // Convert both dates to milliseconds
  // Calculate the difference in milliseconds
  // Convert back to days and return
  mins = (date2.getTime() - date1.getTime()) / one_min;
  mins = "0" + Math.round(mins);
  while (mins.length < 10) {
    mins = "0" + mins;
  }
  return mins;
}


function daysDiff(date1, date2) {
  // Get 1 minute in milliseconds
  return Math.round(minsDiff(date1, date2) / 60 / 24);
}

function minsDiff(date1, date2) {
  // Get 1 minute in milliseconds
  var one_min = 1000 * 60;
  var mins;
  mins = (date2.getTime() - date1.getTime()) / one_min;
  return Math.round(mins);
}

function daysBetween(date1, date2) {
  // Get 1 day in milliseconds
  var one_day = 1000 * 60 * 60;
  var one_hour = 1000 * 60 * 60;
  var one_min = 1000 * 60;
  var mins;
  var hours;
  // Convert both dates to milliseconds
  // Calculate the difference in milliseconds
  // Convert back to days and return
  mins = (date2.getTime() - date1.getTime()) / one_min;
  mins = Math.round(mins);
  hours = (mins / 60.0);
  hours = Math.round(hours);
  mins = mins - hours * 60.0;
  if (hours == 0) {
    downtime = mins + " M";
  } else if (hours > 47) {
    downtime = Math.round(hours / 2.4) / 10.0 + " D";
  } else {
    downtime = hours + " H";
  }
  return downtime;
}

function buildcrewbox() {
  var deptBox = document.getElementById('department');
  d = new Date();
  var filter = {
    maxrows: 600,
    offset: 0,
    fields: [{
      ORGID: "=IE01"
    }, {
      STATUS: "=ACTIVE"
    }]
  };
  SOA004Client.dataobject = "REST_CREW";
  crewjson = SOA004Client.get(filter);
  if (!crewjson) {
    set("lastupdated", "Comms Error @" + d.toLocaleString());
    return;
  }
  if (!(deptBox == null)) {
    for (var j = deptBox.options.length - 1; j >= 0; j--) {
      deptBox.remove(j); // Clears all old values
    }
  }
  currdept = "All";
  //			var opt = document.createElement("OPTION");
  //			opt.value = currdept;
  //			opt.text = currdept;
  //			deptBox.add(opt);
  j = crewjson.QueryREST_CREWResponse.rsCount;
  var swap = true;
  while (swap) {
    swap = false;
    for (i = 0; i < j - 1; ++i) {
      var curr = crewjson.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i];
      var nextcurr = crewjson.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i + 1];
      var currdescription = curr.DESCRIPTION;
      var nextdescription = nextcurr.DESCRIPTION;
      if (currdescription > nextdescription) {
        swap = true;
        endstop = i;
        crewjson.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i + 1] = curr;
        crewjson.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i] = nextcurr;
      }
    }
  }
  var opt = document.createElement("OPTION");
  opt.value = "";
  opt.text = "Select a crew from the dropdown list";
  deptBox.add(opt);
  for (i = 0; i < crewjson.QueryREST_CREWResponse.rsCount; i++) {
    var curr = crewjson.QueryREST_CREWResponse.REST_CREWSet.AMCREW[i];
    department = curr.DESCRIPTION;
    if (currdept != department) {
      var opt = document.createElement("OPTION");
      opt.value = curr.AMCREW;
      opt.text = department;
      deptBox.add(opt);
    }
    currdept = department;
  }
  deptBox.value = chosendept;
}


function update() {
  var d = new Date();
  chosenpriority = priBox.options[priBox.selectedIndex].value;
  var pickindex = deptBox.selectedIndex;
  if (pickindex > -1) {
    chosendept = deptBox.options[deptBox.selectedIndex].value;
    startdate = new Date();
    startdate.setHours(startdate.getHours() - (52 * days) * 24);
    enddate = new Date();
    enddate.setHours(enddate.getHours() + days * 24);
    SOA004Client.dataobject = "REST_WO";
    json = SOA004Client.get(setfilter(startdate, enddate));
    //			sortbydept ( json, true );
    refresh(json);
    set("lastupdated", d.toLocaleString());
  }
}
