// navigation.js - единая навигация для всех страниц
function initGlobalNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');

      const routes = {
        'cards': 'dashboard.html',
        'dialogs': 'dialog1.html',
        'testing': 'testing.html',
        'journal': 'journal.html',
	'settings': 'settings.html'	
      };

      if (routes[view]) {
        window.location.href = routes[view];
      } else if (view === 'settings') {
        alert('⚙️ Настройки в разработке');
      }
    });
  });
}

// Вызывать на каждой странице после загрузки DOM
document.addEventListener('DOMContentLoaded', initGlobalNavigation);