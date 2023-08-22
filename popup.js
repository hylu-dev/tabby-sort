let sortCtrl;
let labelCtrl;
let hideCtrl;
document.getElementById("button-group").addEventListener('click', sortTabs);
document.getElementById("button-ungroup").addEventListener('click', ungroupTabs);
document.addEventListener('DOMContentLoaded', function() {
    sortCtrl = document.getElementById("sort");
    labelCtrl = document.getElementById("label");
    hideCtrl = document.getElementById("hide");
});

function sortTabs() {
    if (sortCtrl.checked) {
        chrome.tabs.query({}, tabs => {
            sortTabsByComparer(tabs, compareAlpha);
        });
    }
    chrome.tabs.query({}, tabs => {
        groupTabs(tabs);
    });
}

function groupTabs(tabs) {
    const threshold = 1; // group only if more than 1 same domain
    const domainTabIds = {};
    let groupDomains = [];

    for (let tab of tabs) {
        let domain = getDomainFromURL(tab.url);
        domainTabIds[domain] || (domainTabIds[domain] = []);
        domainTabIds[domain].push(tab.id);
    }
    for (let domain in domainTabIds) {
        if (domainTabIds[domain].length > threshold) { 
            chrome.tabs.group({
                tabIds: domainTabIds[domain]
            })
            groupDomains.push(domain);
        }
    }


    chrome.tabGroups.query({}, groups => {
        for (let index in groups) {
            chrome.tabGroups.update(groups[index].id,
            {
                collapsed: hideCtrl.checked,
                title: labelCtrl.checked ? groupDomains[index] : ''
            })
        }
    })
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
    const protocolRegex = /.*:\/\//;
    const domainRegex = /(?<=:\/\/).*?(?=\/)/;
    const pathRegex = /(?<=:\/\/.*)\/.*/;

    return [url.match(protocolRegex)[0], url.match(domainRegex)[0], url.match(pathRegex)[0]];
}

function getDomainFromURL(url) {
    const domainRegex = /(?<=:\/\/).*?(?=\/)/;
    url = url.match(domainRegex)[0];
    return url.substring(0, url.lastIndexOf("."));
}