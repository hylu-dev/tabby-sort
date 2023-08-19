document.getElementById("button-sort").addEventListener('click', sortTabs);
document.getElementById("button-ungroup").addEventListener('click', ungroupTabs);
Array.from(document.getElementsByTagName("button"))
  .forEach(button => button.addEventListener('click', timeoutButton));

function timeoutButton(e) {
    let styleOBJ = e.target.style;
    styleOBJ.opacity = 0;
    styleOBJ.pointerEvents = "none";
    setTimeout(() => {
        styleOBJ.opacity = 100;
        styleOBJ.pointerEvents = "auto";;
    }, 1000);
}

function sortTabs() {
    chrome.tabs.query({}, tabs => {
        sortTabsByComparer(tabs, compareAlpha);
    });
    chrome.tabs.query({}, tabs => {
        groupTabs(tabs);
    });
}

function groupTabs(tabs) {
    let threshold = 1; // group only if more than 1 same domain
    let groupIds = {};
    for (let tab of tabs) {
        let domain = disassembleTabURL(tab.url)[1];
        groupIds[domain] || (groupIds[domain] = []);
        groupIds[domain].push(tab.id);
    }
    for (let i in groupIds) {
        if (groupIds[i].length > threshold) { 
            chrome.tabs.group({
                tabIds: groupIds[i]
            })
        }
    }
}

function ungroupTabs() {
    chrome.tabs.query({}, tabs => {
        chrome.tabs.ungroup(tabs.map(tab => tab.id));
    });
}


function sortTabsByComparer(tabs, comparator) {
    let sorted = tabs.sort(comparator);
    sorted.forEach(tab => {
        chrome.tabs.move(tab.id, {index: 0});
    });
}

function compareAlpha(a, b) {
    let firstURL =  disassembleTabURL(a.url);
    let secondURL = disassembleTabURL(b.url);
    let first = firstURL[1] + firstURL[2]; //domain+path
    let second = secondURL[1] + secondURL[2]
    if (first == second) {
        return 0
    }
    return first < second ? 1 : -1
}

function disassembleTabURL(url) {
    protocolRegex = /.*:\/\//;
    domainRegex = /(?<=:\/\/).*?(?=\/)/;
    pathRegex = /(?<=:\/\/.*)\/.*/;
    return [url.match(protocolRegex)[0], url.match(domainRegex)[0], url.match(pathRegex)[0]];
}