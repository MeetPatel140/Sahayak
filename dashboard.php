<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

include 'config/db_connect.php';

$active_mode = $_SESSION['active_mode'] ?? 'customer';

// Get user info
$stmt = $conn->prepare("SELECT full_name, user_type, wallet_balance FROM users WHERE user_id = ?");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#00796B">
    <title>Sahay</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="overflow-hidden">
    <div id="location-alert" class="hidden fixed top-0 left-0 right-0 bg-orange-500 text-white p-2 text-center z-50 text-sm">
        <i class="fas fa-location-arrow mr-1"></i>Enable location for better experience
        <button onclick="checkLocationPermission()" class="ml-2 underline font-medium">Enable</button>
    </div>
    
    <!-- Full Screen Map -->
    <div id="map" class="absolute inset-0 z-0"></div>
    
    <!-- Top Header Bar -->
    <div class="fixed top-0 left-0 right-0 z-40 p-4">
        <div class="max-w-md mx-auto flex items-center justify-between">
            <button onclick="document.getElementById('menu').classList.toggle('hidden')" class="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                <i class="fas fa-bars text-gray-700"></i>
            </button>
            <div class="flex items-center space-x-3">
                <button class="px-4 py-2 bg-white rounded-full shadow-lg text-sm font-medium text-gray-700">
                    <?php echo ($active_mode === 'helper') ? 'HELP' : 'SEEK'; ?>
                </button>
                <div class="px-4 py-2 bg-teal-600 text-white rounded-full shadow-lg text-sm font-bold">
                    ₹<?php echo number_format($user['wallet_balance'], 0); ?>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Side Menu -->
    <div id="menu" class="hidden fixed top-0 left-0 w-64 h-full bg-white shadow-2xl z-50 p-6">
        <button onclick="document.getElementById('menu').classList.add('hidden')" class="absolute top-4 right-4 text-gray-500">
            <i class="fas fa-times text-xl"></i>
        </button>
        <div class="mt-8">
            <p class="text-sm text-gray-500 mb-1">Welcome</p>
            <p class="font-bold text-lg mb-6"><?php echo htmlspecialchars($user['full_name']); ?></p>
            <a href="api/logout.php" class="text-red-500 text-sm flex items-center">
                <i class="fas fa-sign-out-alt mr-2"></i>Logout
            </a>
        </div>
    </div>
        
    <?php if ($user['user_type'] === 'helper'): ?>
    <div class="fixed top-20 left-0 right-0 z-30 px-4">
        <div class="max-w-md mx-auto bg-gradient-to-r from-teal-600 to-teal-700 p-3 rounded-full shadow-xl text-white flex items-center justify-between">
            <span class="text-sm font-medium ml-2"><?php echo ($active_mode === 'helper') ? 'LIVE' : 'SEEK'; ?></span>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="mode-toggle" onchange="toggleMode(this.checked)" 
                    <?php echo ($active_mode === 'helper') ? 'checked' : ''; ?> class="sr-only peer">
                <div class="w-12 h-7 bg-white/30 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
            </label>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($active_mode === 'customer'): ?>
    <div id="customer-view" class="relative z-10">
        <!-- Floating Input Card -->
        <div class="fixed bottom-0 left-0 right-0 z-30 p-4">
            <div class="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-6">
                <h2 class="text-2xl font-bold text-center mb-2 text-gray-900">What help do you need?</h2>
                <p class="text-center text-gray-400 text-sm mb-6">"Bol kar madad maange"</p>
                
                <form id="taskForm" onsubmit="postTask(event)">
                    <div class="flex justify-center mb-6">
                        <button type="button" onclick="startListening()" 
                            class="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform">
                            <i class="fas fa-microphone text-3xl"></i>
                        </button>
                    </div>
                    <span id="status-text" class="block text-center text-sm text-gray-500 mb-4"></span>
                    
                    <textarea id="task_input" name="description" placeholder="Type your need here..." 
                             class="w-full p-4 border-2 border-gray-100 rounded-2xl mb-4 text-sm focus:border-teal-500 focus:outline-none" rows="2" required></textarea>
                    
                    <div class="flex gap-3">
                        <input type="number" name="budget" placeholder="Budget ₹" 
                               class="flex-1 p-4 border-2 border-gray-100 rounded-2xl text-sm focus:border-teal-500 focus:outline-none" required>
                        <button type="submit" class="bg-teal-600 text-white px-8 py-4 rounded-2xl hover:bg-teal-700 transition-colors font-medium">
                            Find
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Helpers List (Slide up panel) -->
        <div id="helpers-panel" class="hidden fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl max-h-96 overflow-y-auto">
            <div class="max-w-md mx-auto p-6">
                <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <div id="helpers-list"></div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($active_mode === 'helper'): ?>
    <div id="helper-view" class="relative z-10">
        <!-- Live Status Card -->
        <div class="fixed top-32 left-0 right-0 z-30 px-4">
            <div class="max-w-md mx-auto bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-3xl shadow-2xl text-white text-center">
                <div class="flex items-center justify-center mb-2">
                    <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    <span class="font-bold text-lg">You are LIVE</span>
                </div>
                <p class="text-sm opacity-90">Customers can see you</p>
            </div>
        </div>
        
        <!-- Tasks List -->
        <div class="fixed bottom-0 left-0 right-0 z-30 p-4">
            <div class="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-6 max-h-96 overflow-y-auto">
                <h3 class="font-bold mb-4 text-gray-900 flex items-center">
                    <i class="fas fa-tasks text-orange-500 mr-2"></i>Available Tasks
                </h3>
                <div id="tasks-list">
                    <div class="text-gray-400 text-center py-8">
                        <i class="fas fa-search text-4xl mb-3 opacity-30"></i>
                        <div class="text-sm">Looking for tasks...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- My Tasks Panel (Hidden by default) -->
    <div id="my-tasks-panel" class="hidden fixed inset-0 bg-black/50 z-50" onclick="this.classList.add('hidden')">
        <div class="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-96 overflow-y-auto" onclick="event.stopPropagation()">
            <div class="max-w-md mx-auto p-6">
                <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 class="font-bold mb-4 text-gray-900"><i class="fas fa-history text-gray-400 mr-2"></i>My Tasks</h3>
                <div id="my-tasks-list"></div>
            </div>
        </div>
    </div>

    <script src="assets/js/map_logic.js"></script>
    <script src="assets/js/voice_logic.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>