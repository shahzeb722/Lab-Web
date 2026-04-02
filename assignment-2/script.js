// Assignment 2 — Responsive Hamburger Menu (Vanilla JS only)

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

// Toggle menu open/close on hamburger click
hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
});

// Bonus: close menu when any nav link is clicked
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(function (item) {
    item.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
    });
});
