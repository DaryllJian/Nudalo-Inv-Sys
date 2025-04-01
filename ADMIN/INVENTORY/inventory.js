import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-analytics.js";
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Your web app's Firebase configuration
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
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore

let allInventoryData = []; // To store all loaded inventory data
let currentCategory = 'foods_drinks'; // Default category
let currentDocId = null;

document.addEventListener('DOMContentLoaded', () => {
    const inventoryTableBody = document.querySelector('.table-container table tbody');
    const categoryTitle = document.getElementById('inventory-category-title');
    const categoryLinks = document.querySelectorAll('.inventory .submenu a');
    const addItemBtn = document.getElementById('addItemBtn');
    const categoryDropdown = document.querySelector('.filter-section #category');
    const searchBar = document.querySelector('.search-section .search-bar'); // Get search bar reference

    categoryDropdown.addEventListener("change", (event) => {
        loadInventoryData(event.target.value);
    });

    function loadInventoryData(category) {
        currentCategory = category;
        categoryTitle.textContent = category.replace('_', ' ').toUpperCase();
        inventoryTableBody.innerHTML = ''; // Clear the existing table data

        // Update the right sidebar dropdown to reflect the current category
        categoryDropdown.value = category;


        getDocs(collection(db, 'inventory', category, category))
            .then((querySnapshot) => {
                allInventoryData = []; // Clear previous data
                querySnapshot.forEach((doc) => {
                    const productData = doc.data();
                    allInventoryData.push({ id: doc.id, ...productData }); // Store data with ID
                    const row = inventoryTableBody.insertRow();

                    const codeCell = row.insertCell();
                    codeCell.textContent = productData.CODE;

                    const descriptionCell = row.insertCell();
                    descriptionCell.textContent = productData.DESCRIPTION;

                    const qtyCell = row.insertCell();
                    qtyCell.textContent = productData.QTY;

                    const priceCell = row.insertCell();
                    priceCell.textContent = productData.PRICE;

                    const damageCell = row.insertCell();
                    damageCell.textContent = productData.DAMAGE || '--'; // Display '--' if no damage

                    const actionCell = row.insertCell();
                    actionCell.classList.add('action-buttons');
                    actionCell.innerHTML = `
                        <button onclick="updateRow('${doc.id}')">UPDATE</button>
                        <button onclick="deleteRow('${doc.id}', '${category}')">DELETE</button>
                    `;
                });
            })
            .catch((error) => {
                console.error('Error fetching inventory data:', error);
            });
    }

    // Load initial data for "Foods & Drinks"
    loadInventoryData(currentCategory);

    // Add event listeners to category links
    categoryLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            categoryLinks.forEach(otherLink => otherLink.classList.remove('active'));
            link.classList.add('active');
            const category = link.textContent.toLowerCase().replace(' ', '_');

            loadInventoryData(category);

            // Update the right sidebar dropdown
            categoryDropdown.value = category;
        });
    });

    addItemBtn.addEventListener('click', () => {
        console.log('ADD button clicked!');
        const selectedCategory = categoryDropdown.value;
        const code = parseInt(document.querySelector('.filter-section #code').value);
        const description = document.querySelector('.filter-section #description').value;
        const quantity = parseInt(document.querySelector('.filter-section #quantity').value);
        const itemPrice = parseFloat(document.querySelector('.filter-section #item-price').value);
        const damages = parseInt(document.querySelector('.filter-section #damages').value);
        const restockAlertQty = parseInt(document.querySelector('.filter-section #restock').value);

        // REMOVE UNIT AND UNIT PRICE VALIDATION
        if (!selectedCategory || !code || !description || isNaN(quantity) || isNaN(itemPrice) || isNaN(restockAlertQty)) {
            alert('Please fill in all required fields.');
            return;
        }

        if (currentDocId) {
            // Update existing item
            updateDoc(doc(db, 'inventory', currentCategory, currentCategory, currentDocId), {
                CODE: code,
                DESCRIPTION: description,
                QTY: quantity,
                PRICE: itemPrice,
                DAMAGE: damages,
                RESTOCK_ALERT_QTY: restockAlertQty
            })
                .then(() => {
                    console.log('Document successfully updated!');
                    document.querySelector('.filter-section form').reset();
                    loadInventoryData(currentCategory); // Reload the current category
                    currentDocId = null;
                    addItemBtn.textContent = 'ADD'; // Revert button text
                })
                .catch((error) => {
                    console.error('Error updating document: ', error);
                });
        } else {
            // Add new item
            addDoc(collection(db, 'inventory', selectedCategory, selectedCategory), {
                CODE: code,
                DESCRIPTION: description,
                QTY: quantity,
                PRICE: itemPrice,
                DAMAGE: damages,
                RESTOCK_ALERT_QTY: restockAlertQty
            })
                .then((docRef) => {
                    console.log('Document written with ID: ', docRef.id);
                    document.querySelector('.filter-section form').reset();
                    loadInventoryData(selectedCategory);
                })
                .catch((error) => {
                    console.error('Error adding document: ', error);
                });
        }
    });

    window.updateRow = function(docId) {
        currentDocId = docId;
        const selectedCategory = categoryDropdown.value;

        getDocs(collection(db, 'inventory', selectedCategory, selectedCategory))
            .then((querySnapshot) => {
                querySnapshot.forEach((docSnapshot) => {
                    if (docSnapshot.id === docId) {
                        const productData = docSnapshot.data();
                        document.querySelector('.filter-section #code').value = productData.CODE;
                        document.querySelector('.filter-section #description').value = productData.DESCRIPTION;
                        document.querySelector('.filter-section #quantity').value = productData.QTY;
                        document.querySelector('.filter-section #item-price').value = productData.PRICE;
                        document.querySelector('.filter-section #damages').value = productData.DAMAGE || '';
                        document.querySelector('.filter-section #restock').value = productData.RESTOCK_ALERT_QTY;

                        addItemBtn.textContent = 'UPDATE'; // Change button text to indicate update
                    }
                });
            })
            .catch((error) => {
                console.error('Error fetching document for update:', error);
            });
    };

    window.deleteRow = function(docId, categoryToDelete) {
        if (confirm('Are you sure you want to delete this item?')) {
            deleteDoc(doc(db, 'inventory', categoryToDelete, categoryToDelete, docId))
                .then(() => {
                    console.log('Document successfully deleted!');
                    loadInventoryData(currentCategory); // Reload the current category's data
                })
                .catch((error) => {
                    console.error('Error deleting document: ', error);
                });
        }
    };

    searchBar.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        filterInventory(searchTerm);
    });
});

function filterInventory(searchTerm) {
    const filteredData = allInventoryData.filter(item => {
        return (
            item.CODE.toLowerCase().includes(searchTerm) ||
            item.DESCRIPTION.toLowerCase().includes(searchTerm)
        );
    });
    renderInventoryTable(filteredData);
}

function renderInventoryTable(data) {
    const inventoryTableBody = document.querySelector('.table-container table tbody');
    inventoryTableBody.innerHTML = ''; // Clear the existing table data
    data.forEach(item => {
        const row = inventoryTableBody.insertRow();

        const codeCell = row.insertCell();
        codeCell.textContent = item.CODE;

        const descriptionCell = row.insertCell();
        descriptionCell.textContent = item.DESCRIPTION;

        const qtyCell = row.insertCell();
        qtyCell.textContent = item.QTY;

        const priceCell = row.insertCell();
        priceCell.textContent = item.PRICE;

        const damageCell = row.insertCell();
        damageCell.textContent = item.DAMAGE || '--'; // Display '--' if no damage

        const actionCell = row.insertCell();
        actionCell.classList.add('action-buttons');
        actionCell.innerHTML = `
            <button onclick="updateRow('${item.id}')">UPDATE</button>
            <button onclick="deleteRow('${item.id}', '${currentCategory}')">DELETE</button>
        `;
    });
}