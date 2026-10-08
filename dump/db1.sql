-- phpMyAdmin SQL Dump
-- version 5.0.1
-- https://www.phpmyadmin.net/
--
-- Хост: db
-- Время создания: Окт 08 2026 г., 19:35
-- Версия сервера: 8.0.19
-- Версия PHP: 7.4.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `db1`
--

-- --------------------------------------------------------

--
-- Структура таблицы `cards`
--

CREATE TABLE `cards` (
  `id` int NOT NULL,
  `set_id` int NOT NULL,
  `front_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `back_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `card_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `cards`
--

INSERT INTO `cards` (`id`, `set_id`, `front_content`, `back_content`, `card_image`) VALUES
(51, 41, 'Sad', 'Весело', NULL),
(52, 41, 'Disappoint', 'Разочарование', NULL),
(53, 41, 'momom', 'момом', NULL),
(57, 46, 'Sad', 'Грустно', NULL),
(58, 46, 'Disappoint', 'Разочарование', NULL),
(59, 46, 'momom', 'момом', NULL),
(62, 63, 'еterm', 'tete', NULL),
(63, 63, 'teeerm', 'raerea', '/uploads/card_63_1779638204.png'),
(67, 64, 'termin', 'tterm', '/uploads/card_67_1779655710.webp'),
(68, 41, 'Лалала', 'Упс', '/uploads/card_68_1779655935.jpeg'),
(69, 65, 'Термин', 'Слово', NULL),
(70, 66, 'Помидор', 'tomato', '/uploads/card_70_1779697466.jpg'),
(71, 66, 'Огурец', 'cucumber', '/uploads/card_71_1779697514.jpg'),
(72, 66, 'Банан', 'banana', '/uploads/card_72_1779697654.png'),
(73, 68, 'Груша', 'tomato', '/uploads/card_73_1779908148.jpg');

-- --------------------------------------------------------

--
-- Структура таблицы `card_sets`
--

CREATE TABLE `card_sets` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `card_sets`
--

INSERT INTO `card_sets` (`id`, `user_id`, `title`, `description`, `is_public`) VALUES
(41, 8, 'Sad that my boyfriend doesn’t let me do fun things', '', 1),
(46, 9, 'Eng', '', 0),
(63, 10, 'nabor', '', 0),
(64, 4, 'nabor', '', 0),
(65, 4, 'Nabor', '', 0),
(66, 1, 'Овощи', '', 0),
(67, 12, 'aaqqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaasaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaadaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', 0),
(68, 13, 'nabor', '', 0),
(69, 14, 'писюны', 'писюны тайских шлюх', 0);

-- --------------------------------------------------------

--
-- Структура таблицы `dialogs`
--

CREATE TABLE `dialogs` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `dialog_date` date NOT NULL,
  `message_count` int DEFAULT '0',
  `complexity` enum('easy','medium','hard') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `completed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `dialogs`
--

INSERT INTO `dialogs` (`id`, `user_id`, `dialog_date`, `message_count`, `complexity`, `completed`, `created_at`) VALUES
(14, 1, '2026-05-24', 10, 'medium', 1, '2026-05-24 17:26:54'),
(15, 1, '2026-05-24', 10, 'medium', 0, '2026-05-24 17:30:13'),
(16, 1, '2026-05-24', 10, 'medium', 0, '2026-05-24 17:30:29'),
(21, 10, '2026-05-24', 10, 'medium', 1, '2026-05-24 18:10:58'),
(26, 4, '2026-05-24', 10, 'medium', 1, '2026-05-24 20:16:41'),
(28, 1, '2026-05-25', 10, 'medium', 1, '2026-05-25 02:01:14'),
(29, 12, '2026-05-25', 10, 'easy', 0, '2026-05-25 03:33:14'),
(30, 12, '2026-05-25', 10, 'medium', 0, '2026-05-25 03:34:18'),
(31, 12, '2026-05-25', 10, 'easy', 0, '2026-05-25 03:52:43'),
(32, 13, '2026-05-27', 5, 'easy', 0, '2026-05-27 18:53:34'),
(33, 13, '2026-05-27', 5, 'easy', 0, '2026-05-27 18:53:51'),
(34, 13, '2026-05-27', 10, 'medium', 0, '2026-05-27 18:56:33'),
(35, 1, '2026-08-25', 10, 'medium', 0, '2026-08-25 15:46:10'),
(36, 1, '2026-08-26', 5, 'easy', 0, '2026-08-26 15:58:28');

-- --------------------------------------------------------

--
-- Структура таблицы `dialog_messages`
--

CREATE TABLE `dialog_messages` (
  `id` int NOT NULL,
  `dialog_id` int NOT NULL,
  `message_number` int NOT NULL,
  `sender_type` enum('user','assistant','correction') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `dialog_messages`
--

INSERT INTO `dialog_messages` (`id`, `dialog_id`, `message_number`, `sender_type`, `message_text`, `created_at`) VALUES
(112, 14, 1, 'user', 'афафаф', '2026-05-24 17:27:00'),
(113, 14, 2, 'correction', '???? Текст не содержит никаких английских слов или фраз.', '2026-05-24 17:27:01'),
(114, 14, 3, 'correction', '✏️ Исправление: The text does not contain any English words or phrases.', '2026-05-24 17:27:01'),
(115, 14, 4, 'assistant', 'It seems like you\'re trying to say something, but I\'m not quite sure what it is. Don\'t worry, we can start fresh. How about we talk about something interesting? Have you traveled to any exciting places recently or have any fun trips planned? I\'m all ears and would love to hear about your adventures.', '2026-05-24 17:27:02'),
(131, 21, 1, 'user', 'How are you?', '2026-05-24 18:11:09'),
(132, 21, 2, 'correction', '???? Отлично! Вы написали идеальный вопрос на английском языке.', '2026-05-24 18:11:10'),
(133, 21, 3, 'assistant', 'I\'m doing great, thanks for asking. I\'ve had a lovely day so far, and I\'m looking forward to chatting with you. How about you? What have you been up to lately? Have you traveled anywhere exciting or had any interesting experiences you\'d like to share?', '2026-05-24 18:11:10'),
(141, 26, 1, 'user', 'Hello, how are you?', '2026-05-24 20:16:53'),
(142, 26, 2, 'correction', '???? Отлично! Ваш текст написан без ошибок. Вы правильно использовали приветствие и вопрос, что делает ваш текст вежливым и понятным.', '2026-05-24 20:16:54'),
(143, 26, 3, 'assistant', 'Hello. I\'m doing great, thanks for asking. It\'s lovely to meet you. I hope you\'re having a fantastic day as well. To get us started, I was wondering: have you traveled to any exciting places recently or have any upcoming trips planned?', '2026-05-24 20:16:55'),
(144, 26, 4, 'user', 'im fain', '2026-05-24 20:17:07'),
(145, 26, 5, 'correction', '???? Ошибка в написании фразы. \'im\' должно быть заменено на \'I\'m\', что является сокращением от \'I am\'.', '2026-05-24 20:17:08'),
(146, 26, 6, 'correction', '✏️ Исправление: I\'m fine', '2026-05-24 20:17:08'),
(147, 26, 7, 'assistant', 'It sounds like you\'re feeling a bit tired. Don\'t worry, we can take things at your pace. Sometimes, talking about something you enjoy can be a great way to boost your energy. So, let\'s try something a bit different. What do you like to do in your free time? Do you have a job or are you a student? What kind of things are you interested in?', '2026-05-24 20:17:08'),
(148, 28, 1, 'user', 'Hii', '2026-05-25 02:01:20'),
(149, 28, 2, 'correction', '???? Орфографическая ошибка. Правильное написание - \"Hi\" или \"Hello\", а не \"Hii\".', '2026-05-25 02:01:23'),
(150, 28, 3, 'correction', '✏️ Исправление: Hi', '2026-05-25 02:01:23'),
(151, 28, 4, 'assistant', 'Hello. It\'s nice to meet you. How are you today? Have you traveled to any exciting places recently or have any fun plans coming up? I\'d love to hear about them.', '2026-05-25 02:01:25'),
(152, 28, 5, 'user', 'I wanna go to Thailand', '2026-05-25 02:01:36'),
(153, 28, 6, 'correction', '???? Ошибка в использовании разговорного выражения \'wanna\', которое является сокращением от \'want to\', но в正式ной речи и письме лучше использовать полную форму \'want to\'.', '2026-05-25 02:01:38'),
(154, 28, 7, 'correction', '✏️ Исправление: I want to go to Thailand', '2026-05-25 02:01:38'),
(155, 28, 8, 'assistant', 'Thailand is a wonderful destination. The food, the culture, the beaches... there\'s so much to explore. What is it about Thailand that interests you the most? Is it the delicious cuisine, the beautiful temples, or the vibrant cities like Bangkok? Have you thought about what you\'d like to do or see when you get there?', '2026-05-25 02:01:40'),
(156, 29, 1, 'user', 'gggggggggggggggggggggggggggggggggggggggggggggfffffffffffffffffffffffffff  f', '2026-05-25 03:33:24'),
(157, 29, 2, 'assistant', 'Can you tell me more about that?', '2026-05-25 03:33:26'),
(158, 29, 3, 'user', 'affaf', '2026-05-25 03:33:41'),
(159, 29, 4, 'assistant', 'Can you tell me more about that?', '2026-05-25 03:33:42'),
(160, 29, 5, 'user', 'gaga.fgjagasngnsa', '2026-05-25 03:34:00'),
(161, 29, 6, 'assistant', 'Can you tell me more about that?', '2026-05-25 03:34:01'),
(162, 30, 1, 'user', 'heheol', '2026-05-25 03:34:24'),
(163, 30, 2, 'assistant', 'Can you tell me more about that?', '2026-05-25 03:34:25'),
(164, 30, 3, 'user', 'hihi', '2026-05-25 03:34:31'),
(165, 30, 4, 'assistant', 'Can you tell me more about that?', '2026-05-25 03:34:32'),
(166, 31, 1, 'user', 'hello', '2026-05-25 03:52:45'),
(167, 31, 2, 'assistant', 'Can you tell me more about that?', '2026-05-25 03:52:46'),
(168, 31, 3, 'user', 'How are you', '2026-05-25 03:52:57'),
(169, 31, 4, 'correction', '???? Отлично! Ваш текст грамматически правильный.', '2026-05-25 03:52:58'),
(170, 31, 5, 'assistant', 'I\'m fine, thank you. How about you? What do you like to do in your free time? Do you have a hobby?', '2026-05-25 03:52:59'),
(171, 31, 6, 'user', 'fyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyeduuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuskhk', '2026-05-25 03:53:14'),
(172, 31, 7, 'correction', '???? Введенный текст не содержит осмысленных слов или предложений, возможно, это набор случайных символов.', '2026-05-25 03:53:15'),
(173, 31, 8, 'correction', '✏️ Исправление: Не удалось определить осмысленный текст', '2026-05-25 03:53:15'),
(174, 31, 9, 'assistant', 'It looks like your keyboard got a bit mixed up. Don\'t worry, it\'s okay. Let\'s start again. What\'s your name?', '2026-05-25 03:53:17'),
(175, 34, 1, 'user', 'Hello', '2026-05-27 18:56:37'),
(176, 34, 2, 'assistant', 'Can you tell me more about that?', '2026-05-27 18:57:00'),
(177, 34, 3, 'user', 'hello', '2026-05-27 18:57:05'),
(178, 34, 4, 'correction', '???? Ошибка в регистре первой буквы. Первая буква должна быть заглавной.', '2026-05-27 18:57:11'),
(179, 34, 5, 'correction', '✏️ Исправление: Hello', '2026-05-27 18:57:11'),
(180, 34, 6, 'assistant', 'Hello. It\'s nice to meet you. How are you doing today? Have you traveled anywhere exciting recently or have any fun plans coming up?', '2026-05-27 18:57:16'),
(181, 34, 7, 'user', 'gfghjhnjkbhhbkj', '2026-05-27 18:58:03'),
(182, 34, 8, 'correction', '???? Введенный текст не содержит осмысленных слов или предложений, возможно, это набор случайных клавиш.', '2026-05-27 18:58:04'),
(183, 34, 9, 'correction', '✏️ Исправление: Не удалось определить осмысленный текст', '2026-05-27 18:58:04'),
(184, 34, 10, 'assistant', 'It looks like you might have had a little trouble typing there. Don\'t worry, it happens to the best of us. Let\'s start fresh. How about we talk about something interesting? What do you like to do in your free time? Do you enjoy traveling, trying new foods, or something else?', '2026-05-27 18:58:19'),
(185, 35, 1, 'user', 'hello', '2026-08-25 15:46:13'),
(186, 35, 2, 'assistant', 'Can you tell me more about that?', '2026-08-25 15:46:14'),
(187, 36, 1, 'user', 'hello?', '2026-08-26 15:58:42'),
(188, 36, 2, 'correction', '? Good work!', '2026-08-26 15:58:42'),
(189, 36, 3, 'assistant', 'Can you tell me more about that?', '2026-08-26 15:58:43'),
(190, 36, 4, 'user', 'hii', '2026-08-26 16:05:06'),
(191, 36, 5, 'correction', '? Good work!', '2026-08-26 16:05:06'),
(192, 36, 6, 'assistant', 'I\'m having trouble responding right now. Please try again.', '2026-08-26 16:05:06'),
(193, 36, 7, 'user', 'wow', '2026-08-26 16:24:26'),
(194, 36, 8, 'correction', '? Good work!', '2026-08-26 16:24:40'),
(195, 36, 9, 'assistant', 'I\'m having trouble responding right now. Please try again.', '2026-08-26 16:24:40');

-- --------------------------------------------------------

--
-- Структура таблицы `questions`
--

CREATE TABLE `questions` (
  `id` int NOT NULL,
  `text` text NOT NULL,
  `option_a` varchar(255) NOT NULL,
  `option_b` varchar(255) NOT NULL,
  `option_c` varchar(255) NOT NULL,
  `correct_answer` char(1) NOT NULL,
  `topic` varchar(100) NOT NULL,
  `level` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `questions`
--

INSERT INTO `questions` (`id`, `text`, `option_a`, `option_b`, `option_c`, `correct_answer`, `topic`, `level`) VALUES
(1, 'She ___ to school every day.', 'go', 'goes', 'going', 'B', '', 'A1'),
(2, 'They ___ watching TV right now.', 'is', 'am', 'are', 'C', '', 'A1'),
(3, 'He ___ breakfast at 8 am every morning.', 'have', 'has', 'having', 'B', '', 'A1'),
(4, 'I ___ to music at the moment.', 'listen', 'listens', 'am listening', 'C', '', 'A1'),
(5, 'We usually ___ to the park on Sundays.', 'go', 'goes', 'going', 'A', '', 'A1'),
(6, 'Look! The cat ___ up the tree.', 'climb', 'climbs', 'is climbing', 'C', '', 'A2'),
(7, 'My brother ___ coffee. He prefers tea.', 'doesn\'t drink', 'don\'t drink', 'isn\'t drinking', 'A', '', 'A2'),
(8, 'The children ___ in the garden now.', 'play', 'plays', 'are playing', 'C', '', 'A1'),
(9, 'She ___ French very well.', 'speak', 'speaks', 'is speaking', 'B', '', 'A1'),
(10, 'Why ___ you crying? Is something wrong?', 'do', 'does', 'are', 'C', '', 'A2'),
(11, 'Water ___ at 100 degrees Celsius.', 'boil', 'boils', 'is boiling', 'B', '', 'A2'),
(12, 'He ___ to call you at the moment.', 'try', 'tries', 'is trying', 'C', '', 'A2'),
(13, 'The Earth ___ around the Sun.', 'go', 'goes', 'is going', 'B', '', 'A2'),
(14, 'I ___ to understand this exercise.', 'not understand', 'don\'t understand', 'am not understanding', 'B', '', 'A2'),
(15, 'She always ___ her homework before dinner.', 'do', 'does', 'is doing', 'B', '', 'A2'),
(16, 'I ___ to the cinema yesterday.', 'go', 'went', 'gone', 'B', '', 'A2'),
(17, 'She works in a hospital. She is a ___.', 'teacher', 'doctor', 'lawyer', 'B', '', 'A1'),
(18, 'Could you ___ me the salt, please?', 'pass', 'take', 'bring', 'A', '', 'A2'),
(19, 'I usually ___ up at 7 am.', 'get', 'wake', 'stand', 'B', '', 'A1'),
(20, 'She is very good ___ math.', 'in', 'at', 'on', 'B', '', 'A2'),
(21, 'I need to buy some bread. Let\'s go to the ___.', 'bank', 'bakery', 'library', 'B', '', 'A2'),
(22, 'We ___ the museum last weekend.', 'visit', 'visited', 'have visited', 'B', '', 'A2'),
(23, 'He ___ his keys yesterday. He can\'t find them.', 'lose', 'lost', 'has lost', 'B', '', 'A2'),
(24, 'I ___ him at the party last night.', 'see', 'saw', 'have seen', 'B', '', 'A2'),
(25, 'She ___ here tomorrow morning.', 'arrive', 'arrives', 'will arrive', 'C', '', 'A2'),
(26, 'I think it ___ tomorrow.', 'rain', 'will rain', 'is raining', 'B', '', 'A2'),
(27, 'She is going to ___ a doctor when she grows up.', 'be', 'being', 'is', 'A', '', 'A2'),
(28, 'The train ___ at 8 pm.', 'will leave', 'leaves', 'is leaving', 'B', '', 'B1'),
(29, 'If you heat ice, it ___.', 'melt', 'melts', 'will melt', 'B', '', 'B1'),
(30, 'You ___ see the doctor if you feel unwell.', 'should', 'must', 'have to', 'A', '', 'B1'),
(31, 'She ___ when I called her.', 'sleep', 'slept', 'was sleeping', 'C', '', 'B1'),
(32, 'He ___ his leg while he was playing football.', 'break', 'broke', 'was breaking', 'B', '', 'B1'),
(33, 'I ___ TV when the phone rang.', 'watched', 'was watching', 'had watched', 'B', '', 'B1'),
(34, 'While I ___ for the bus, I saw an accident.', 'waited', 'was waiting', 'had waited', 'B', '', 'B1'),
(35, 'What ___ you doing at 8 pm yesterday?', 'were', 'was', 'did', 'A', '', 'B1'),
(36, 'I\'m sorry, I\'m late. The ___ was terrible.', 'traffic', 'transport', 'travel', 'A', '', 'B1'),
(37, 'He ___ his own business last year.', 'started', 'opened', 'began', 'A', '', 'B1'),
(38, 'Let\'s ___ a break. I\'m tired.', 'do', 'make', 'take', 'C', '', 'B1'),
(39, 'She ___ a lot of money in her new job.', 'wins', 'earns', 'takes', 'B', '', 'B1'),
(40, 'I need to ___ the laundry this evening.', 'make', 'do', 'take', 'B', '', 'B1'),
(41, 'She ___ a promotion last month.', 'got', 'did', 'made', 'A', '', 'B1'),
(42, 'Can you ___ me a favour?', 'make', 'do', 'give', 'B', '', 'B1'),
(43, 'I\'m looking forward ___ the weekend.', 'to', 'for', 'at', 'A', '', 'B1'),
(44, 'The cake ___ by my grandmother.', 'made', 'was made', 'is made', 'B', '', 'B1'),
(45, 'She ___ speak three languages when she was five.', 'can', 'could', 'may', 'B', '', 'B1'),
(46, 'The house ___ built in 1990.', 'is', 'was', 'were', 'B', '', 'B1'),
(47, 'We ___ to the beach if the weather is nice.', 'go', 'will go', 'would go', 'B', '', 'B1'),
(48, 'I ___ you as soon as I arrive.', 'call', 'will call', 'am calling', 'B', '', 'B1'),
(49, 'If it rains, we ___ inside.', 'stay', 'will stay', 'would stay', 'B', '', 'B1'),
(50, 'Unless you hurry, you ___ the bus.', 'miss', 'will miss', 'would miss', 'B', '', 'B1'),
(51, 'She is feeling under the weather. She is ___.', 'happy', 'sick', 'angry', 'B', '', 'B1'),
(52, 'They ___ already ___ dinner when we arrived.', 'has / eaten', 'had / eaten', 'have / eaten', 'B', '', 'B2'),
(53, 'By the time we got to the station, the train ___.', 'left', 'has left', 'had left', 'C', '', 'B2'),
(54, 'They ___ never ___ such a beautiful place before.', 'have / seen', 'had / seen', 'did / see', 'B', '', 'B2'),
(55, 'He is ___ charge of the marketing department.', 'in', 'on', 'at', 'A', '', 'B2'),
(56, 'He ___ out with his friends every Friday.', 'goes', 'hangs', 'comes', 'B', '', 'B2'),
(57, 'By 2030, robots ___ many jobs.', 'replace', 'will replace', 'will have replaced', 'C', '', 'B2'),
(58, 'If I ___ you, I would say sorry.', 'am', 'were', 'was', 'B', '', 'B2'),
(59, 'If I ___ more time, I would travel.', 'have', 'had', 'would have', 'B', '', 'B2'),
(60, 'The letter ___ sent tomorrow.', 'will', 'will be', 'is', 'B', '', 'B2'),
(61, 'You ___ smoke here. It\'s forbidden.', 'mustn\'t', 'don\'t have to', 'couldn\'t', 'A', '', 'B2'),
(62, 'She told me ___ wait for her.', 'to', 'that', 'that I', 'A', '', 'B2'),
(63, 'He ___ be at home. His car is in the driveway.', 'must', 'can\'t', 'might', 'A', '', 'B2'),
(64, 'The documents ___ signed by the manager tomorrow.', 'will be', 'are', 'have been', 'A', '', 'B2'),
(65, 'She said, \"I am tired.\" → She said that she ___ tired.', 'is', 'was', 'were', 'B', '', 'B2'),
(66, 'He asked, \"Where do you live?\" → He asked where I ___.', 'live', 'lived', 'am living', 'B', '', 'B2'),
(67, 'It\'s raining cats and dogs. What does it mean?', 'It\'s raining heavily', 'It\'s raining a little', 'There are animals outside', 'A', '', 'B2'),
(68, 'He broke the ice at the party. He ___.', 'made people feel comfortable', 'broke something', 'left early', 'A', '', 'B2'),
(69, 'Let\'s call it a day. Let\'s ___.', 'start working', 'stop working', 'work harder', 'B', '', 'B2'),
(70, 'I need to cut back on coffee. I need to ___.', 'drink more', 'drink less', 'stop completely', 'B', '', 'B2'),
(71, 'If she had studied, she ___ the exam.', 'would pass', 'would have passed', 'passed', 'B', '', 'C1'),
(72, 'If they ___ earlier, they wouldn\'t have been late.', 'left', 'had left', 'would leave', 'B', '', 'C1'),
(73, 'He spilled the beans about the surprise. He ___.', 'ruined the surprise', 'made a mess', 'cleaned up', 'A', '', 'C1'),
(74, 'She came up with a great idea. She ___.', 'found it', 'invented it', 'rejected it', 'B', '', 'C1'),
(75, 'He looks up to his father. He ___ him.', 'admires', 'ignores', 'obeys', 'A', '', 'C1'),
(76, 'I ran into an old friend yesterday. I ___ him.', 'called', 'met by chance', 'avoided', 'B', '', 'C1'),
(77, 'We need to put off the meeting. We need to ___ it.', 'cancel', 'postpone', 'start', 'B', '', 'C1'),
(78, 'He made a controversial statement. People ___ it.', 'agreed with', 'argued about', 'ignored', 'B', '', 'C1'),
(79, 'The project was a fiasco. It was a ___.', 'success', 'failure', 'mystery', 'B', '', 'C1'),
(80, 'She is very meticulous about her work. She is ___.', 'careless', 'detail-oriented', 'lazy', 'B', '', 'C1'),
(81, 'His speech was eloquent and persuasive. It was ___.', 'boring', 'well-spoken', 'confusing', 'B', '', 'C1'),
(82, 'He suggested ___ to the cinema.', 'go', 'to go', 'going', 'C', '', 'C1'),
(83, 'I regret ___ you that you failed the exam.', 'tell', 'to tell', 'telling', 'B', '', 'C1'),
(84, 'I wish I ___ more time to travel.', 'have', 'had', 'would have', 'B', '', 'C1'),
(85, 'If only she ___ earlier, she wouldn\'t have missed the flight.', 'left', 'had left', 'would leave', 'B', '', 'C1'),
(86, 'She is very ambitious. She wants to ___.', 'relax', 'succeed', 'sleep', 'B', '', 'C2'),
(87, 'She is feeling under the weather. She is ___.', 'happy', 'sick', 'angry', 'B', '', 'C2'),
(88, 'He ___ be at home. His car is in the driveway.', 'must', 'can\'t', 'might', 'A', '', 'C2'),
(89, 'The documents ___ signed by the manager tomorrow.', 'will be', 'are', 'have been', 'A', '', 'C2'),
(90, 'I wish I ___ more time to travel.', 'have', 'had', 'would have', 'B', '', 'C2');

-- --------------------------------------------------------

--
-- Структура таблицы `test_results`
--

CREATE TABLE `test_results` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `test_date` date NOT NULL,
  `attempt_number` int DEFAULT '1',
  `score` int NOT NULL,
  `total_questions` int NOT NULL,
  `percentage` int NOT NULL,
  `level` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `test_results`
--

INSERT INTO `test_results` (`id`, `user_id`, `test_date`, `attempt_number`, `score`, `total_questions`, `percentage`, `level`, `created_at`) VALUES
(12, 4, '2026-05-24', 4, 1, 30, 3, 'A1', '2026-05-24 19:30:35'),
(15, 4, '2026-05-24', 2, 2, 30, 7, 'A1', '2026-05-24 20:17:53'),
(16, 8, '2026-05-24', 1, 26, 30, 87, 'C2', '2026-05-24 20:56:46'),
(17, 4, '2026-05-25', 3, 0, 30, 0, 'A1', '2026-05-25 01:56:14'),
(18, 12, '2026-05-25', 1, 3, 30, 10, 'A1', '2026-05-25 03:32:54'),
(19, 12, '2026-05-25', 2, 0, 30, 0, 'A1', '2026-05-25 03:54:23'),
(20, 12, '2026-05-25', 3, 0, 30, 0, 'A1', '2026-05-25 03:55:26'),
(21, 14, '2026-06-09', 1, 4, 30, 13, 'A1', '2026-06-09 20:01:55');

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `login` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `login`, `password`, `email`) VALUES
(1, 'login', '5f4dcc3b5aa765d61d8327deb882cf99', 'email@mail.ru'),
(2, 'mylogin', '5f4dcc3b5aa765d61d8327deb882cf99', 'myemail'),
(4, 'Julia', '5f4dcc3b5aa765d61d8327deb882cf99', 'email@mail.ru'),
(7, 'dddddddddddddddddddddddddddddddddddddddddddddddddd', '0320116b2af221a6f673f93925b3fc62', 'deeeeeeeeeeee@vbgtjnh.sd'),
(8, 'Lalala', 'c17ed7d7e2d8a60c78c715e165fe3c38', 'juliaandrianova0306@gmail.com'),
(9, 'User', '5f4dcc3b5aa765d61d8327deb882cf99', 'ya@mail.ru'),
(10, 'Juliaa', '5f4dcc3b5aa765d61d8327deb882cf99', 'emaul@mail.ru'),
(11, 'qwerty12345', 'b717415eb5e699e4989ef3e2c4e9cbf7', 'nastasya.ivanova.2707@mail.ru'),
(12, 'aaa', '74b87337454200d4d33f80c4663dc5e5', 'aaa@mai.a'),
(13, 'vika', '5f4dcc3b5aa765d61d8327deb882cf99', 'email@mail.ru');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `cards`
--
ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_set_id` (`set_id`);

--
-- Индексы таблицы `card_sets`
--
ALTER TABLE `card_sets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Индексы таблицы `dialogs`
--
ALTER TABLE `dialogs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Индексы таблицы `dialog_messages`
--
ALTER TABLE `dialog_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dialog_id` (`dialog_id`),
  ADD KEY `idx_dialog_number` (`dialog_id`,`message_number`);

--
-- Индексы таблицы `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `test_results`
--
ALTER TABLE `test_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `cards`
--
ALTER TABLE `cards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT для таблицы `card_sets`
--
ALTER TABLE `card_sets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT для таблицы `dialogs`
--
ALTER TABLE `dialogs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT для таблицы `dialog_messages`
--
ALTER TABLE `dialog_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=196;

--
-- AUTO_INCREMENT для таблицы `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT для таблицы `test_results`
--
ALTER TABLE `test_results`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `cards`
--
ALTER TABLE `cards`
  ADD CONSTRAINT `fk_cards_set_id` FOREIGN KEY (`set_id`) REFERENCES `card_sets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ограничения внешнего ключа таблицы `dialogs`
--
ALTER TABLE `dialogs`
  ADD CONSTRAINT `fk_dialogs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `dialog_messages`
--
ALTER TABLE `dialog_messages`
  ADD CONSTRAINT `fk_dialog_messages_dialog` FOREIGN KEY (`dialog_id`) REFERENCES `dialogs` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
