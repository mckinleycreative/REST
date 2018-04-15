function getbyid(id) {
  var el = document.getElementById(id);
  if (!el) return;
  return (val);
}

function debuglevel() {
  outputconsole("debug ::" + !debug);
  debug = !debug;
  refresh();
}

function UpDisplaylevel() {
  displaylevel = Math.min(displaylevel + 1, maxdisplay);
  refresh();
  set("debuglabel", displaylevel);
  outputconsole("UpDisplaylevel ::" + displaylevel);
}

function DownDisplaylevel() {
  displaylevel = Math.max(displaylevel - 1, mindisplay);
  refresh();
  set("debuglabel", displaylevel);
  outputconsole("DownDisplaylevel ::" + displaylevel);
}

function Uplookback() {
  lookback = Math.min(lookback * 2, maxmins);
  update();
  refresh();
  outputconsole("Uplookback ::" + lookback);
}

function Downlookback() {
  lookback = Math.max(lookback / 2, minmins);
  update();
  refresh();
  outputconsole("Downlookback ::" + lookback);
}
