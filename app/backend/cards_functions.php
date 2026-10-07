<?php
// cards_functions.php - функции для работы с наборами и карточками

function getDbConnection() {
    $host = 'db';
    $user = 'root';
    $pass = '1';
    $dbname = 'db1';
    
    $dbconnect = mysqli_connect($host, $user, $pass, $dbname);
    
    if (!$dbconnect) {
        die("Ошибка подключения к БД: " . mysqli_connect_error());
    }
    
    mysqli_set_charset($dbconnect, "utf8");
    return $dbconnect;
}

// ========== ЗАГРУЗКА КАРТИНОК ==========

function uploadCardImage($file, $cardId) {
    // Проверяем, есть ли файл
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    $allowedTypes = array('image/jpeg', 'image/png', 'image/gif', 'image/webp');
    if (!in_array($file['type'], $allowedTypes)) {
        return null;
    }
    
    if ($file['size'] > 5 * 1024 * 1024) {
        return null;
    }
    
    $uploadDir = dirname(__FILE__) . '/../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = "card_{$cardId}_" . time() . "." . $extension;
    $targetPath = $uploadDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        return "/uploads/" . $filename;
    }
    return null;
}

function deleteCardImage($imagePath) {
    if (empty($imagePath)) return true;
    $fullPath = dirname(__FILE__) . '/..' . $imagePath;
    if (file_exists($fullPath)) {
        return unlink($fullPath);
    }
    return true;
}

// ========== НАБОРЫ КАРТОЧЕК ==========

function getUserCardSets($userId) {
    $db = getDbConnection();
    $userId = intval($userId);
    
    $query = "SELECT cs.*, 
              (SELECT COUNT(*) FROM cards WHERE set_id = cs.id) as cards_count 
              FROM card_sets cs 
              WHERE cs.user_id = $userId 
              ORDER BY cs.id DESC";
    
    $result = mysqli_query($db, $query);
    $sets = array();
    while ($row = mysqli_fetch_assoc($result)) {
        $sets[] = $row;
    }
    mysqli_close($db);
    return $sets;
}

function getPublicSets($userId, $search = '') {
    $db = getDbConnection();
    $userId = intval($userId);
    $search = mysqli_real_escape_string($db, $search);
    
    $sql = "SELECT cs.*, u.login as author_name,
            (SELECT COUNT(*) FROM cards WHERE set_id = cs.id) as cards_count
            FROM card_sets cs
            JOIN users u ON cs.user_id = u.id
            WHERE cs.is_public = 1 
            AND cs.user_id != $userId";
    
    if (!empty($search)) {
        $sql .= " AND (cs.title LIKE '%$search%' OR cs.description LIKE '%$search%')";
    }
    
    $sql .= " ORDER BY cs.id DESC";
    
    $result = mysqli_query($db, $sql);
    $sets = array();
    while ($row = mysqli_fetch_assoc($result)) {
        $sets[] = $row;
    }
    mysqli_close($db);
    return $sets;
}

function getCardSet($setId) {
    $db = getDbConnection();
    $setId = intval($setId);
    
    $setQuery = "SELECT cs.*, u.login as author_name 
                 FROM card_sets cs
                 JOIN users u ON cs.user_id = u.id
                 WHERE cs.id = $setId";
    $setResult = mysqli_query($db, $setQuery);
    $set = mysqli_fetch_assoc($setResult);
    
    if (!$set) {
        mysqli_close($db);
        return null;
    }
    
    $cardsQuery = "SELECT * FROM cards WHERE set_id = $setId ORDER BY id ASC";
    $cardsResult = mysqli_query($db, $cardsQuery);
    $cards = array();
    while ($card = mysqli_fetch_assoc($cardsResult)) {
        $cards[] = $card;
    }
    $set['cards'] = $cards;
    
    mysqli_close($db);
    return $set;
}

function createCardSet($userId, $title, $description, $isPublic = 0) {
    $db = getDbConnection();
    $userId = intval($userId);
    $title = mysqli_real_escape_string($db, $title);
    $description = mysqli_real_escape_string($db, $description);
    $isPublic = $isPublic ? 1 : 0;
    
    $query = "INSERT INTO card_sets (user_id, title, description, is_public) 
              VALUES ($userId, '$title', '$description', $isPublic)";
    
    if (mysqli_query($db, $query)) {
        $newId = mysqli_insert_id($db);
        mysqli_close($db);
        return $newId;
    }
    mysqli_close($db);
    return false;
}

function updateCardSet($setId, $userId, $title, $description, $isPublic) {
    $db = getDbConnection();
    $setId = intval($setId);
    $userId = intval($userId);
    $title = mysqli_real_escape_string($db, $title);
    $description = mysqli_real_escape_string($db, $description);
    $isPublic = $isPublic ? 1 : 0;
    
    $check = mysqli_query($db, "SELECT id FROM card_sets WHERE id = $setId AND user_id = $userId");
    if (mysqli_num_rows($check) == 0) {
        mysqli_close($db);
        return false;
    }
    
    $query = "UPDATE card_sets SET 
              title = '$title', 
              description = '$description', 
              is_public = $isPublic 
              WHERE id = $setId AND user_id = $userId";
    
    $result = mysqli_query($db, $query);
    mysqli_close($db);
    return $result;
}

function deleteCardSet($setId, $userId) {
    $db = getDbConnection();
    $setId = intval($setId);
    $userId = intval($userId);
    
    // Сначала удаляем все картинки карточек набора
    $getCards = mysqli_query($db, "SELECT card_image FROM cards c 
                                    JOIN card_sets cs ON c.set_id = cs.id 
                                    WHERE cs.id = $setId AND cs.user_id = $userId");
    while ($card = mysqli_fetch_assoc($getCards)) {
        if ($card['card_image']) {
            deleteCardImage($card['card_image']);
        }
    }
    
    $query = "DELETE FROM card_sets WHERE id = $setId AND user_id = $userId";
    $result = mysqli_query($db, $query);
    mysqli_close($db);
    return $result;
}

function copyCardSet($sourceSetId, $userId) {
    $db = getDbConnection();
    $sourceSetId = intval($sourceSetId);
    $userId = intval($userId);
    
    $getSet = mysqli_query($db, "SELECT title, description FROM card_sets WHERE id = $sourceSetId");
    $sourceSet = mysqli_fetch_assoc($getSet);
    
    if (!$sourceSet) {
        mysqli_close($db);
        return false;
    }
    
    $newTitle = mysqli_real_escape_string($db, "Копия: " . $sourceSet['title']);
    $newDesc = mysqli_real_escape_string($db, $sourceSet['description']);
    
    $insertSet = "INSERT INTO card_sets (user_id, title, description, is_public, created_at) 
                  VALUES ($userId, '$newTitle', '$newDesc', 0, NOW())";
    
    if (!mysqli_query($db, $insertSet)) {
        mysqli_close($db);
        return false;
    }
    
    $newSetId = mysqli_insert_id($db);
    
    $getCards = mysqli_query($db, "SELECT front_content, back_content, card_image FROM cards WHERE set_id = $sourceSetId");
    while ($card = mysqli_fetch_assoc($getCards)) {
        $front = mysqli_real_escape_string($db, $card['front_content']);
        $back = mysqli_real_escape_string($db, $card['back_content']);
        $cardImage = $card['card_image'] ? "'" . mysqli_real_escape_string($db, $card['card_image']) . "'" : "NULL";
        mysqli_query($db, "INSERT INTO cards (set_id, front_content, back_content, card_image) 
                           VALUES ($newSetId, '$front', '$back', $cardImage)");
    }
    
    mysqli_close($db);
    return $newSetId;
}

// ========== КАРТОЧКИ ==========

// ГЛАВНАЯ ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ ДОБАВЛЕНИЯ КАРТОЧКИ
function addCardWithImages($setId, $userId, $frontContent, $backContent, $imageFile = null) {
    $db = getDbConnection();
    $setId = intval($setId);
    $userId = intval($userId);
    $frontContent = mysqli_real_escape_string($db, $frontContent);
    $backContent = mysqli_real_escape_string($db, $backContent);
    
    // Проверяем, что набор принадлежит пользователю
    $check = mysqli_query($db, "SELECT id FROM card_sets WHERE id = $setId AND user_id = $userId");
    if (mysqli_num_rows($check) == 0) {
        mysqli_close($db);
        return array('success' => false, 'message' => 'Набор не найден');
    }
    
    // Сначала вставляем карточку, чтобы получить ID
    $query = "INSERT INTO cards (set_id, front_content, back_content) 
              VALUES ($setId, '$frontContent', '$backContent')";
    
    if (!mysqli_query($db, $query)) {
        mysqli_close($db);
        return array('success' => false, 'message' => 'Ошибка добавления карточки');
    }
    
    $newCardId = mysqli_insert_id($db);
    
    // Теперь загружаем картинку, используя ID карточки
    $imagePath = null;
    if ($imageFile !== null && isset($imageFile['error']) && $imageFile['error'] === UPLOAD_ERR_OK) {
        $imagePath = uploadCardImage($imageFile, $newCardId);
        if ($imagePath) {
            // Обновляем карточку с путём к картинке
            $imagePathEscaped = mysqli_real_escape_string($db, $imagePath);
            mysqli_query($db, "UPDATE cards SET card_image = '$imagePathEscaped' WHERE id = $newCardId");
        }
    }
    
    mysqli_close($db);
    
    return array(
        'success' => true, 
        'card_id' => $newCardId,
        'card_image' => $imagePath
    );
}

function updateCard($cardId, $setId, $userId, $frontContent, $backContent, $imageFile = null) {
    $db = getDbConnection();
    $cardId = intval($cardId);
    $setId = intval($setId);
    $userId = intval($userId);
    $frontContent = mysqli_real_escape_string($db, $frontContent);
    $backContent = mysqli_real_escape_string($db, $backContent);
    
    $check = mysqli_query($db, "SELECT cs.id FROM cards c 
                                JOIN card_sets cs ON c.set_id = cs.id 
                                WHERE c.id = $cardId AND cs.user_id = $userId");
    if (mysqli_num_rows($check) == 0) {
        mysqli_close($db);
        return array('success' => false, 'message' => 'Карточка не найдена');
    }
    
    // Если есть новая картинка
    if ($imageFile !== null && isset($imageFile['error']) && $imageFile['error'] === UPLOAD_ERR_OK) {
        // Удаляем старую картинку
        $oldImage = mysqli_query($db, "SELECT card_image FROM cards WHERE id = $cardId");
        if ($oldImage && $oldRow = mysqli_fetch_assoc($oldImage)) {
            if ($oldRow['card_image']) {
                deleteCardImage($oldRow['card_image']);
            }
        }
        
        // Загружаем новую
        $imagePath = uploadCardImage($imageFile, $cardId);
        if ($imagePath) {
            $imagePathEscaped = mysqli_real_escape_string($db, $imagePath);
            $query = "UPDATE cards SET front_content = '$frontContent', back_content = '$backContent', card_image = '$imagePathEscaped' 
                      WHERE id = $cardId AND set_id = $setId";
        } else {
            $query = "UPDATE cards SET front_content = '$frontContent', back_content = '$backContent' 
                      WHERE id = $cardId AND set_id = $setId";
        }
    } else {
        $query = "UPDATE cards SET front_content = '$frontContent', back_content = '$backContent' 
                  WHERE id = $cardId AND set_id = $setId";
    }
    
    $result = mysqli_query($db, $query);
    mysqli_close($db);
    
    return array('success' => $result, 'message' => $result ? 'Обновлено' : 'Ошибка обновления');
}

function deleteCard($cardId, $userId) {
    $db = getDbConnection();
    $cardId = intval($cardId);
    $userId = intval($userId);
    
    // Получаем пути к картинкам для удаления
    $getImages = mysqli_query($db, "SELECT card_image FROM cards c 
                                    JOIN card_sets cs ON c.set_id = cs.id 
                                    WHERE c.id = $cardId AND cs.user_id = $userId");
    if ($getImages && mysqli_num_rows($getImages) > 0) {
        $images = mysqli_fetch_assoc($getImages);
        if ($images['card_image']) {
            deleteCardImage($images['card_image']);
        }
    }
    
    $query = "DELETE c FROM cards c 
              JOIN card_sets cs ON c.set_id = cs.id 
              WHERE c.id = $cardId AND cs.user_id = $userId";
    
    $result = mysqli_query($db, $query);
    mysqli_close($db);
    return $result;
}

function saveFullSet($setId, $userId, $title, $description, $isPublic, $cards) {
    $db = getDbConnection();
    
    if (!updateCardSet($setId, $userId, $title, $description, $isPublic)) {
        mysqli_close($db);
        return false;
    }
    
    $existingCards = array();
    $getExisting = mysqli_query($db, "SELECT id FROM cards WHERE set_id = $setId");
    while ($row = mysqli_fetch_assoc($getExisting)) {
        $existingCards[$row['id']] = true;
    }
    
    $processedCards = array();
    foreach ($cards as $card) {
        if (isset($card['id']) && $card['id'] > 0 && isset($existingCards[$card['id']])) {
            $cardId = intval($card['id']);
            $front = mysqli_real_escape_string($db, $card['front_content']);
            $back = mysqli_real_escape_string($db, $card['back_content']);
            mysqli_query($db, "UPDATE cards SET front_content = '$front', back_content = '$back' 
                               WHERE id = $cardId AND set_id = $setId");
            $processedCards[$cardId] = true;
        } else {
            $front = mysqli_real_escape_string($db, $card['front_content']);
            $back = mysqli_real_escape_string($db, $card['back_content']);
            mysqli_query($db, "INSERT INTO cards (set_id, front_content, back_content, created_at) 
                               VALUES ($setId, '$front', '$back', NOW())");
        }
    }
    
    foreach ($existingCards as $cardId => $true) {
        if (!isset($processedCards[$cardId])) {
            mysqli_query($db, "DELETE FROM cards WHERE id = $cardId AND set_id = $setId");
        }
    }
    
    mysqli_close($db);
    return true;
}
?>