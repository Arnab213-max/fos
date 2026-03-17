<?php
require_once 'functions.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'GET':
        if ($action == 'getAllOrders') {
            $orders = getAllOrders();
            echo json_encode(['success' => true, 'data' => $orders]);
        } elseif ($action == 'getOrder' && isset($_GET['id'])) {
            $order = getOrderById($_GET['id']);
            if ($order) {
                echo json_encode(['success' => true, 'data' => $order]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Order not found']);
            }
        }
        break;
        
    case 'POST':
        if ($action == 'createOrder') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = createOrder($data['customer'], $data['foodItems']);
            echo json_encode($result);
        }
        break;
        
    case 'PUT':
        if ($action == 'updateStatus') {
            $data = json_decode(file_get_contents('php://input'), true);
            $result = updateOrderStatus($data['order_id'], $data['status']);
            echo json_encode($result);
        }
        break;
        
    case 'DELETE':
        if ($action == 'cancelOrder' && isset($_GET['id'])) {
            $result = cancelOrder($_GET['id']);
            echo json_encode($result);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        break;
}
?>