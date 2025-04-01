import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, where, query } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Your web app's Firebase configuration (Use the same as inventory.js)
const firebaseConfig = {
    apiKey: "AIzaSyBM-8tjoT6pNo9R9xSzdsy7EthVEuRcV3Q",
    authDomain: "fir-frontend-b76f8.firebaseapp.com",
    projectId: "fir-frontend-b76f8",
    storageBucket: "fir-frontend-b76f8.firebasestorage.app",
    messagingSenderId: "782791943362",
    appId: "1:782791943362:web:ee15bca12a1040c94cc75b",
    measurementId: "G-VY1FTQPFLN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const transactionsSection = document.querySelector(".transactions-section");

async function fetchTransactions() {
    const transactionsCollection = collection(db, "transactions");
    const querySnapshot = await getDocs(transactionsCollection);

    let transactions = [];
    querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
    });

    displayTransactions(transactions);
}

function displayTransactions(transactions) {
    const existingBlocks = transactionsSection.querySelectorAll(".transaction-block");
    existingBlocks.forEach(block => block.remove());

    transactions.sort((a, b) => {
        const dateA = a.date ? a.date.seconds : 0; // Handle cases where date might be missing
        const dateB = b.date ? b.date.seconds : 0;
        return dateB - dateA; // Sort by latest (higher seconds value) first
    });

    transactions.forEach((transaction) => {
        const transactionBlock = document.createElement("div");
        transactionBlock.classList.add("transaction-block");

        let itemsHTML = transaction.items
            .map(
                (item) =>
                    `<tr>
                        <td>${item.productCode}</td>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price.toFixed(2)}</td>
                    </tr>`
            )
            .join("");

        transactionBlock.innerHTML = `
            <div class="transaction-date">
                <span>${transaction.date ? new Date(transaction.date.seconds * 1000).toLocaleDateString() : "Unknown Date"}</span>
            </div>
            <div class="transaction-table-container">
                <table class="transaction-table">
                    <thead>
                        <tr>
                            <th>CODE</th>
                            <th>DESCRIPTION</th>
                            <th>QUANTITY</th>
                            <th>PRICE</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHTML}</tbody>
                </table>
                <div class="transaction-summary">
                    <p><strong>TOTAL:</strong> ${transaction.totalAmount.toFixed(2)}</p>
                    <p><strong>AMOUNT PAID:</strong> ${transaction.amountPaid.toFixed(2)}</p>
                    <p><strong>CHANGE:</strong> ${transaction.change.toFixed(2)}</p>
                </div>
            </div>
        `;
        transactionsSection.appendChild(transactionBlock);
    });

    if (transactions.length === 0) {
        const noTransactionsMessage = document.createElement("p");
        noTransactionsMessage.textContent = "No transaction history available.";
        transactionsSection.appendChild(noTransactionsMessage);
    }
}

fetchTransactions();

document.addEventListener('DOMContentLoaded', () => {
    fetchTransactions(); // Keep this

    // Add event listener to the search button
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', searchByDate);
    }
});

function searchByDate() {
    const selectedDate = document.getElementById("dateInput").value;
    if (selectedDate) {
        const transactionsCollection = collection(db, "transactions");

        // Create Date objects for the start and end of the selected date in the local timezone (Philippines)
        const localDateStart = new Date(selectedDate);
        localDateStart.setHours(0, 0, 0, 0);

        const localDateEnd = new Date(selectedDate);
        localDateEnd.setHours(23, 59, 59, 999);

        // Convert these local Date objects to UTC Timestamps for the query
        // To get the UTC time, we can use getTime() which returns milliseconds since epoch,
        // and then create a new Date object with that in UTC.
        const startDateUTC = new Date(localDateStart.getTime() - (8 * 60 * 60 * 1000)); // Subtract 8 hours for UTC
        const endDateUTC = new Date(localDateEnd.getTime() - (8 * 60 * 60 * 1000));   // Subtract 8 hours for UTC

        const q = query(transactionsCollection,
            where("date", ">=", startDateUTC),
            where("date", "<=", endDateUTC)
        );

        getDocs(q)
            .then((querySnapshot) => {
                let filteredTransactions = [];
                querySnapshot.forEach((doc) => {
                    filteredTransactions.push({ id: doc.id, ...doc.data() });
                });
                displayTransactions(filteredTransactions);
            })
            .catch((error) => {
                console.error("Error searching transactions: ", error);
            });
    } else {
        fetchTransactions(); // If no date is selected, show all transactions
    }
}