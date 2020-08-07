"use strict";

const pendingObjectStoreName = "pending";

// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 2);

request.onupgradeneeded = event => {
    const db = request.result;

    console.log(event);

    if (!db.objectStoreNames.contains(pendingObjectStoreName)) {
        db.createObjectStore(pendingObjectStoreName, { autoIncrement: true });
    }
};

request.onsuccess = event => {
    console.log("Success! ${event.type}");
    
    // check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = event => console.error(event);

function checkDatabase() {
    const db = request.result;

    // open transaction on pending db
    let transaction = db.transaction([pendingObjectStoreName], "readwrite");

    // access pending object store
    let store = transaction.objectStore(pendingObjectStoreName);

    // get all records from store and set to variable
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    // if successful, open transaction on pending db
                    transaction = db.transaction([pendingObjectStoreName], "readwrite");

                    // access pending object store
                    store = transaction.objectStore(pendingObjectStoreName);

                    // clear all items in store
                    store.clear();
                });
        }
    };
}

function saveRecord(record) {
    const db = request.result;

    // create transaction on pending db with readwrite access
    const transaction = db.transaction([pendingObjectStoreName], "readwrite");

    // access pending object store
    const store = transaction.objectStore(pendingObjectStoreName);

    // add record to store with add method.
    store.add(record);
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);