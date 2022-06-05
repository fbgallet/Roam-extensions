/*********************************************************** 
  Roam Bionic text
   	inspired by Bionic Reading (TM) : https://https://bionic-reading.com/
    
    Version: 0.52, Juny 4, 2022
    By: Fabrice Gallet (Twitter: @fbgallet)
        Support my work on:
            https://www.buymeacoffee.com/fbgallet

Instructions:
    - Toggle it with Shift+Alt+B or 'B' button in the top bar.
    - Set fixation (percentage of word in bold), saccade (applies every x words) and button display on [[roam/js/bionic text]] page.

************************************************************/
(()=>{
//Default Settings
//User settings can be set on [[roam/js/bionic text]] page
var fixation = '50';
var saccade = '1';
var buttonInTopBar = 'yes';

var version = "v0.52";
var fixNum, sacNum;
var isOn = false;
var lastTextarea, lastElt = null;
var isNewView = true;

let tree = getTreeByPageTitle('roam/js/bionic text');
if (tree.length==0) createSettingsPage();
else getSettings(tree);
  
document.addEventListener('keydown', keyboardToggle);
if (buttonInTopBar=='yes') buttonToggle();
  
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
  
  let elt = document.querySelectorAll('.rm-block-text');
  
  if (isOn) {
    if (isNewView) {
      window.addEventListener('popstate',autoToggleWhenBrowsing);
      console.log("Bionic text on: "+ version);
    }
    else console.log("Bionic text refreshing current view.");
    elt.forEach( el => {
      processHtmlElement(el);
      if (isNewView) el.addEventListener('focusin', onFocusIn);
    });
    if (lastElt!=null) {
      document.getElementById(lastElt.id)
        .addEventListener('focusin', onFocusIn);
    }
  }
  else {
    console.log("Bionic text off.");
    window.removeEventListener('popstate',autoToggleWhenBrowsing);
    elt.forEach(item => {
      item.removeEventListener('focusin', onFocusIn);
    });
    removeBionicNodes();
    isNewView=true;
  }
}
  
function processHtmlElement(el) {
  //console.log(el);
  if (el.innerHTML.includes('<bionic>')==false) {
    let nodes = el.firstChild.childNodes;
    if (nodes.length!=0) {
      for(let j=0;j<nodes.length;j++) {
        insertBionicNode(nodes[j]);
      }
    }
  }
}

function onFocusIn(ev) {
  lastElt = ev.target;
  isNewView=false;
//   console.log("from In:");
//   console.log(lastElt);
  let tArea = document.getElementsByClassName("rm-block__input--active");
  setTimeout(function () {
    if (tArea.length!=0) {
        lastTextarea = tArea[0];
        lastTextarea.addEventListener('focusout', onFocusOut);
    }
    lastElt.removeEventListener('focusin', onFocusIn);
  },100);
}
function onFocusOut(ev) {
  setTimeout(function () {
      lastTextarea.removeEventListener('focusout', onFocusOut);
   //   console.log("from Out:");
   //   console.log(lastElt);
      isOn = false;
      BionicMode();
  }, 200);
}

function insertBionicNode(node) {
  if (node.nodeType == 3) {   // nodeType 3 is Text
    let bionicChild = processTextNode(node.nodeValue);
    node.parentNode.replaceChild(bionicChild, node);
  }
  else {
    let className = node.className;
    switch (className) {
      case 'rm-bold':
      case 'rm-highlight':
      case 'rm-italics':
      case 'rm-page-ref rm-page-ref--tag':  // tag
        node = node.childNodes[0];
        break;
      case "bp3-popover-wrapper": // block ref or alias
        node = node.childNodes[0]
                    .childNodes[0]
                     .childNodes[0];
        if (node.nodeType != 3) {  // block ref
          node = node.childNodes;
          for(let i=0;i<node.length;i++) {
            insertBionicNode(node[i]);
          }
          return;
        }
        break;
      default:
        if (node.childNodes) {
          className = node.childNodes[0].className;
          switch (className) {
            case "bp3-popover-wrapper":      // alias
              node = node.childNodes[0];
              break;
            case "rm-page-ref rm-page-ref--link":  // page ref
              node = node.childNodes[0].childNodes[0];
              break;
            default:
              if (node.parentElement.className == 'rm-bq')
                node = node.childNodes[0];        // quote
              else return;
          }
        }
        else return;
    }
    insertBionicNode(node);
  }
}

function processTextNode(text, node) {
  let splitText = text.split(' ');
  let e = document.createElement('bionic');
  let spaceShift=0;
  for(let i=0;i<splitText.length;i++) {
    let t;
    if((i==0 )|| ((i+spaceShift)%sacNum)==0) {
      let word = splitText[i];
      if (word!='') {
        let midIndex = getmiddleIndex(word);
        let b = document.createElement("b");
        let boldPart = word.slice(0,midIndex);
        b.textContent = boldPart;
        e.appendChild(b);
        let notBoldPart = word.slice(midIndex)+' ';
        if (i==splitText.length-1) notBoldPart = notBoldPart.slice(0,-1);
        t = document.createTextNode(notBoldPart);
      }
      else {
        word += ' ';
        if (i==splitText.length-1) word = word.slice(0,-1);
        t = document.createTextNode(word);
        spaceShift++;
      }
      e.appendChild(t);
    }
    else {
      t = splitText[i]+' ';
      if (i==splitText.length-1) t = t.slice(0,-1);
      e.appendChild(document.createTextNode(t));
    }
  }
  return e;
}

function getmiddleIndex(word) {
  let midIndex=0;
  let len=word.length;
  if (!(/\p{Extended_Pictographic}/u.test(word))) {
    if (len>3) midIndex = Math.ceil(len * fixNum / 100);
    else {
       midIndex = Math.floor(len * fixNum / 100);
       if (midIndex<1) midIndex=1;
    }
  }
  return midIndex;
}

function autoToggleWhenBrowsing() {
  if (isOn) {
    setTimeout(function() {
      BionicMode();
      isNewView=true;
      BionicMode();
    }, 100);
  }
}

function removeBionicNodes(e = document) {
    let bionicElt = e.querySelectorAll("bionic");
    //console.log('remove:');
    //console.log(bionicElt);
    for (let i=0;i<bionicElt.length;i++) {
      let originalTxt = bionicElt[i].innerText;
      let eTxt = document.createTextNode(originalTxt);
      bionicElt[i].replaceWith(eTxt);
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
        break;
      default:
        if (str!=null) console.log(str + ' is not a Bionic text setting');
    }
    console.log('Bionic text settings loaded.');
  }
}
})();
