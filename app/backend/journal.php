<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS');

$DB_HOST = 'db';
$DB_NAME = 'db1';
$DB_USER = 'root';
$DB_PASS = '1';

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(array('success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()));
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========== GET ЗАПРОСЫ ==========
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    
    if ($action === 'get_journal') {
        if (!$userId) {
            echo json_encode(array('success' => false, 'error' => 'User ID required'));
            exit();
        }
        
        try {
            // 1. Получаем диалоги
            $stmt = $pdo->prepare("
                SELECT id, dialog_date as date, 'dialog' as type, 
                       CONCAT('Date time ', dialog_date) as name, 
                       message_count 
                FROM dialogs 
                WHERE user_id = ? 
                ORDER BY dialog_date DESC 
                LIMIT 50
            ");
            $stmt->execute(array($userId));
            $dialogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 2. Получаем тесты
            $stmt = $pdo->prepare("
                SELECT id, test_date as date, score, total_questions, level, percentage,
                       score as correct, (total_questions - score) as wrong
                FROM test_results 
                WHERE user_id = ? 
                ORDER BY test_date DESC 
                LIMIT 50
            ");
            $stmt->execute(array($userId));
            $tests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 3. Получаем наборы с прогрессом
            $stmt = $pdo->prepare("
                SELECT cs.id, cs.title, 
                       COUNT(c.id) as total_cards
                FROM card_sets cs
                LEFT JOIN cards c ON cs.id = c.set_id
                WHERE cs.user_id = ?
                GROUP BY cs.id
                ORDER BY cs.id DESC
            ");
            $stmt->execute(array($userId));
            $sets = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $setsProgress = array();
            foreach ($sets as $set) {
                $total = (int)$set['total_cards'];
                $setsProgress[] = array(
                    'id' => $set['id'],
                    'title' => $set['title'],
                    'totalCards' => $total,
                    'learnedCards' => 0,
                    'percent' => 0
                );
            }
            
            // 4. Определяем статус посещения
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM dialogs 
                WHERE user_id = ? AND dialog_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ");
            $stmt->execute(array($userId));
            $dialogCount = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $visitStatus = 'rare';
            if ($dialogCount['count'] >= 10) {
                $visitStatus = 'frequent';
            } elseif ($dialogCount['count'] >= 3) {
                $visitStatus = 'normal';
            }
            
            echo json_encode(array(
                'success' => true,
                'data' => array(
                    'visitStatus' => $visitStatus,
                    'actions' => $dialogs,
                    'tests' => $tests,
                    'setsProgress' => $setsProgress
                )
            ));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        exit();
    }
    
    echo json_encode(array('success' => false, 'error' => 'Unknown action: ' . $action));
    exit();
}

// ========== POST ЗАПРОСЫ (УДАЛЕНИЕ) ==========
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = isset($input['action']) ? $input['action'] : '';
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    
    // Удаление диалога
    if ($action === 'delete_dialog') {
        $dialogId = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;
        
        if (!$userId || !$dialogId) {
            echo json_encode(array('success' => false, 'error' => 'User ID and Dialog ID required'));
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM dialogs WHERE id = ? AND user_id = ?");
            $stmt->execute(array($dialogId, $userId));
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(array('success' => true, 'message' => 'Dialog deleted'));
            } else {
                echo json_encode(array('success' => false, 'error' => 'Dialog not found or access denied'));
            }
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        exit();
    }
    
    // Удаление теста
    if ($action === 'delete_test') {
        $testId = isset($input['test_id']) ? (int)$input['test_id'] : 0;
        
        if (!$userId || !$testId) {
            echo json_encode(array('success' => false, 'error' => 'User ID and Test ID required'));
            exit();
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM test_results WHERE id = ? AND user_id = ?");
            $stmt->execute(array($testId, $userId));
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(array('success' => true, 'message' => 'Test deleted'));
            } else {
                echo json_encode(array('success' => false, 'error' => 'Test not found or access denied'));
            }
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        exit();
    }
    
    echo json_encode(array('success' => false, 'error' => 'Unknown action: ' . $action));
    exit();
}

echo json_encode(array('success' => false, 'error' => 'Only GET and POST requests allowed'));
?>