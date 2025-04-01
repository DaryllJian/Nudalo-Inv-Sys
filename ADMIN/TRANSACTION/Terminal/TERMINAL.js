import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, where, query } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

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
const productGrid = document.querySelector('.grid');
let productsData = []; // Store fetched product data
const searchInput = document.querySelector('.search input[type="text"]'); // Get the search input element

async function fetchProducts() {
  try {
    productsData = [];
    const categories = ['foods_drinks', 'personal_care', 'household_supplies', 'medicines', 'tobacco_alcohol', 'stationary'];

    for (const category of categories) {
      const inventoryCollection = collection(db, 'inventory', category, category);
      const querySnapshot = await getDocs(inventoryCollection);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsData.push({ id: doc.id, category: category, ...data }); // Include category for updating inventory later
      });
    }

    renderProductTiles(productsData);

  } catch (error) {
    console.error("Error fetching products: ", error);
  }
}

function renderProductTiles(products) {
    const productGrid = document.querySelector('.grid'); // Ensure productGrid is selected
    productGrid.innerHTML = '';

    if (products.length === 0) {
        productGrid.innerHTML = '<p>No items found matching your search.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('card');

        const price = product.PRICE_PER_ITEM
            ? parseFloat(product.PRICE_PER_ITEM).toFixed(2)
            : (product.PRICE ? parseFloat(product.PRICE).toFixed(2) : '0.00'); // Handle cases where PRICE might be missing

        card.innerHTML = `
            <h3>${product.DESCRIPTION}</h3>
            <p>${product.CODE}</p>
            <p><strong>P ${price}</strong></p>
            <div class="actions">
                <input type="number" class="quantity-input" value="1" min="1">
            </div>
            <button class="add-button"
                data-id="${product.id}"
                data-category="${product.category}"
                data-code="${product.CODE}"
                data-name="${product.DESCRIPTION}"
                data-price="${price}">
                ADD
            </button>
        `;

        productGrid.appendChild(card);
    });

    attachAddButtonListeners();
}

const itemsList = document.querySelector('.items-list');
let cartItems = [];

function attachAddButtonListeners() {
  const addButtons = document.querySelectorAll('.add-button');
  addButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.dataset.id;
      const productCategory = this.dataset.category;
      const code = this.dataset.code;
      const name = this.dataset.name;
      const price = parseFloat(this.dataset.price);
      const quantityInput = this.parentNode.querySelector('.quantity-input');
      const quantity = parseInt(quantityInput.value);

      if (isNaN(quantity) || quantity < 1) {
        alert('Please enter a valid quantity.');
        return;
      }

      const existingItemIndex = cartItems.findIndex(item => item.code === code);

      if (existingItemIndex > -1) {
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        cartItems.push({ productId, productCategory, code, name, price, quantity });
      }

      renderCartItems();
      updateTotal();
      quantityInput.value = 1;
    });
  });
}

function renderCartItems() {
    const itemsList = document.querySelector('.items-list'); // Ensure itemsList is properly selected
    itemsList.innerHTML = '';

    cartItems.forEach(item => {
        const listItem = document.createElement('div');
        listItem.classList.add('item');

        listItem.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
            <div class="actions">
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-code="${item.code}">
                <button class="remove-item" data-code="${item.code}">&#10006;</button>
            </div>
        `;

        itemsList.appendChild(listItem);
    });

    attachCartItemQuantityListeners();
    attachRemoveItemListeners();
}

function attachCartItemQuantityListeners() {
    const quantityInputs = document.querySelectorAll('.items-list .quantity-input');
    quantityInputs.forEach(input => {
      input.addEventListener('change', function() {
        const code = this.dataset.code;
        const quantity = parseInt(this.value);
        if (!isNaN(quantity) && quantity > 0) {
          const itemIndex = cartItems.findIndex(item => item.code === code);
          if (itemIndex > -1) {
            cartItems[itemIndex].quantity = quantity;
            renderCartItems(); // Re-render to update the displayed total price
            updateTotal();
          }
        } else {
          this.value = cartItems.find(item => item.code === code)?.quantity || 1;
        }
      });
    });

    const incrementButtons = document.querySelectorAll('.increment-item');
    incrementButtons.forEach(button => {
      button.addEventListener('click', function() {
        const code = this.dataset.code;
        const itemIndex = cartItems.findIndex(item => item.code === code);
        if (itemIndex > -1) {
          cartItems[itemIndex].quantity++;
          renderCartItems(); // Re-render to update the displayed total price
          updateTotal();
        }
      });
    });

    const decrementButtons = document.querySelectorAll('.decrement-item');
    decrementButtons.forEach(button => {
      button.addEventListener('click', function() {
        const code = this.dataset.code;
        const itemIndex = cartItems.findIndex(item => item.code === code);
        if (itemIndex > -1 && cartItems[itemIndex].quantity > 1) {
          cartItems[itemIndex].quantity--;
          renderCartItems(); // Re-render to update the displayed total price
          updateTotal();
        }
      });
    });
  }

  function attachRemoveItemListeners() {
    const deleteButtons = document.querySelectorAll('.remove-item');
    deleteButtons.forEach(button => {
      button.addEventListener('click', function() {
        const code = this.dataset.code;
        cartItems = cartItems.filter(item => item.code !== code);
        renderCartItems();
        updateTotal();
      });
    });
  }

  const totalAmountSpan = document.querySelector('.totals span:first-child');

  function updateTotal() {
    let total = 0;
    cartItems.forEach(item => {
      total += item.price * item.quantity;
    });
    totalAmountSpan.textContent = `Total Amount: ${total.toFixed(2)}`;
  }

const amountPaidInput = document.getElementById('amount-paid');
const changeSpan = document.querySelector('.totals span:last-child');

amountPaidInput.addEventListener('input', () => {
  const amountPaid = parseFloat(amountPaidInput.value);
  const totalAmount = parseFloat(totalAmountSpan.textContent.split(': ')[1]);

  if (!isNaN(amountPaid) && !isNaN(totalAmount)) {
    const change = amountPaid - totalAmount;
    changeSpan.textContent = `Change: ${change.toFixed(2)}`;
  } else {
    changeSpan.textContent = `Change: 0.00`;
  }
});

const okButton = document.querySelector('.ok-button');

 okButton.addEventListener('click', async () => {
   const amountPaid = parseFloat(amountPaidInput.value);
   const totalAmount = parseFloat(totalAmountSpan.textContent.split(': ')[1]);

   if (isNaN(amountPaid) || amountPaid < totalAmount || cartItems.length === 0) {
     alert('Please enter a sufficient amount paid and ensure there are items in the cart.');
     return;
   }

   try {
     const transactionData = {
       date: new Date(),
       items: cartItems.map(item => ({
         productCode: item.code,
         name: item.name,
         quantity: item.quantity,
         price: item.price,
         total: parseFloat((item.price * item.quantity).toFixed(2))
       })),
       totalAmount: parseFloat(totalAmount.toFixed(2)),
       amountPaid: parseFloat(amountPaid.toFixed(2)),
       change: parseFloat((amountPaid - totalAmount).toFixed(2))
     };

     const docRef = await addDoc(collection(db, 'transactions'), transactionData);
     console.log("Transaction saved with ID: ", docRef.id);

     // Update inventory quantities
     for (const cartItem of cartItems) {
       const inventoryRef = collection(db, 'inventory', cartItem.productCategory, cartItem.productCategory);
       const querySnapshot = await getDocs(query(inventoryRef, where("CODE", "==", cartItem.code)));
       querySnapshot.forEach(async (inventoryDoc) => {
         const currentQty = parseInt(inventoryDoc.data().QTY);
         const newQty = currentQty - cartItem.quantity;
         await updateDoc(inventoryDoc.ref, { QTY: newQty });
         console.log(`Updated quantity for ${cartItem.name} in ${cartItem.productCategory} from ${currentQty} to ${newQty}`);
       });
     }

     cartItems = [];
     renderCartItems();
     updateTotal();
     amountPaidInput.value = '';
     changeSpan.textContent = 'Change: 0.00';
     alert('Transaction successful!');

   } catch (error) {
     console.error("Error saving transaction: ", error);
     alert('Error saving transaction.');
   }
 });

 const deleteButton = document.querySelector('.delete-button');

 deleteButton.addEventListener('click', () => {
   cartItems = [];
   renderCartItems();
   updateTotal();
   amountPaidInput.value = '';
   changeSpan.textContent = 'Change: 0.00';
   alert('Transaction discarded.');
 });


 const dateSpan = document.querySelector('.sidebar-header span:first-child');
 const timeSpan = document.querySelector('.sidebar-header span:last-child');

 function displayCurrentDateTime() {
   const now = new Date();
   const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
   const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
   dateSpan.textContent = now.toLocaleDateString('en-US', optionsDate);
   timeSpan.textContent = now.toLocaleTimeString('en-US', optionsTime);
 }

 displayCurrentDateTime();
 setInterval(displayCurrentDateTime, 1000);

 // Function to filter products based on search term
 function filterProducts(searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return productsData.filter(product => {
        return (
            product.DESCRIPTION.toLowerCase().includes(lowerCaseSearchTerm) ||
            product.CODE.toLowerCase().includes(lowerCaseSearchTerm)
        );
    });
 }

 // Event listener for the search input
 searchInput.addEventListener('input', function() {
    const searchTerm = this.value;
    const filteredProducts = filterProducts(searchTerm);
    renderProductTiles(filteredProducts);
 });

 document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    // Potentially load date and time immediately as well
  });