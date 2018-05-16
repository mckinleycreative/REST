SOA004Client.init();
SOA004Client.system = "MAXIMO";
SOA004Client.dataobject = "REST_ASSETW";

var interval = 300000;
var day = 86400000;
var lookback = 5;
var lastreload = new Date();
var debug = false;
var chosenpriority = 1;
var chosendept = "All";
var running = "All";
var json = null;
var newjson = null;
var HeaderCells;
var startdate = new Date();
var displaylevel = 1;
var assetupcount = 0;
var assetdowncount = 0;
var assetservice = 0;
var assetbreakdowncount = 0;
var assettotal = 0;
var refreshpid = null;
var updatepid = null;
var waiting = false;

function set(id, val) {
  outputconsole("set() ::" + id + ":" + val);
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = val;
}

function setlastrun(id, message, sdate) {
  tip = '<span class="tooltiptext">';
  tip += "<b><span style='text-decoration: underline;'>Debug information</span></b><br/>";
  tip += "Data Interval " + interval / 1000 / 60 + " minutes";
  tip += "<br/>Screen Refresh Interval " + interval / 5 / 1000 / 60 + " minutes";
  tip += "<br/>Total Asset Count:" + (json == null ? "" : (this.json.name === undefined ? this.json.QueryREST_ASSETWResponse.rsTotal : this.json.name));
  tip += "<br/>Delta Asset Count:" + (newjson == null ? "" : (this.newjson.name === undefined ? this.newjson.QueryREST_ASSETWResponse.rsTotal : this.newjson.name));
  tip += "<br/><br/></span>";
  set(id, message + sdate + tip);
}

function getbyid(id) {
  var el = document.getElementById(id);
  if (!el) return;
  return (el.innerHTML);
}

function outputconsole(text, outjson) {
  if (debug) {
    if (outjson === undefined) {
      console.log(text);
    } else {
      var j = 0;
      var i = 0;
      if (outjson.QueryREST_ASSETWResponse === undefined) {
        console.log(text + "::" + JSON.stringify(outjson));
      } else {
        var allrecords = outjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET.length;
        for (i = j; i < allrecords; ++i) {
          curr = outjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
          console.log(text + "::" + compile(curr));
        }
      }
      console.log("===================");
    }
  }
}

function refresh() {
  displaytable(json);
  displaynew();
  console.log("refresh");
}
/*
function reload_async() {
  tempjson = null;
  setlastrun("lastrun", "Initialising data .....", startdate.toLocaleTimeString());
  tempYear = new Date(startdate);
  tempYear.setFullYear(1900);
  json = null;
  SOA004Client.getasync(setfilter(tempYear), null, null, function(tempjson) {
    console.log("loaded");
    json = tempjson;
    update();
    refresh();
  });
}
*/

function reload() {
  tempjson = null;
  setlastrun("lastrun", "Initialising data .....", startdate.toLocaleTimeString());
  tempYear = new Date(startdate);
  tempYear.setFullYear(1900);
  json = null;
  tempjson = SOA004Client.get(setfilter(tempYear), null, null);
  if ( tempjson && !tempjson.name ) {
    json = tempjson;
    console.log("loaded");
    update();
  } else {
    console.log("error loaded");
  }

};

/*
function update_async() {
  if (!waiting) {
    setlastrun("lastrun", "Waiting on network.....", startdate.toLocaleTimeString());
  }
  waiting = true;
  tempjson = null;
  targetdate = new Date(startdate);
  targetdate.setMinutes(targetdate.getMinutes() - lookback);
  SOA004Client.getasync(setfilter(targetdate), null, null, function(tempjson) {
    if (!tempjson == null) {
      newjson = tempjson;
      if (newjson.name) {
        console.log(newjson);
        setlastrun("lastrun", newjson.name + " at ", targetdate.toLocaleString());
      } else {
        startdate = new Date();
      }
    }
    console.log("update back");
    mergejson(json, newjson);
    refresh();
    setlastrun("lastrun", "Last Run:<br/>", startdate.toLocaleString());
    waiting = false;
  });
  setlastrun("lastrun", "Waiting on Data.....", startdate.toLocaleTimeString());
};
*/
function update() {
  if (!waiting) {
    setlastrun("lastrun", "Waiting on network.....", startdate.toLocaleTimeString());
  }
  waiting = true;
  tempjson = null;
  targetdate = new Date(startdate);
  targetdate.setMinutes(targetdate.getMinutes() - lookback);
  tempjson = SOA004Client.get(setfilter(targetdate), null, null);
  if (!(tempjson == null)) {
    newjson = tempjson;
    if (newjson.name) {
      console.log(newjson);
      setlastrun("lastrun", newjson.name + " at ", targetdate.toLocaleString());
    } else {
      startdate = new Date();
    }
  }
  console.log("update back");
  mergejson(json, newjson);
  sortbydept(json, true);
  refresh();
  setlastrun("lastrun", "Last Run: ", startdate.toLocaleString());
  waiting = false;
};

function compile(curr, downtime) {
  var d = new Date();
  var currdescription = curr.LOCATIONS[0].DESCRIPTION;
  //            currdescription += curr.CLASSSTRUCTURE[0].DESCRIPTION;
  currdescription += ".";
  currdescription += curr.CLASSSTRUCTURE[0].DESCRIPTION;
  currdescription += ".";
  currdescription += curr.ISRUNNING === false ? 0 : 1;
  currdescription += ".";
  locald = curr.ASSETSTATUS ? new Date(curr.ASSETSTATUS[0].CHANGEDATE) : new Date(curr.CHANGEDATE);
  downtime = Math.round(daysDiff(locald, d));
  currdescription += maximo.leftpad(downtime, 10, "0");
  return currdescription;
}

function builddeptbox(json) {
  for (var j = deptBox.options.length - 1; j >= 0; j--) {
    deptBox.remove(j); // Clears all old values
  }
  currdept = "All";
  var opt = document.createElement("OPTION");
  opt.value = currdept;
  opt.text = currdept;
  deptBox.add(opt);
  for (i = 0; i < json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET.length; i++) {
    var curr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
    department = curr.LOCATIONS[0].DESCRIPTION.replace(/<br>/g," ");
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

function mergejson(json, newjson) {
  if (!json || !newjson)
    return;
  if (!(newjson.name === undefined))
    return;

  var allrecords = json.QueryREST_ASSETWResponse.rsTotal;
  var newrecords = newjson.QueryREST_ASSETWResponse.rsTotal;
  if (allrecords == 0 || newrecords == 0) return;
  var i = 0;
  var j = 0;
  var message = "";
  var records = allrecords - 1;
  d = new Date();

  // stript out repeated text from department names
  for (i; i < newrecords; ++i) {
    newcurr = newjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
    newcurr.LOCATIONS[0].DESCRIPTION = newcurr.LOCATIONS === undefined ? "Unknown" : trimlocationdesc(newcurr.LOCATIONS[0].DESCRIPTION);
    var locald = new Date(newcurr.CHANGEDATE);
    outputconsole("merge Asset [" + newcurr.ASSETNUM + "] " + daysDiff(locald, d) + ":" + compile(newcurr));
    for (j = 0; j < allrecords; ++j) {
      curr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[j];
      if (newcurr.ASSETID == curr.ASSETID) {
        json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[j] = newcurr;
      }
    }
  };
}

function swapnew() {
  // method swaps meters till the earliest one is first
  var records = newjson.QueryREST_ASSETWResponse.rsTotal;
  var swapnew = true;
  var curr = null;
  var newcurr = null;
  while (swapnew) {
    swapnew = false;
    var i = 0;
    d = new Date();
    for (i; i < records - 1; ++i) {
      curr = newjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
      newcurr = newjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i + 1];
      var currlocald = new Date(curr.CHANGEDATE);
      var newcurrlocald = new Date(newcurr.CHANGEDATE);
      var difference = daysDiff(newcurrlocald, currlocald);
      outputconsole("<" + curr.ASSETNUM + ":" + currlocald.toLocaleString() + "> <" + newcurr.ASSETNUM + ":" + newcurrlocald.toLocaleString() + "> diff:" + difference);
      if (difference < 0) {
        newjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i] = newcurr;
        newjson.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i + 1] = curr;
        swapnew = true;
      }
      outputconsole("<swapnew>", newjson);
    }
  }
  outputconsole(" xxxxxxxxxxx ");
};

function trimlocationdesc(locationdescription) {
  return (locationdescription.replace('Mine ', '').replace(' Fleet', '').trim().replace(' ','<br>'));
}

function sortbydept(json, dept) {
  var start = 0;
  if (!json)
    return;

  var allrecords = json.QueryREST_ASSETWResponse.rsTotal;
  if (allrecords == 0) return;
  var swap = true;
  var endstop = 0;
  var endstart = 0;
  var i = 0;
  var records = allrecords - 1;

  outputconsole("dirty", json);
  for (i = start; i < allrecords; ++i) {
    curr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
    curr.LOCATIONS[0].DESCRIPTION = curr.LOCATIONS === undefined ? "Unknown" : trimlocationdesc(curr.LOCATIONS[0].DESCRIPTION);
    swapmeters(curr);
  };

  outputconsole("clean", json);
  var cdowntime = 0.0;
  var ndowntime = 0.0;
  while (swap) {
    swap = false;
    for (i = start; i < records; ++i) {
      curr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
      nextcurr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i + 1];
      var currdescription = compile(curr, cdowntime);
      var nextdescription = compile(nextcurr, ndowntime);
      if (currdescription > nextdescription) {
        swap = true
        endstop = i;
        json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i + 1] = curr;
        json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i] = nextcurr;
      }
    }

    outputconsole("mid:" + start + ":" + endstop, json);
    records--;
    endstart = endstop - 1;
    if (!swap) break;

    swap = false;
    for (i = records; i > start; --i) {
      curr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i];
      nextcurr = json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i - 1];
      var currdescription = compile(curr, cdowntime);
      var nextdescription = compile(nextcurr, ndowntime);
      if (currdescription < nextdescription) {
        swap = true
        endstop = i;
        json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i - 1] = curr;
        json.QueryREST_ASSETWResponse.REST_ASSETWSet.ASSET[i] = nextcurr;
      }
    }
    outputconsole("end:" + start + ":" + endstop, json);
  }
  outputconsole("final", json);
};

function calcassetdays(curr, first) {
  var d = new Date();
  var days;
  locald = curr.ASSETSTATUS ? new Date(curr.ASSETSTATUS[0].CHANGEDATE) : new Date(curr.CHANGEDATE);
  downtime = daysBetween(locald, d);
  loop = first ? 1 : curr.ASSETMETER.length;
  if (curr.ASSETMETER) {
    for (am = 0; am < loop; am++) {
      var currmeter = curr.ASSETMETER[am];
      if (currmeter.PMMETER) {
        days = meterdays(curr, currmeter);
      }
    }
  }
  return days;
};

function meterdays(curr, currmeter) {
  var d = new Date();
  var days;
  if (currmeter.PMMETER) {
    for (pm = 0; pm < currmeter.PMMETER.length; pm++) {
      if (currmeter.PMMETER[pm].LASTPMWOGENREADDT) {
        reportdate = new Date(currmeter.PMMETER[pm].LASTPMWOGENREADDT);
        days = currmeter.AVERAGE == 0 ? 0 : currmeter.PMMETER[pm].FREQUENCY / currmeter.AVERAGE;
        reportdate.setDate(reportdate.getDate() + days);
        days = Math.round(daysDiff(d, reportdate) / 60.0 / 24.0);
      } else {
        reportdate = new Date(curr.INSTALLDATE);
        rate = (daysDiff(reportdate, d) / 60.0 / 24.0);
        average = currmeter.LIFETODATE / rate;
        days = Math.round(currmeter.PMMETER[pm].FREQUENCY / average);
      }
    }
    return days;
  }
};

function swapmeters(curr) {
  // method swaps meters till the earliest one is first
  if (curr.ASSETMETER) {
    if (curr.ASSETNUM == "264")
      stop = 0;
    var swapmeter = true;
    while (swapmeter) {
      currdays = 9999;
      nextdays = 9999;
      swapmeter = false;
      for (am = 0; am < curr.ASSETMETER.length - 1; am++) {
        currmeter = curr.ASSETMETER[am];
        nextmeter = curr.ASSETMETER[am + 1];
        if (currmeter.PMMETER)
          currdays = meterdays(curr, currmeter);
        if (nextmeter.PMMETER)
          nextdays = meterdays(curr, nextmeter);
        if (currdays > nextdays) {
          curr.ASSETMETER[am] = nextmeter;
          curr.ASSETMETER[am + 1] = currmeter;
          swapmeter = true;
        }
      }
    }
  }
};

function buildassetcell(curr, pmpfound, pmpservice, pmploc) {
  var d = new Date();
  var pmexists = false;
  var reportdate = new Date();
  var days = -999;
  var ass = curr.ASSETNUM;
  var lifetodate = 0.0;
  if (displaylevel > 1) {
    ass += chosenpriority > 1 ? " (" + curr.PRIORITY + ") [" : " [";
  } else {
    ass += chosenpriority > 1 ? " (" + curr.PRIORITY + ")<br/>[" : "<br/>[";
  }
  //            var locald = curr.ASSETSTATUS ? new Date(curr.ASSETSTATUS[0].CHANGEDATE) : new Date(curr.CHANGEDATE);
  var locald = curr.ASSETSTATUS ? new Date(curr.ASSETSTATUS[0].CHANGEDATE) : new Date(curr.CHANGEDATE);
  ass += daysBetween(locald, d) + "]";
  if (curr.ASSETNUM == "330")
    stop = 0;
  if (displaylevel > 1) {
    if (pmpservice) {
      reportdate = curr.WORKORDER[pmploc].SCHEDFINISH === undefined ? new Date(curr.WORKORDER[pmploc].TARGCOMPDATE) : new Date(curr.WORKORDER[pmploc].SCHEDFINISH);
      days = Math.round(daysDiff(d, reportdate) / 60.0 / 24.0);
      ass += (days < 0 ? "<br/>Late " : "<br/>Back ") + days; //+ " Days";
      pmexists = true;
    } else if (curr.ASSETMETER) {
      loop = displaylevel > 3 ? curr.ASSETMETER.length : 1;
      for (am = 0; am < loop; am++) {
        currmeter = curr.ASSETMETER[am];
        days = meterdays(curr, currmeter);
        if (days !== undefined) {
          pmexists = true;
          ass += (days < 0 ? "<br/>Late " : "<br/>Due ") + days; // + " Days";
        }
      }
    }
    if (!pmexists)
      ass += "<late style='color: yellow'></br>No Active PM";
  }
  if (displaylevel > 2) {
    reportdate = curr.INSTALLDATE === undefined ? new Date(curr.STATUSDATE) : new Date(curr.INSTALLDATE);
    rate = daysDiff(reportdate, d) / 60.0;
    avail = Math.round(10000 * (1 - (curr.TOTDOWNTIME / rate))) / 100;
    ass += "<br/>Avail " + avail + "%";
  }
  return ass;
}

function buildassettitle(curr, pmpfound, pmpservice, pmploc) {
  var asstitle = "";
  if (pmpfound && !pmpservice) {
    if (curr.WORKORDER[pmploc].SCHEDSTART) {
      schdate = new Date(curr.WORKORDER[pmploc].SCHEDSTART);
      asstitle += "Service Scheduled:" + schdate.toLocaleDateString() + "<br/><br/>";
    } else {
      schdate = new Date(curr.WORKORDER[pmploc].STATUSDATE);
      asstitle += "Target Service:" + schdate.toLocaleDateString() + "<br/><br/>";
    }
  }
  if (curr.ASSETNUM == "330")
    stop = 0;
  if (curr.WORKORDER) {
    for (w = 0; w < curr.WORKORDER.length; w++) {
      var reportdate = new Date(curr.WORKORDER[w].REPORTDATE);
      asstitle += "<a href='http://maximoprod.boliden.internal/maximo/ui/maximo.jsp?event=loadapp&amp;value=WOTRACK&amp;uniqueid=";
      asstitle += curr.WORKORDER[w].WORKORDERID + "' target='_blank'>";
      asstitle += curr.WORKORDER[w].WONUM + "</a>";
      asstitle += " [" + reportdate.toLocaleDateString() + "] ";
      asstitle += curr.WORKORDER[w].AMCREW === undefined ? "" : curr.WORKORDER[w].AMCREW[0].DESCRIPTION;
      asstitle += "<br/>" + curr.WORKORDER[w].DESCRIPTION;
      asstitle += curr.WORKORDER[w].DESCRIPTION_LONGDESCRIPTION === undefined ? "" : ". <br/>" + curr.WORKORDER[w].DESCRIPTION_LONGDESCRIPTION.replace(/<\/?[^>]+(>|$)/g, " ").replace(/&#039;/g, "'");
      if (curr.WORKORDER[w].WORKLOG) {
        asstitle += curr.WORKORDER[w].WORKLOG.DESCRIPTION === undefined ? "" : ".<br/>" + curr.WORKORDER[w].WORKLOG.DESCRIPTION;
      }
      asstitle += "<br/><br/>";
    }
  }

  if (asstitle.length > 10) {
    asstitle = "<a href='http://maximoprod.boliden.internal/maximo/ui/maximo.jsp?event=loadapp&amp;value=ASSET&amp;uniqueid=" + curr.ASSETUID + "' target='_blank'>" + curr.ASSETNUM + "</a><br/><br/>" + asstitle;
  }
  return asstitle;
}

function findclasspos(Hcell, title) {
  for (l = 0; l < Hcell.length; l++) {
    currsection = Hcell.item(l).innerHTML;
    if (title == currsection)
      return (l);
  }
}

function setassetclass(deptlabel, Hcell, curr) {
  found = true;
  if (curr.ASSETNUM == "337") stop = 0;
  pmpfound = false;
  pmpservice = false;
  assup = 0;
  assdown = 0;
  var pmploc = 0;
  if (curr.ISRUNNING) {
    deptlabel.className = curr.WORKORDER ? "assetup2" : "assetup";
    assetupcount += 1;
    assup = 1;
  } else {
    assdown = 1;
    outputconsole("asset down::", curr);
    if (curr.WORKORDER) {
      for (w = 0; w < curr.WORKORDER.length; w++) {
        if (curr.WORKORDER[w].WORKTYPE == "PMP" && !pmpservice) {
          pmpfound = true;
          pmpservice = curr.WORKORDER[w].STATUS == "INPRG" ? true : false;
          pmploc = w;
        }
      }
      if (pmpfound && pmpservice) {
        deptlabel.className = "assetservice";
        assetservice += 1;
      } else {
        assetdowncount += 1;
        deptlabel.className = "assetdown";
        if (!pmpfound) {
          deptlabel.className = "assetdown2";
          assetbreakdowncount += 1;
        }
      }
    } else {
      deptlabel.className = "assetdown";
      assetdowncount += 1;
    }
  }

  days = calcassetdays(curr, true);
  asstitle = buildassettitle(curr, pmpfound, pmpservice, pmploc);
  ass = buildassetcell(curr, pmpfound, pmpservice, pmploc);

  if (days < 7) {
    if (pmpfound) {
      var stop = 0;
      if (!pmpservice) {
        //        deptlabel.item(l).className="serviceduepmp";
      }
    } else {
      //      deptlabel.item(l).className= curr.ISRUNNING ? "servicedueup":"serviceduedn";
      null;
    }
  }
  ass += asstitle.length > 10 ? "<span class=tooltiptext>" + asstitle + "</span>" : "";
  deptlabel.innerHTML = ass;
  position = findclasspos(HeaderCells, curr.CLASSSTRUCTURE[0].DESCRIPTION.replace(' ','<br>'));

  pcttotalobj.item(position).innerHTML = Number(pcttotalobj.item(position).innerHTML) + 1;
  pctupobj.item(position).innerHTML = Number(pctupobj.item(position).innerHTML) + assup;
  pctdownobj.item(position).innerHTML = Number(pctdownobj.item(position).innerHTML) + assdown;

}

function daysDiff(date1, date2) {
  // Get 1 minute in milliseconds
  var one_min = 1000 * 60;
  var mins;
  mins = (date2.getTime() - date1.getTime()) / one_min;
  return mins;
}

function daysBetween(date1, date2) {
  var mins;
  var hours;
  mins = Math.floor(daysDiff(date1, date2));
  return HoursBetween(mins);
}

function HoursBetween(mins, full) {
  var mins;
  var hours;
  hours = Math.floor((mins / 60.0));
  mins = mins - (hours * 60.0);
  if (hours == 0) {
    downtime = mins + (full ? " Minutes" : "m");
  } else if (hours > 23) {
    days = Math.floor(hours / 2.4) / 10.0;
    downtime = (days == 1 && full ? "" : Math.floor(hours / 2.4) / 10.0) + (full ? " Day" : "D");
  } else {
    downtime = (hours == 1 && full ? "" : hours) + (full ? " Hour" : "h") + (full && hours > 1 ? "s" : "");
  }
  return downtime;
}

function setfilter(targetdate) {
  var filter;
  // temp to cause delta data set
  var text = ">" + targetdate.toISOString();
  filter = {
    maxrows: 600,
    offset: 0,
    fields: [{
      SITEID: "=TAR"
    }, {
      ASSETTYPE: "=FLEET"
    }, {
      CLASSSTRUCTUREID: "!~null~"
    }, {
      "ASSETSTATUS.CHANGEDATE": text
    }, {
      STATUS: "=OPERATING"
    }, {
      LOCATION: "!~null~"
    }, {
      PRIORITY: "!~null~"
    }]
  };
  return filter;
}

function clock() {
  temp = new Date();
  set("lastrun", "Clock Run: " + temp.toLocaleString());
};
