function swapMainGraphic(isHover) {
    var img = document.getElementById('mainGraphic');
    if (!img) return;
    img.src = isHover ? 'images/image.png' : 'images/profile.jpg';
}
