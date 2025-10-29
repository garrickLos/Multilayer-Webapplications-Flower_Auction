function headerItems(itemtext, path){
    document.querySelector(itemtext).addEventListener("click", () => {
        window.location.href = path;
    });    
}
