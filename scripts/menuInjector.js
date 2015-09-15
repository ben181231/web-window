(function() {
    var body = document.body,
        menu = document.createElement('div'),
        leftBtn = document.createElement('div'),
        topLeftBtn = document.createElement('div'),
        topBtn = document.createElement('div'),
        remote = require ? require('remote') : undefined;

        menu.classList.add('web-window-menu');

        leftBtn.classList.add('web-window-menu-item');
        leftBtn.classList.add('left');
        leftBtn.addEventListener('click', function() {
            window.history.back();
        });
        menu.appendChild(leftBtn);

        topLeftBtn.classList.add('web-window-menu-item');
        topLeftBtn.classList.add('top-left');
        topLeftBtn.addEventListener('click', function() {
            if (remote) {
                remote.getCurrentWindow().webContents.emit('request-home');
            }
        });
        menu.appendChild(topLeftBtn);

        topBtn.classList.add('web-window-menu-item');
        topBtn.classList.add('top');
        topBtn.addEventListener('click', function() {
            window.location.reload();
        });
        menu.appendChild(topBtn);

        body.appendChild(menu);
})();
