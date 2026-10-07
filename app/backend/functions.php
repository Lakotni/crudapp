<?php
$dbconnect = mysqli_connect("db", "root", "1", "db1");

function sendResponse($success, $message, $data = null) {
	$response = ["success" => $success, "message" => $message];
	if ($data) $response["user"] = $data;	
	echo json_encode($response);
	exit;
}
function registerUser($login, $password, $email){
	global $dbconnect;	
	$login = mysqli_real_escape_string($dbconnect, $_POST['login']);
	$password = md5($_POST['password']);
	$email = mysqli_real_escape_string($dbconnect, $_POST['email']);

	$logincheck = mysqli_query($dbconnect, "SELECT id FROM users WHERE login = '$login'");

	if (mysqli_num_rows($logincheck) == 0) {
		mysqli_query($dbconnect, "INSERT INTO users (login, password, email) VALUES ('$login', '$password', '$email')");
		sendResponse(true, "Registration is succsessefull");
	} else {
		sendResponse(false, "This login is already taken");
		}
}

function loginUser($login,$password){
	global $dbconnect;
	$login = mysqli_real_escape_string($dbconnect, $_POST['login']);
	$password = md5($_POST['password']);

	$logresult = mysqli_query($dbconnect, "SELECT id, login, email FROM users WHERE login = '$login' AND password = '$password'");
	
	if (mysqli_num_rows($logresult) == 1) {
		$user = mysqli_fetch_assoc($logresult);
		sendResponse(true, "Succsessefull login", [
			"id" => $user['id'],
			"login" => $user['login'],
			"email" => $user['email'] ]);
} else {
	sendResponse(false, "login or password is incorrect");
	}
}
function logoutUser() {
	sendResponse(true, "You are logout");
	}
 ?>
