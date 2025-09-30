const modal = document.getElementById('modal');
const btn = document.getElementById('login');
const btn1 = document.getElementById('cerrar');
btn.addEventListener('click', () => {
    modal.style.display = "flex";
});
btn1.addEventListener('click', () => {
    modal.style.display = "none";
});