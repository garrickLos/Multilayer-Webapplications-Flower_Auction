document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('.item-header');
    
    const allGegevensItems = document.querySelectorAll('.gegevens');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            
            const clickedItem = header.closest('.gegevens'); 

            const wasOpen = clickedItem.classList.contains('open');

            allGegevensItems.forEach(item => {
                item.classList.remove('open');
                item.classList.add('closed');
            });

            if (!wasOpen) {
                clickedItem.classList.remove('closed');
                clickedItem.classList.add('open');
            }
        });
    });
});