SOA004Client.init();
SOA004Client.system = "MAXIMO";
SOA004Client.dataobject = "REST_WO";

var interval = 600000;
var clock = 10000;
var days = 15;
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
  console.log("tick tock " + id + " " + val);
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
      //      PMNUM: "!~null~"
      //    }, {
      PARENT: "~null~"
    }, {
      STATUS: "=APPR,=INPRG,=SCH,=SCHE"
    }, {
      AMCREW: chosendept
      //    }, {
      //      SCHEDSTART: stext
      //    }, {
      //      CHANGEDATE: etext
    }]
  };
  return filter;
}


function builddeptbox1(xjson) {
  for (var j = deptBox.options.length - 1; j >= 0; j--) {
    deptBox.remove(j); // Clears all old values
  }
  //			var opt = document.createElement("OPTION");
  //			opt.value = currdept;
  //			opt.text = currdept;
  //			deptBox.add(opt);
  for (i = 0; i < xjson.QueryREST_WOResponse.REST_WOSet.WORKORDER.length; i++) {
    var curr = xjson.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
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

function sortbydept(xjson, dept) {
  var start = 0;
  var allrecords = xjson.QueryREST_WOResponse.REST_WOSet.WORKORDER.length;
  var swap = true;
  var endstop = 0;
  var endstart = 0;
  var i = 0;
  var records = allrecords - 1;

  outputconsole("dirty", json);

  // stript out repeated text from department names
  for (i = start; i < allrecords; ++i) {
    curr = xjson.QueryREST_WOResponse.REST_WOSet.WORKORDER[i];
    curr.LOCATIONS[0].DESCRIPTION = curr.LOCATIONS === undefined ? "Unknown" : curr.LOCATIONS[0].DESCRIPTION.replace('Mine ', '').replace(' Fleet', '');
    //				curr.LOCATIONS[0].DESCRIPTION = curr.LOCATIONS === undefined ?"Unknown": curr.LOCATIONS[0].DESCRIPTION.replace('Mine ','').replace(' Fleet','').replace(' Light','').replace(' Vehicles','');
    //				.replace(' Equipment','').replace('Mobile ','').replace('Equipment ','');
    xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = curr;
  };

  outputconsole("clean", xjson);

  while (swap) {
    swap = false;
    for (i = start; i < records; ++i) {
      curr = xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i];
      nextcurr = xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i + 1];
      var currdescription = compile(curr, dept);
      var nextdescription = compile(nextcurr, dept);
      if (currdescription > nextdescription) {
        swap = true
        endstop = i;
        xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i + 1] = curr;
        xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = nextcurr;
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
      curr = xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i];
      nextcurr = xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i - 1];
      var currdescription = compile(curr, dept);
      var nextdescription = compile(nextcurr, dept);
      if (currdescription < nextdescription) {
        swap = true
        endstop = i;
        xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i - 1] = curr;
        xjson.QueryREST_ASSETResponse.REST_ASSETSet.ASSET[i] = nextcurr;
      }
    }
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
    //    displaydate = new Date(curr.ACTSTART);
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

function buildtitle(tbl, heading, options) {
  tblhead = tbl.getElementsByTagName(heading)[0];
  tablelength = tblhead.rows.length;
  for (var i = 0; i < tablelength; i++) {
    tblhead.deleteRow(0);
  }

  tr = tblhead.insertRow(0);
  // add columns for the machine types currently using FAILURECODE
  td = tr.insertCell(-1);
  td.innerHTML = "WO. No"
  td.className = "wonum";
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
//  td = tr.insertCell(-1);
//  td.className = "datecol";
//  td.innerHTML = "Date"
  td = tr.insertCell(-1);
  td.className = "areacol";
  td.innerHTML = "Asset"
  for (i = daysback; i <= daysforward; i++) {
    td = tr.insertCell(-1);
    td.className = (i == 0 ? "datetoday" : "datecol");
    //    td.innerHTML = i == 0 ? "Today" : (i < 0 ? "-" : "+") + i;
    d = new Date();
    d.setHours(d.getHours() + (i * 24));
    //    td.innerHTML = (i == 0 ? "Today" : (i < 0 ? "" : "+") + i) +
//    td.innerHTML = (i == 0 ? (d.toLocaleDateString('en-GB', options)) : (i < 0 ? "" : "+") + i);
    td.innerHTML =  d.toLocaleDateString('en-GB', options);
  }

}

function displaytable() {
  var tr = null;
  var assetupcount = 0;
  var assetdowncount = 0;
  var assetservice = 0;
  var assetbreakdowncount = 0;
  var assettotal = 0;
  var cellLength = 0;
  var toptbl = null;
  var titletbl = document.getElementById("title");
  var toptbl = document.getElementById("tgt");
  tblhead = toptbl.getElementsByTagName("thead")[0];
  tbl = toptbl.getElementsByTagName("tbody")[0];
  var options = {
    day: 'numeric',
    month: 'short',
  };
  var optionsh = {
    day: 'numeric',
    month: 'short',
    hour: "numeric",
    minute: "numeric"
  };

  winlocale = window.navigator.userLanguage || window.navigator.language;
  if (json == null) {
    return;
  } else {
    if (json.name) {
      set("lastupdated", json.name + "@" + d.toLocaleString(winlocale, optionsh));
    } else {
      set("lastupdated", d.toLocaleString(winlocale, optionsh));
    }
  }

  var workcount = json.QueryREST_WOResponse.rsCount;
  var sectionname = null;
  var oldsectionname = null;
  var nocolumns = 0;
  var found = false;
  var asstitle;
  var options = {
    day: 'numeric',
    month: 'short',
  };
  var optionsh = {
    day: 'numeric',
    month: 'short',
    hour: "numeric",
    minute: "numeric"
  };

  while ( toptbl.rows.length>0){
    toptbl.deleteRow(0);
  }

  buildtitle(toptbl, 'thead', options);
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
          td.className = "wonum";
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
//          td = tr.insertCell(-1);
//          td.className = "datecol";
//          td.innerHTML = displaydate.toLocaleDateString('en-GB', options);
          //        displaydate = finddisplaydate(curr);
          //          displaydate = new Date(curr.SCHEDSTART);
          td.innerHTML = displaydate.toLocaleDateString('en-GB', options);
          td = tr.insertCell(-1);
          td.className = "areacol";
          td.innerHTML = curr.ASSET === undefined ? (curr.LOCATIONS === undefined ? "" : curr.LOCATIONS[0].DESCRIPTION) : curr.ASSET[0].DESCRIPTION;
          //          td.innerHTML = curr.LOCATIONS === undefined ? "unknown" : curr.LOCATIONS[0].DESCRIPTION;

          for (k = daysback; k <= daysforward; k++) {
            if (curr.WONUM == stopwonum)
              stop = 1;
            td = tr.insertCell(-1);
            td.className = (k == 0 ? "datetoday" : "datecol");

            diffDays = daysDiff(d, displaydate);

            if (diffDays == k) {
              found = true;
              //              td.innerHTML = curr.WONUM;
              if (curr.STATUS == 'INPRG') {
                statusdate = new Date(curr.STATUSDATE);
                diffDays = daysDiff(statusdate, displaydate);
                td.className = curr.STATUS
              } else if (curr.STATUS == 'APPR') {
                td.className = "assetup"
              } else if (curr.STATUS == 'SCH') {
                td.className = "assetservice"
              }
              td.className = curr.STATUS
            }
            if (!found) {

            }
          }
          assetupcount += 1;
          assettotal += 1;
          assetdowncount += curr.STATUS === "APPR" ? 1 : 0;
          assetbreakdowncount += curr.STATUS === "INPRG" ? 1 : 0;
          assetservice += curr.STATUS == "SCH" ? 1 : 0;
        }
      }
    }
  }
  set("uppct", "Total " + assetupcount + "  (" + (Math.round(1000.0 * assetupcount / assettotal) / 10.0) + "%)");
  set("approvedsummary", "Approved   " + assetdowncount + "  (" + (Math.round(1000.0 * assetdowncount / assettotal) / 10.0) + "%)");
  set("servicepct", "Scheduled:" + assetservice + "  (" + (Math.round(1000.0 * assetservice / assettotal) / 10.0) + "%)");
  set("breakpct", "In Progress " + assetbreakdowncount + "  (" + (Math.round(1000.0 * assetbreakdowncount / assettotal) / 10.0) + "%)");

}

function sortrecords() {
  if (json) {
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
}

function refresh() {
  displaytable();
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
  if (crewjson.name) {
    set("lastupdated", crewjson.name + "@" + d.toLocaleString());
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
  set("lastupdated", "Choose a CREW from the list below");
}

function update() {
  chosenpriority = priBox.options[priBox.selectedIndex].value;
  var pickindex = deptBox.selectedIndex;
  if (pickindex > -1) {
    chosendept = deptBox.options[deptBox.selectedIndex].value;
    startdate = new Date();
    startdate.setHours(startdate.getHours() - (52 * days) * 24);
    enddate = new Date();
    enddate.setHours(enddate.getHours() + days * 24);
    SOA004Client.dataobject = "REST_WO";
    newjson = SOA004Client.get(setfilter(startdate, enddate));
    if (!(newjson == null)) {
      if (newjson.name) {
        set("lastupdated", newjson.name);
      } else {
        json = newjson;
        sortrecords();
        refresh();
      }
    }
    //			sortbydept ( json, true );
  }
}
