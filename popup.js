let sortCtrl;
let labelCtrl;
let hideCtrl;
let colors = ["pink","purple","cyan","orange","blue","red","yellow","green","grey"];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("button-group").addEventListener('click', sortTabs);
    document.getElementById("button-ungroup").addEventListener('click', ungroupTabs);
    document.getElementById("sort").addEventListener('change', storeInputValue);
    document.getElementById("label").addEventListener('change', storeInputValue);
    document.getElementById("hide").addEventListener('change', storeInputValue);

    sortCtrl = document.getElementById("sort");
    labelCtrl = document.getElementById("label");
    hideCtrl = document.getElementById("hide");
    loadInputValue(sortCtrl);
    loadInputValue(labelCtrl);
    loadInputValue(hideCtrl);
});

function loadInputValue(ctrl) {
    chrome.storage.local.get(
        [ctrl.id]
    ).then( result => ctrl.checked = result[[ctrl.id]])
}

function storeInputValue(e) {
    payload = {}
    payload[e.target.id] = e.target.checked;
    chrome.storage.local.set(payload);
    
}

function sortTabs() {
    if (sortCtrl.checked) {
        chrome.tabs.query({ currentWindow: true }, tabs => {
            sortTabsByComparer(tabs, compareAlpha);
        });
    }
    chrome.tabs.query({ currentWindow: true }, tabs => {
        groupTabs(tabs);
    });
}

function groupTabs(tabs) {
    const threshold = 1; // group only if more than 1 same domain
    const domainTabIds = {};

    // retrieve unique domains from tabs
    for (let tab of tabs) {
        let domain = getDomainFromURL(tab.url);
        domainTabIds[domain] || (domainTabIds[domain] = []);
        domainTabIds[domain].push(tab.id);
    }

    // group by domains
    let i = 0
    for (let domain in domainTabIds) {
        if (domainTabIds[domain].length > threshold) { 
            chrome.tabs.group({
                tabIds: domainTabIds[domain]
            })
        }
    }

    // const sortedGroupDomains = groupDomains.sort(
    //     (a, b) => a[1] < b[1] ? 1 : -1
    // );
    // collapse/title groups
    chrome.tabGroups.query({}, groups => {
        for (let group of groups) {
            // query for domain name of first tab
            chrome.tabs.query({ currentWindow: true, groupId: group.id }, tabs => {

                let domain = getDomainFromURL(tabs[0].url);
                chrome.tabGroups.update(group.id, {
                    collapsed: hideCtrl.checked,
                    title: labelCtrl.checked ? domain : '',
                    color: colors[0]
                })
                colors.push(colors.shift());
                // move to end
                if (sortCtrl.checked) chrome.tabGroups.move(group.id, {
                    index: -1
                })

            });

        }
    })



}

function sortGroups(e) {
    console.log(e);
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