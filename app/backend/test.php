<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

$GROQ_API_KEY = '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';

// Тестовый запрос к Groq API
$messages = array(
    array('role' => 'system', 'content' => 'You are a helpful assistant. Answer very briefly.'),
    array('role' => 'user', 'content' => 'Say "Hello World"')
);

$data = array(
    'model' => 'llama-3.3-70b-versatile',
    'messages' => $messages,
    'temperature' => 0.7,
    'max_tokens' => 50
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
$curlError = curl_error($ch);
curl_close($ch);

echo json_encode(array(
    'http_code' => $httpCode,
    'curl_error' => $curlError,
    'response' => json_decode($response, true)
), JSON_PRETTY_PRINT);
?>