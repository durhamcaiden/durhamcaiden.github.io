/*
Name: Caiden Durham
Course: Lab 3 - Responsiveness & SlickNav
File: nav.js
Date Developed: February 2026
Date Tested: February 2026
Description: Initialize mobile SlickNav-style menu.
*/

document.addEventListener('DOMContentLoaded', function () {
    buildSlickNav('#menu > ul', {
        prependTo: '#mobile-menu-container',
        label: 'Menu'
    });
});
