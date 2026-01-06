document.querySelector(".placeProduct").addEventListener("click", async () => {
    const product = {
        name: document.getElementById("username").value,
        category: document.getElementById("productcategory").value,
        amount: document.getElementById("productamount").value,
        place: document.getElementById("productplace").value,
        minimumPrice: document.getElementById("minimumPriceProduct").value,
        startPrice: document.getElementById("startPrice").value,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value
    };
    
    const verplichteVelden = 
        [
            product.name, product.category, product.amount, product.place, product.minimumPrice, product.startPrice, product.startDate, product.endDate
        ]
    
     let isVeldLeeg = false;
    
    verplichteVelden.forEach(element => {
        if(!element || element.trim() == "") {
            isVeldLeeg = true;
        }
    });
    
    if(isVeldLeeg) {
        alert("Een of meer velden zijn leeg!")
    } else {
        alert("Product is succesvol opgeslagen")
        verplichteVelden.forEach(element => {
            console.log(element);
        })
    }
})

