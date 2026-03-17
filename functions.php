<?php
require_once 'config.php';

// CREATE - Add new order
function createOrder($customerData, $foodItems) {
    global $conn;
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Insert customer
        $customerSql = "INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)";
        $customerStmt = $conn->prepare($customerSql);
        $customerStmt->bind_param("sss", 
            $customerData['name'], 
            $customerData['phone'], 
            $customerData['email']
        );
        $customerStmt->execute();
        $customerId = $conn->insert_id;
        
        // Calculate total amount
        $totalAmount = 0;
        foreach ($foodItems as $item) {
            $totalAmount += $item['price'] * $item['quantity'];
        }
        
        // Insert order
        $orderSql = "INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)";
        $orderStmt = $conn->prepare($orderSql);
        $orderStmt->bind_param("id", $customerId, $totalAmount);
        $orderStmt->execute();
        $orderId = $conn->insert_id;
        
        // Insert food items
        $foodSql = "INSERT INTO food_items (order_id, item_name, quantity, price) VALUES (?, ?, ?, ?)";
        $foodStmt = $conn->prepare($foodSql);
        
        foreach ($foodItems as $item) {
            $foodStmt->bind_param("isid", 
                $orderId, 
                $item['name'], 
                $item['quantity'], 
                $item['price']
            );
            $foodStmt->execute();
        }
        
        // Commit transaction
        $conn->commit();
        
        return ['success' => true, 'order_id' => $orderId, 'message' => 'Order created successfully'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}

// READ - Get all orders with customer details
function getAllOrders() {
    global $conn;
    
    $sql = "SELECT o.*, c.name as customer_name, c.phone, c.email,
            GROUP_CONCAT(CONCAT(f.item_name, ' (', f.quantity, ' x $', f.price, ')') SEPARATOR ' | ') as items
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            LEFT JOIN food_items f ON o.order_id = f.order_id
            GROUP BY o.order_id
            ORDER BY o.order_date DESC";
    
    $result = $conn->query($sql);
    $orders = [];
    
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
    }
    
    return $orders;
}

// READ - Get single order by ID
function getOrderById($orderId) {
    global $conn;
    
    // Get order and customer details
    $sql = "SELECT o.*, c.name as customer_name, c.phone, c.email 
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.order_id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $orderId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $order = $result->fetch_assoc();
        
        // Get food items
        $itemSql = "SELECT * FROM food_items WHERE order_id = ?";
        $itemStmt = $conn->prepare($itemSql);
        $itemStmt->bind_param("i", $orderId);
        $itemStmt->execute();
        $itemResult = $itemStmt->get_result();
        
        $items = [];
        while ($item = $itemResult->fetch_assoc()) {
            $items[] = $item;
        }
        
        $order['food_items'] = $items;
        return $order;
    }
    
    return null;
}

// UPDATE - Update order status
function updateOrderStatus($orderId, $status) {
    global $conn;
    
    $sql = "UPDATE orders SET status = ? WHERE order_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $status, $orderId);
    
    if ($stmt->execute()) {
        return ['success' => true, 'message' => 'Order status updated successfully'];
    } else {
        return ['success' => false, 'message' => 'Error updating order status'];
    }
}

// DELETE - Cancel/Delete order
function cancelOrder($orderId) {
    global $conn;
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Delete food items
        $foodSql = "DELETE FROM food_items WHERE order_id = ?";
        $foodStmt = $conn->prepare($foodSql);
        $foodStmt->bind_param("i", $orderId);
        $foodStmt->execute();
        
        // Get customer ID
        $customerSql = "SELECT customer_id FROM orders WHERE order_id = ?";
        $customerStmt = $conn->prepare($customerSql);
        $customerStmt->bind_param("i", $orderId);
        $customerStmt->execute();
        $customerResult = $customerStmt->get_result();
        $customerData = $customerResult->fetch_assoc();
        
        // Delete order and customer
        $orderSql = "DELETE FROM orders WHERE order_id = ?";
        $orderStmt = $conn->prepare($orderSql);
        $orderStmt->bind_param("i", $orderId);
        $orderStmt->execute();
        
        $delCustomerSql = "DELETE FROM customers WHERE customer_id = ?";
        $delCustomerStmt = $conn->prepare($delCustomerSql);
        $delCustomerStmt->bind_param("i", $customerData['customer_id']);
        $delCustomerStmt->execute();
        
       
        $conn->commit();
        
        return ['success' => true, 'message' => 'Order cancelled successfully'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
    }
}
?>