document.querySelectorAll('.expandable-list li').forEach(item => {
    item.addEventListener('click', () => {
        console.log("click")
        // Toggle the "active" class on the clicked item
        item.classList.toggle('active');

        // Toggle the visibility of the extra information
        const extraInfo = item.querySelector('.more-info');
        if (extraInfo.style.display === 'block') {
            extraInfo.style.display = 'none';
        } else {
            extraInfo.style.display = 'block';
        }
    });
});