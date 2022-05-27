(()=>{
//Default Settings
//User settings: on [[roam/js/bionic text]] page
var fixation = '50';
var saccade = '2';
var fixNum, sacNum;
var startBionicMode = false;
var buttonInTopBar = 'no';

let tree = getTreeByPageTitle('roam/js/bionic text');
if (tree.length==0) createSettingsPage();
else getSettings(tree);

document.addEventListener('keydown', keyboardToggle);
if (buttonInTopBar=='yes') buttonToggle();

function keyboardToggle(e) {
  if (e.shiftKey && e.altKey && e.key.toLowerCase() == "b") BionicMode();   
}

function buttonToggle() {
  var nameToUse = "autotag",
     bpIconName = "bold",
     checkForButton = document.getElementById(nameToUse + "-icon");
  if (!checkForButton) {
     var mainButton = document.createElement("span");
     (mainButton.id = nameToUse + "-button"),
     mainButton.classList.add("bp3-popover-wrapper");
     var spanTwo = document.createElement("span");
     spanTwo.classList.add("bp3-popover-target"), mainButton.appendChild(spanTwo);
     var mainIcon = document.createElement("span");
     (mainIcon.id = nameToUse + "-icon"),
     mainIcon.classList.add(
           "bp3-icon-" + bpIconName,
           "bp3-button",
           "bp3-minimal",
           "bp3-small"
        ),
        spanTwo.appendChild(mainIcon);
     var roamTopbar = document.getElementsByClassName("rm-topbar"),
        nextIconButton = roamTopbar[0].lastElementChild,
        flexDiv = document.createElement("div");
     (flexDiv.id = nameToUse + "-flex-space"),
     (flexDiv.className = "rm-topbar__spacer-sm"),
     nextIconButton.insertAdjacentElement("afterend", mainButton),
        mainButton.insertAdjacentElement("afterend", flexDiv),
        mainButton.addEventListener("click", BionicMode);
  }
}

function BionicMode() {
  fixNum = parseInt(fixation);
  sacNum = parseInt(saccade);
  startBionicMode = !startBionicMode;
  if (startBionicMode) console.log("Bionic text on");
  else console.log("Bionic text off");
  
  let elt = document.getElementsByClassName('rm-block-text');
      for (let i=0;i<elt.length;i++) {
        if (isTextBlock(elt[i].innerHTML)==true) {
          if (startBionicMode==false) {
            elt[i].innerHTML = elt[i].innerHTML.replaceAll('<b>','').replaceAll('</b>','');
            continue;
          }
          let spanTab = [];
          spanTab = splitTextFromHtml(elt[i].innerHTML);
          spanTab = processBlockSegments(spanTab);
          elt[i].innerHTML = spanTab.join('');
        } 
      }

  function isTextBlock(c) {
    if (c.includes('rm-code-warning') ||
        c.includes('rm-code-block') ||
        c.includes('kanban-board')
//          c.includes('<label')
       ) return false;
    else return true;
  }

  function splitTextFromHtml(htmlStr) {
    let tab = [];
    let index = 0;
    tab = getAllIndexOf('<','>',htmlStr);
    let splitTab = [];
    let shiftL=0;
    let shiftR=1;
    for(let i=0;i<tab.length-1;i++) {
      splitTab.push(htmlStr.substring(tab[i]+shiftL,tab[i+1]+shiftR));
      let x = shiftR;
      shiftR = shiftL;
      shiftL = x;
    }
    return splitTab;
  }
  
  function getAllIndexOf(s1,s2,str) {
    let index = 0;
    let tab = [];
    while (index != -1) {
      index = str.indexOf(s1,index);
      if (index == -1) break;
      tab.push(index);
      index = str.indexOf(s2,index);
      tab.push(index);
    }
    return tab;
  }
  
  function processBlockSegments(tab) {
    for (let k=0;k<tab.length;k++) {
      let words = new Array();
      if (tab[k].includes('<')) continue;
      words = tab[k].split(' ');
      for (let i=0;i<words.length;i+=sacNum) {
        words[i] = boldHalfWord(words[i]);
      }
      tab[k]=words.join(' ');
    }
    return tab;
  }

  function boldHalfWord(word) {
    let midIndex=0;
    if (word.length != 0) {
      midIndex = Math.ceil(word.length * fixNum / 100);
      word = '<b>' + word.slice(0,midIndex) + '</b>' + word.slice(midIndex);
    }
    return word;
  }
}

function getTreeByPageTitle(pageTitle) {
return window.roamAlphaAPI.q(
  `[:find ?uid ?s 
    :where [?b :node/title "${pageTitle}"]
           [?b :block/children ?cuid]
           [?cuid :block/uid ?uid]
           [?cuid :block/string ?s]]`);
}

function getFirstChild(uid) {
  let q = `[:find ?uid ?s 
            :where [?b :block/uid "${uid}"]
                   [?b :block/children ?cuid]
                   [?cuid :block/uid ?uid]
                   [?cuid :block/string ?s]]`;
  return window.roamAlphaAPI.q(q)[0];
}

function createSettingsPage() {
  let pageUid = window.roamAlphaAPI.util.generateUID();
  window.roamAlphaAPI.createPage(
        {"page": {"title": 'roam/js/bionic text',
                  "uid": pageUid}});
  
  let fixationUid = window.roamAlphaAPI.util.generateUID();
  window.roamAlphaAPI.createBlock(
        {"location": {"parent-uid": pageUid, "order": 0},
         "block": {"string": "fixation (in percent)", "uid": fixationUid}});
  window.roamAlphaAPI.createBlock(
        {"location": {"parent-uid": fixationUid, "order": 0},
         "block": {"string": fixation}});
  
  let saccadeUid = window.roamAlphaAPI.util.generateUID();
  window.roamAlphaAPI.createBlock(
        {"location": {"parent-uid": pageUid, "order": 1},
         "block": {"string": "saccade (every x words)", "uid": saccadeUid}});
  window.roamAlphaAPI.createBlock(
        {"location": {"parent-uid": saccadeUid, "order": 0},
         "block": {"string": saccade}});

  let buttonUid = window.roamAlphaAPI.util.generateUID();
  window.roamAlphaAPI.createBlock(
        {"location": {"parent-uid": pageUid, "order": 2},
         "block": {"string": "button (yes or no)", "uid": buttonUid}});
  window.roamAlphaAPI.createBlock(
        {"location": {"parent-uid": buttonUid, "order": 0},
         "block": {"string": buttonInTopBar}});
}

function getSettings(settingsArray) {
  for(let i=0;i<settingsArray.length;i++) {
    let str = settingsArray[i][1].split(' ')[0].toLowerCase();
    let blockUid = settingsArray[i][0];
    switch (str) {
      case 'fixation':
        let fixSetting = getFirstChild(blockUid)[1];
        if (fixSetting != null) fixation = fixSetting;
        break;
      case 'saccade':
        let sacSetting = getFirstChild(blockUid)[1];
        if (sacSetting != null) saccade = sacSetting;
        break;
      case 'button':
        let butSetting = getFirstChild(blockUid)[1];
        if (butSetting != null) buttonInTopBar = butSetting;
        break;
      default:
        if (str!=null) console.log(str + ' is not a Bionic text setting');
    }
  }
}
})();
