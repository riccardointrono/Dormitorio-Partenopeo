function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const toggle = document.querySelector('.menu-toggle');
    menu.classList.toggle('open');
    toggle.classList.toggle('open');
}