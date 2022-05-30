/*********************************************************** 
  Roam Bionic text
   	inspired by Bionic Reading (TM) : https://https://bionic-reading.com/
    Version: 0.40, May 30th, 2022
    By: @fbgallet on Twitter
    
    - Toggle it with Shift+Alt+B or 'B' button in the top bar.
    - Set fixation (percentage of word in bold), saccade (applies every x words) and button display on [[roam/js/bionic text]] page.
  
    Support my work on: https://www.buymeacoffee.com/fbgallet
************************************************************/
(()=>{
//Default Settings
//User settings can be set on [[roam/js/bionic text]] page
var fixation = '50';
var saccade = '1';
var buttonInTopBar = 'yes';
var fixNum, sacNum;
var isOn = false;

let tree = getTreeByPageTitle('roam/js/bionic text');
if (tree.length==0) createSettingsPage();
else getSettings(tree);

document.addEventListener('keydown', keyboardToggle);
if (buttonInTopBar=='yes') buttonToggle();
window.addEventListener('popstate',autoToggleWhenBrowsing);

function autoToggleWhenBrowsing() {
  if (isOn) {
    setTimeout(function() { 
      BionicMode();
      BionicMode();
    }, 100);
  }
}
  
function keyboardToggle(e) {
  if (e.shiftKey && e.altKey && e.key.toLowerCase() == "b") BionicMode();   
}

function buttonToggle() {
  var nameToUse = "bionic",
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
     console.log("Bionic text button added");
  }
}

function BionicMode() {
  fixNum = parseInt(fixation);
  sacNum = parseInt(saccade);
  isOn = !isOn;

  if (isOn) {
    console.log("Bionic text on. v0.40");
    let elt = document.getElementsByClassName('rm-block-text');
    for (let i=0;i<elt.length;i++) {
      let nodes = elt[i].children[0].childNodes;
      for(let j=0;j<nodes.length;j++) {
        if (nodes[j].nodeType == 3) {
          let e = document.createElement("bionic");    
          e.innerHTML = processTextNode(nodes[j].nodeValue);
          nodes[j].replaceWith(e);
        } 
      }
    }
  }
  else {
    console.log("Bionic text off.");
    let bionicElt = document.querySelectorAll("bionic");
    for (let i=0;i<bionicElt.length;i++) {
      let originalTxt = bionicElt[i].innerHTML.replaceAll('<b>','').replaceAll('</b>','');
      bionicElt[i].replaceWith(originalTxt);
    }
  }  

  function processTextNode(text) {
    let splitText = text.split(' ');
    for(let i=0;i<splitText.length;i++) {
      splitText[i] = boldHalfWord(splitText[i]);
    }
    return splitText.join(' ');
  }

  function boldHalfWord(word) {
    let midIndex=0;
    let len=word.length;
    if (!(/\p{Extended_Pictographic}/u.test(word))) {
      if (len>3) midIndex = Math.ceil(len * fixNum / 100);
      else {
         midIndex = Math.floor(len * fixNum / 100);
         if (midIndex<1) midIndex=1;
      }
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
  console.log('Bionic text settings page created: [[roam/js/bionic text]].');
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
        console.log(buttonInTopBar);
        break;
      default:
        if (str!=null) console.log(str + ' is not a Bionic text setting');
    }
    console.log('Bionic text settings loaded.');
  }
}
})();
