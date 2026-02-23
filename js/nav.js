/*
Caiden Durham
Date Developed: February 2026
Date Tested: February 2026
mobile SlickNav-style menu.
*/

document.addEventListener('DOMContentLoaded', function () {
    buildSlickNav('#menu > ul', {
        prependTo: '#mobile-menu-container',
        label: 'Menu'
    });
});
