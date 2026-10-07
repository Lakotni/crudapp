<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

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

// ========== ПОДДЕРЖИВАЕМ И POST, И GET ==========
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = isset($input['action']) ? $input['action'] : '';
    
    handleRequest($pdo, $action, $input);
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
    $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : 0;
    
    handleGetRequest($pdo, $action, $limit, $userId);
}
else {
    echo json_encode(array('success' => false, 'error' => 'Only POST and GET requests allowed'));
    exit();
}

function handleGetRequest($pdo, $action, $limit, $userId) {
    if ($action === 'get_questions') {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'questions'");
            if ($stmt->rowCount() == 0) {
                echo json_encode(array('success' => false, 'error' => 'Questions table not found'));
                return;
            }
            
            $sql = "SELECT id, text, option_a, option_b, option_c, correct_answer, topic, level FROM questions ORDER BY RAND() LIMIT " . intval($limit);
            $stmt = $pdo->query($sql);
            $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $formattedQuestions = array();
            foreach ($questions as $q) {
                $correctLetter = $q['correct_answer'];
                $correctIndex = 0;
                if ($correctLetter === 'A') $correctIndex = 0;
                elseif ($correctLetter === 'B') $correctIndex = 1;
                elseif ($correctLetter === 'C') $correctIndex = 2;
                
                $formattedQuestions[] = array(
                    'id' => $q['id'],
                    'text' => $q['text'],
                    'topic' => $q['topic'] ? $q['topic'] : 'General',
                    'options' => array($q['option_a'], $q['option_b'], $q['option_c']),
                    'correctAnswer' => $correctIndex,
                    'level' => $q['level']
                );
            }
            
            echo json_encode(array('success' => true, 'questions' => $formattedQuestions));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        return;
    }
    
    if ($action === 'get_attempt_count') {
        if (!$userId) {
            echo json_encode(array('success' => false, 'error' => 'User ID required'));
            return;
        }
        
        try {
            // Просто считаем количество записей
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM test_results WHERE user_id = ?");
            $stmt->execute(array($userId));
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $attemptCount = $result ? (int)$result['count'] : 0;
            echo json_encode(array('success' => true, 'attempt_count' => $attemptCount));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        return;
    }
    
    echo json_encode(array('success' => false, 'error' => 'Unknown action: ' . $action));
}

function handleRequest($pdo, $action, $input) {
    // === СОХРАНЕНИЕ РЕЗУЛЬТАТОВ ТЕСТА ===
    if ($action === 'save_results') {
        $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
        $score = isset($input['score']) ? (int)$input['score'] : 0;
        $totalQuestions = isset($input['total_questions']) ? (int)$input['total_questions'] : 0;
        $level = isset($input['level']) ? $input['level'] : '';
        $attemptNumber = isset($input['attempt_number']) ? (int)$input['attempt_number'] : 1;
        
        if (!$userId) {
            echo json_encode(array('success' => false, 'error' => 'User not authenticated'));
            return;
        }
        
        $percentage = round(($score / $totalQuestions) * 100);
        
        try {
            $stmt = $pdo->prepare("INSERT INTO test_results (user_id, test_date, attempt_number, score, total_questions, percentage, level) VALUES (?, CURDATE(), ?, ?, ?, ?, ?)");
            $stmt->execute(array($userId, $attemptNumber, $score, $totalQuestions, $percentage, $level));
            
            echo json_encode(array('success' => true, 'result_id' => $pdo->lastInsertId()));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        return;
    }
    
    echo json_encode(array('success' => false, 'error' => 'Unknown action: ' . $action));
}
?>