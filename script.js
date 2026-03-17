// Load orders on page load
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    
    // Form submission handlers
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
    document.getElementById('updateForm').addEventListener('submit', handleUpdateSubmit);
});

// Load all orders
function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '<div class="loading">Loading orders...</div>';
    
    fetch('api.php?action=getAllOrders')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayOrders(data.data);
            } else {
                ordersList.innerHTML = '<div class="empty-state">Failed to load orders</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            ordersList.innerHTML = '<div class="empty-state">Error loading orders</div>';
        });
}

// Display orders in grid
function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i>🍽️</i>
                <h3>No orders yet</h3>
                <p>Click "Create New Order" to get started</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    orders.forEach(order => {
        html += createOrderCard(order);
    });
    
    ordersList.innerHTML = html;
}

// Create order card HTML
function createOrderCard(order) {
    const statusClass = `status-${order.status}`;
    const orderDate = new Date(order.order_date).toLocaleString();
    
    return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">Order #${order.order_id}</span>
                <span class="order-status ${statusClass}">${order.status}</span>
            </div>
            <div class="order-body">
                <div class="customer-info">
                    <p><i></i> ${order.customer_name}</p>
                    <p><i></i> ${order.phone}</p>
                    ${order.email ? `<p><i></i> ${order.email}</p>` : ''}
                </div>
                <div class="food-items-list">   
                    <strong>Items:</strong>
                    <p>${order.items || 'No items'}</p>
                </div>
                <p><strong>Order Date:</strong> ${orderDate}</p>
            </div>
            <div class="order-footer">
                <span class="total-amount">Total: $${parseFloat(order.total_amount).toFixed(2)}</span>
                <button class="btn btn-success btn-sm" onclick="showUpdateModal(${order.order_id}, '${order.status}')">Update</button>
                <button class="btn btn-danger btn-sm" onclick="cancelOrder(${order.order_id})">Cancel</button>
            </div>
        </div>
    `;
}

// Show create order modal
function showCreateOrderForm() {
    document.getElementById('orderModal').style.display = 'block';
    document.getElementById('orderForm').reset();
    // Reset food items to just one
    const foodItems = document.getElementById('foodItems');
    foodItems.innerHTML = `
        <div class="food-item">
            <input type="text" placeholder="Item Name" class="item-name" required>
            <input type="number" placeholder="Quantity" class="item-quantity" min="1" required>
            <input type="number" placeholder="Price" class="item-price" min="0" step="0.01" required>
            <button type="button" class="btn-remove" onclick="removeFoodItem(this)">×</button>
        </div>
    `;
}

// Close create order modal
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Show update status modal
function showUpdateModal(orderId, currentStatus) {
    document.getElementById('updateOrderId').value = orderId;
    document.getElementById('orderStatus').value = currentStatus;
    document.getElementById('updateModal').style.display = 'block';
}

// Close update modal
function closeUpdateModal() {
    document.getElementById('updateModal').style.display = 'none';
}

// Add food item to form
function addFoodItem() {
    const foodItems = document.getElementById('foodItems');
    const newItem = document.createElement('div');
    newItem.className = 'food-item';
    newItem.innerHTML = `
        <input type="text" placeholder="Item Name" class="item-name" required>
        <input type="number" placeholder="Quantity" class="item-quantity" min="1" required>
        <input type="number" placeholder="Price" class="item-price" min="0" step="0.01" required>
        <button type="button" class="btn-remove" onclick="removeFoodItem(this)">×</button>
    `;
    foodItems.appendChild(newItem);
}

// Remove food item from form
function removeFoodItem(button) {
    const foodItems = document.getElementById('foodItems');
    if (foodItems.children.length > 1) {
        button.closest('.food-item').remove();
    } else {
        alert('You must have at least one food item');
    }
}

// Handle order form submission
function handleOrderSubmit(event) {
    event.preventDefault();
    
    // Get customer data
    const customer = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        email: document.getElementById('customerEmail').value
    };
    
    // Get food items
    const foodItems = [];
    const itemDivs = document.querySelectorAll('.food-item');
    
    for (let div of itemDivs) {
        const name = div.querySelector('.item-name').value;
        const quantity = parseInt(div.querySelector('.item-quantity').value);
        const price = parseFloat(div.querySelector('.item-price').value);
        
        if (name && quantity > 0 && price >= 0) {
            foodItems.push({ name, quantity, price });
        }
    }
    
    if (foodItems.length === 0) {
        alert('Please add at least one food item');
        return;
    }
    
    // Send to server
    fetch('api.php?action=createOrder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer, foodItems })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Order created successfully! Order ID: ' + data.order_id);
            closeModal();
            loadOrders();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error creating order');
    });
}

// Handle update form submission
function handleUpdateSubmit(event) {
    event.preventDefault();
    
    const orderId = document.getElementById('updateOrderId').value;
    const status = document.getElementById('orderStatus').value;
    
    fetch('api.php?action=updateStatus', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId, status: status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Order status updated successfully');
            closeUpdateModal();
            loadOrders();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error updating order status');
    });
}

// Cancel/Delete order
function cancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        fetch(`api.php?action=cancelOrder&id=${orderId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Order cancelled successfully');
                loadOrders();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error cancelling order');
        });
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    const updateModal = document.getElementById('updateModal');
    
    if (event.target == modal) {
        modal.style.display = 'none';
    }
    if (event.target == updateModal) {
        updateModal.style.display = 'none';
    }
}