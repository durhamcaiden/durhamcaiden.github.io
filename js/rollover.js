function swapMainGraphic(isHover) {
    var img = document.getElementById('mainGraphic');
    if (!img) return;
    img.src = isHover ? 'images/siu.png' : 'images/siu.png';
}
