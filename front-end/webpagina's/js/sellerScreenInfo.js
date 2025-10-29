document.querySelector(".veilingPLaatsen").addEventListener("click", () => {
    window.location.href = "../html/sellerScreenAdd.html";
});
fetch("../../dummydata/sellerScreenInfo.json")
    .then(res => res.json())
    .then(data => {

        const rijen = document.querySelectorAll(".rij");

        rijen.forEach((rij, index) => {
            const product = data[index];

            if(product){
                rij.querySelector(".productNaam").textContent = "Product name: " + product.productName;
                rij.querySelector(".productCategorie").textContent = "Product category: " + product.ProductCategory;
                rij.querySelector(".hoeveelheid").textContent = "Amount: " + product.Amount;
                rij.querySelector(".plaats").textContent = "Place: " + product.Place;
                rij.querySelector(".winst").textContent = "Revnue: " + product.Revenue;
            }
        });
    })
    .catch(error => console.error("Fout bij het laden van json: ", error));

