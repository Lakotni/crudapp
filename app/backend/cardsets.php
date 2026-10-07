<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, DELETE, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once 'functions.php';
include_once 'cards_functions.php';

$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

// GET запросы
if ($method == 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    if ($action == 'my_sets') {
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
        $sets = getUserCardSets($userId);
        sendResponse(true, "Мои наборы", array("sets" => $sets));
    }
    elseif ($action == 'public_sets') {
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $sets = getPublicSets($userId, $search);
        sendResponse(true, "Общие наборы", array("sets" => $sets));
    }
    elseif ($action == 'get_set') {
        $setId = isset($_GET['set_id']) ? intval($_GET['set_id']) : 0;
        $set = getCardSet($setId);
        if ($set) {
            sendResponse(true, "Набор получен", array("set" => $set));
        } else {
            sendResponse(false, "Набор не найден");
        }
    }
    else {
        sendResponse(false, "Неизвестное действие GET");
    }
}

// POST запросы
if ($method == 'POST') {
    $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    
    if ($action == 'create_set') {
        $title = isset($_POST['title']) ? $_POST['title'] : '';
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $isPublic = isset($_POST['is_public']) ? intval($_POST['is_public']) : 0;
        
        if (empty($title)) {
            sendResponse(false, "Название набора обязательно");
        }
        
        $newId = createCardSet($userId, $title, $description, $isPublic);
        if ($newId) {
            sendResponse(true, "Набор создан", array("set_id" => $newId));
        } else {
            sendResponse(false, "Ошибка при создании набора");
        }
    }
    elseif ($action == 'edit_set') {
        $setId = isset($_POST['set_id']) ? intval($_POST['set_id']) : 0;
        $title = isset($_POST['title']) ? $_POST['title'] : '';
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $isPublic = isset($_POST['is_public']) ? intval($_POST['is_public']) : 0;
        
        if (updateCardSet($setId, $userId, $title, $description, $isPublic)) {
            sendResponse(true, "Набор обновлён");
        } else {
            sendResponse(false, "Ошибка при обновлении набора");
        }
    }
    elseif ($action == 'delete_set') {
        $setId = isset($_POST['set_id']) ? intval($_POST['set_id']) : 0;
        
        if (deleteCardSet($setId, $userId)) {
            sendResponse(true, "Набор удалён");
        } else {
            sendResponse(false, "Ошибка при удалении набора");
        }
    }
    elseif ($action == 'copy_set') {
        $sourceSetId = isset($_POST['source_set_id']) ? intval($_POST['source_set_id']) : 0;
        
        $newSetId = copyCardSet($sourceSetId, $userId);
        if ($newSetId) {
            sendResponse(true, "Набор скопирован", array("set_id" => $newSetId));
        } else {
            sendResponse(false, "Ошибка при копировании набора");
        }
    }
    elseif ($action == 'add_card') {
        $setId = isset($_POST['set_id']) ? intval($_POST['set_id']) : 0;
        $frontContent = isset($_POST['front_content']) ? $_POST['front_content'] : '';
        $backContent = isset($_POST['back_content']) ? $_POST['back_content'] : '';
        
        if (empty($frontContent) || empty($backContent)) {
            sendResponse(false, "Заполните все поля карточки");
            exit();
        }
        
        if ($setId == 0 || $userId == 0) {
            sendResponse(false, "Неверные параметры набора или пользователя");
            exit();
        }
        
        // Получаем файл картинки (если есть)
        $imageFile = null;
        if (isset($_FILES['card_image']) && $_FILES['card_image']['error'] === UPLOAD_ERR_OK) {
            $imageFile = $_FILES['card_image'];
        }
        
        // Вызываем исправленную функцию addCardWithImages
        $result = addCardWithImages($setId, $userId, $frontContent, $backContent, $imageFile);
        
        if ($result['success']) {
            sendResponse(true, "Карточка добавлена", array(
                "card_id" => $result['card_id'],
                "card_image" => $result['card_image']
            ));
        } else {
            sendResponse(false, $result['message']);
        }
    }
    elseif ($action == 'edit_card') {
        $cardId = isset($_POST['card_id']) ? intval($_POST['card_id']) : 0;
        $setId = isset($_POST['set_id']) ? intval($_POST['set_id']) : 0;
        $frontContent = isset($_POST['front_content']) ? $_POST['front_content'] : '';
        $backContent = isset($_POST['back_content']) ? $_POST['back_content'] : '';
        
        $imageFile = null;
        if (isset($_FILES['card_image']) && $_FILES['card_image']['error'] === UPLOAD_ERR_OK) {
            $imageFile = $_FILES['card_image'];
        }
        
        $result = updateCard($cardId, $setId, $userId, $frontContent, $backContent, $imageFile);
        
        if ($result['success']) {
            sendResponse(true, "Карточка обновлена");
        } else {
            sendResponse(false, $result['message']);
        }
    }
    elseif ($action == 'delete_card') {
        $cardId = isset($_POST['card_id']) ? intval($_POST['card_id']) : 0;
        
        if (deleteCard($cardId, $userId)) {
            sendResponse(true, "Карточка удалена");
        } else {
            sendResponse(false, "Ошибка при удалении карточки");
        }
    }
    elseif ($action == 'save_full_set') {
        $setId = isset($_POST['set_id']) ? intval($_POST['set_id']) : 0;
        $title = isset($_POST['title']) ? $_POST['title'] : '';
        $description = isset($_POST['description']) ? $_POST['description'] : '';
        $isPublic = isset($_POST['is_public']) ? intval($_POST['is_public']) : 0;
        $cardsJson = isset($_POST['cards']) ? $_POST['cards'] : '[]';
        $cards = json_decode($cardsJson, true);
        
        if (saveFullSet($setId, $userId, $title, $description, $isPublic, $cards)) {
            sendResponse(true, "Набор сохранён");
        } else {
            sendResponse(false, "Ошибка при сохранении набора");
        }
    }
    else {
        sendResponse(false, "Неизвестное действие POST");
    }
}

// DELETE запросы
if ($method == 'DELETE') {
    parse_str(file_get_contents("php://input"), $deleteData);
    $action = isset($deleteData['action']) ? $deleteData['action'] : '';
    $userId = isset($deleteData['user_id']) ? intval($deleteData['user_id']) : 0;
    
    if ($action == 'delete_set') {
        $setId = isset($deleteData['set_id']) ? intval($deleteData['set_id']) : 0;
        if (deleteCardSet($setId, $userId)) {
            sendResponse(true, "Набор удалён");
        } else {
            sendResponse(false, "Ошибка при удалении набора");
        }
    }
    elseif ($action == 'delete_card') {
        $cardId = isset($deleteData['card_id']) ? intval($deleteData['card_id']) : 0;
        if (deleteCard($cardId, $userId)) {
            sendResponse(true, "Карточка удалена");
        } else {
            sendResponse(false, "Ошибка при удалении карточки");
        }
    }
    else {
        sendResponse(false, "Неизвестное действие DELETE");
    }
}
?>