<?php
// Only POST requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");


include_once 'functions.php';


$action = isset($_POST['action']) ? $_POST['action'] : '';

if ($action == 'register') {
	registerUser($_POST['login'],$_POST['password'],$_POST['email']);
}

if ($action == 'login') {
	loginUser($_POST['login'],$_POST['password']);
}
if ($action == 'logout') {
	logoutUser();
}  ?>
 
	
									




 
	