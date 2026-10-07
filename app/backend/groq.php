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
    echo json_encode(array('success' => false, 'error' => 'Database connection failed'));
    exit();
}

$GROQ_API_KEY = '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';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input === null) {
        echo json_encode(array('success' => false, 'error' => 'Invalid JSON input'));
        exit();
    }
    
    $action = isset($input['action']) ? $input['action'] : '';
    
    // === ÒÅÑÒ ===
    if ($action === 'test') {
        echo json_encode(array('success' => true, 'message' => 'API is working!'));
        exit();
    }
    
    // === ÃÅÍÅÐÀÖÈß ÎÒÂÅÒÀ ÀÑÑÈÑÒÅÍÒÀ ===
    if ($action === 'generate_response') {
        $messages = isset($input['messages']) ? $input['messages'] : array();
        $complexity = isset($input['complexity']) ? $input['complexity'] : 'medium';
        
        $groqMessages = array();
        $systemPrompt = getSystemPrompt($complexity);
        $groqMessages[] = array('role' => 'system', 'content' => $systemPrompt);
        
        foreach ($messages as $msg) {
            $role = $msg['role'] === 'assistant' ? 'assistant' : 'user';
            $groqMessages[] = array('role' => $role, 'content' => $msg['text']);
        }
        
        $response = callGroq($groqMessages);
        echo json_encode(array('success' => true, 'message' => $response));
        exit();
    }
    
    // === ÀÍÀËÈÇ ÑÎÎÁÙÅÍÈß ===
    if ($action === 'analyze_message') {
        $text = isset($input['text']) ? $input['text'] : '';
        $complexity = isset($input['complexity']) ? $input['complexity'] : 'medium';
        
        $analysis = analyzeWithGroq($text, $complexity);
        echo json_encode(array('success' => true, 'analysis' => $analysis));
        exit();
    }
    
    // === ÎÒ×ÅÒ ÏÎ ÄÈÀËÎÃÓ ===
    if ($action === 'generate_report') {
        $messages = isset($input['messages']) ? $input['messages'] : array();
        $report = generateDialogReport($messages);
        echo json_encode(array('success' => true, 'report' => $report));
        exit();
    }
    
    // === ÑÎÇÄÀÍÈÅ ÍÎÂÎÃÎ ÄÈÀËÎÃÀ ===
    // === ÑÎÇÄÀÍÈÅ ÍÎÂÎÃÎ ÄÈÀËÎÃÀ ===
if ($action === 'create_dialog') {
    // Èñïðàâëåíî: ïîëó÷àåì çíà÷åíèå user_id, à íå true/false
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : 1;
    $complexity = isset($input['complexity']) ? $input['complexity'] : 'medium';
    $totalMessages = isset($input['total_messages']) ? (int)$input['total_messages'] : 10;
    
    try {
        $stmt = $pdo->prepare("INSERT INTO dialogs (user_id, dialog_date, message_count, complexity) VALUES (?, CURDATE(), ?, ?)");
        $stmt->execute(array($userId, $totalMessages, $complexity));
        $dialogId = $pdo->lastInsertId();
        
        echo json_encode(array('success' => true, 'dialog_id' => $dialogId));
    } catch(PDOException $e) {
        echo json_encode(array('success' => false, 'error' => $e->getMessage()));
    }
    exit();
}
    
    // === ÑÎÕÐÀÍÅÍÈÅ ÑÎÎÁÙÅÍÈß ===
    if ($action === 'save_message') {
        $dialogId = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;
        $messageNumber = isset($input['message_number']) ? (int)$input['message_number'] : 0;
        $senderType = isset($input['sender_type']) ? $input['sender_type'] : '';
        $messageText = isset($input['message_text']) ? $input['message_text'] : '';
        
        try {
            $stmt = $pdo->prepare("INSERT INTO dialog_messages (dialog_id, message_number, sender_type, message_text) VALUES (?, ?, ?, ?)");
            $stmt->execute(array($dialogId, $messageNumber, $senderType, $messageText));
            echo json_encode(array('success' => true));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        exit();
    }
    
    // === ÏÎËÓ×ÅÍÈÅ ÄÈÀËÎÃÎÂ ÏÎËÜÇÎÂÀÒÅËß ===
    if ($action === 'get_dialogs') {
        // Áåðåì user_id èç çàïðîñà
        $userId = isset($input['user_id']) ? (int)$input['user_id'] : 1;
        
        try {
            $stmt = $pdo->prepare("SELECT id, dialog_date, message_count, complexity, completed FROM dialogs WHERE user_id = ? ORDER BY dialog_date DESC, id DESC");
            $stmt->execute(array($userId));
            $dialogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(array('success' => true, 'dialogs' => $dialogs));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        exit();
    }
    
    // === ÏÎËÓ×ÅÍÈÅ ÑÎÎÁÙÅÍÈÉ ÄÈÀËÎÃÀ ===
    if ($action === 'get_messages') {
        $dialogId = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;
        
        try {
            $stmt = $pdo->prepare("SELECT message_number, sender_type, message_text FROM dialog_messages WHERE dialog_id = ? ORDER BY message_number ASC");
            $stmt->execute(array($dialogId));
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(array('success' => true, 'messages' => $messages));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        exit();
    }
    
    // === ÇÀÂÅÐØÅÍÈÅ ÄÈÀËÎÃÀ ===
    if ($action === 'complete_dialog') {
        $dialogId = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;
        
        try {
            $stmt = $pdo->prepare("UPDATE dialogs SET completed = 1 WHERE id = ?");
            $stmt->execute(array($dialogId));
            echo json_encode(array('success' => true));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        exit();
    }
    
    // === ÓÄÀËÅÍÈÅ ÄÈÀËÎÃÀ ===
    if ($action === 'delete_dialog') {
        $dialogId = isset($input['dialog_id']) ? (int)$input['dialog_id'] : 0;
        $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
        
        try {
            // Ïðîâåðÿåì, ÷òî äèàëîã ïðèíàäëåæèò ïîëüçîâàòåëþ
            $stmt = $pdo->prepare("DELETE FROM dialogs WHERE id = ? AND user_id = ?");
            $stmt->execute(array($dialogId, $userId));
            echo json_encode(array('success' => true));
        } catch(PDOException $e) {
            echo json_encode(array('success' => false, 'error' => $e->getMessage()));
        }
        exit();
    }
    
    echo json_encode(array('success' => false, 'error' => 'Unknown action: ' . $action));
    exit();
}

echo json_encode(array('success' => false, 'error' => 'Only POST requests allowed'));

// ========== ÂÑÏÎÌÎÃÀÒÅËÜÍÛÅ ÔÓÍÊÖÈÈ ==========

function analyzeWithGroq($text, $complexity) {
    global $GROQ_API_KEY;
    
    $prompt = "Analyze this English text. If has error, give correction and description in Russian. If correct, give praise in Russian. 
Text: \"$text\"
Return JSON: {\"hasError\":true/false,\"correction\":\"...\",\"errorDescription\":\"...\",\"praise\":\"...\"}";
    
    $messages = array(
        array('role' => 'system', 'content' => 'You are English grammar expert. Return only JSON.'),
        array('role' => 'user', 'content' => $prompt)
    );
    
    $data = array(
        'model' => 'openai/gpt-oss-120b',
        'messages' => $messages,
        'temperature' => 0.3,
        'max_tokens' => 300
    );
    
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer ' . $GROQ_API_KEY,
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        if (isset($result['choices'][0]['message']['content'])) {
            $content = $result['choices'][0]['message']['content'];
            $start = strpos($content, '{');
            $end = strrpos($content, '}');
            if ($start !== false && $end !== false) {
                $jsonStr = substr($content, $start, $end - $start + 1);
                $json = json_decode($jsonStr, true);
                if ($json && isset($json['hasError'])) {
                    return $json;
                }
            }
        }
    }
    
    return simpleAnalysis($text, $complexity);
}

function generateDialogReport($messages) {
    global $GROQ_API_KEY;
    
    $history = "";
    foreach ($messages as $msg) {
        $role = $msg['sender_type'] === 'user' ? 'Student' : 'Tutor';
        $history .= "$role: " . $msg['message_text'] . "\n";
    }
    
    $prompt = "Analyze this English learning conversation. Give report in Russian with: 1)Îáùàÿ îöåíêà 2)Îøèáêè 3)Ëåêñèêà 4)Ðåêîìåíäàöèè. Conversation:\n$history";
    
    $groqMessages = array(
        array('role' => 'system', 'content' => 'You are English teacher. Give constructive feedback in Russian.'),
        array('role' => 'user', 'content' => $prompt)
    );
    
    $data = array(
        'model' => 'openai/gpt-oss-120b',
        'messages' => $groqMessages,
        'temperature' => 0.5,
        'max_tokens' => 500
    );
    
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer ' . $GROQ_API_KEY,
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    if (isset($result['choices'][0]['message']['content'])) {
        return $result['choices'][0]['message']['content'];
    }
    
    return "Îò÷åò âðåìåííî íåäîñòóïåí.";
}

function getSystemPrompt($complexity) {
    if ($complexity === 'easy') {
        return "You are English tutor for A1-A2 level. Use simple words. Ask easy questions about hobbies, family, daily routine. Be friendly.";
    } elseif ($complexity === 'medium') {
        return "You are English tutor for B1-B2 level. Use intermediate vocabulary. Ask about travel, work, opinions. Be encouraging.";
    } else {
        return "You are English tutor for C1-C2 level. Use advanced vocabulary. Discuss abstract topics. Provide sophisticated feedback.";
    }
}

function simpleAnalysis($text, $complexity) {
    $length = strlen($text);
    
    if ($length < 3) {
        return array(
            'hasError' => true,
            'correction' => 'Please write a complete sentence.',
            'errorDescription' => 'Ïðåäëîæåíèå ñëèøêîì êîðîòêîå',
            'praise' => null
        );
    }
    
    if ($complexity === 'hard' && $length < 15) {
        return array(
            'hasError' => true,
            'correction' => $text . ' (add more details)',
            'errorDescription' => 'Íóæíî áîëüøå äåòàëåé äëÿ ïðîäâèíóòîãî óðîâíÿ',
            'praise' => null
        );
    }
    
    return array(
        'hasError' => false,
        'correction' => null,
        'errorDescription' => null,
        'praise' => $length > 20 ? 'Îòëè÷íî! Õîðîøèé îòâåò!' : 'Õîðîøàÿ ðàáîòà!'
    );
}

function callGroq($messages) {
    global $GROQ_API_KEY;
    
    $data = array(
        'model' => 'openai/gpt-oss-120b',
        'messages' => $messages,
        'temperature' => 0.7,
        'max_tokens' => 700
    );
    
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer ' . $GROQ_API_KEY,
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    if (isset($result['choices'][0]['message']['content'])) {
        return $result['choices'][0]['message']['content'];
    }
    
    return "Can you tell me more about that?";
}
?>