fetch("../../dummydata/customerScreen.json")
    .then(res => res.json())
    .then(data => {
        console.log("data uit json", data);
        const product = data[0];
        const veiling = data[1];
        
        document.querySelector(".username").textContent = "Product naam: " + product.productName;
        document.querySelector(".productCategorie").textContent = "Product categorie: " + product.ProductCategory;
        document.querySelector(".hoeveelheid").textContent = "Aantal: " + product.Amount;
        document.querySelector(".Place").textContent = "Plaats: " + product.Place;

        document.querySelector(".klok").textContent = veiling.time;
        document.querySelector(".huidigePrijs").textContent = "Prijs: " + veiling.price;
        document.querySelector(".tekstVoorKopen").textContent = "Je koopt " + veiling.Aantal + " artikelen voor $" + veiling.price + " per stuk, in totaal $" + (veiling.price * veiling.Aantal);
        
        let [hours, minutes, secondes] = veiling.time.split(":").map(Number);
        let totalSeconds = hours * 3600 + minutes * 60 + secondes;
        
        function updateClock(){
            if (totalSeconds > 0) {
                totalSeconds --;
                
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;
                
                const format =
                    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                
                document.querySelector(".klok").textContent = format;
            } else {
                clearInterval(timer);
                document.querySelector(".klok").textContent = "afgelopen";
            }
        }
        
        const timer = setInterval(updateClock, 1000);

        
        document.querySelector(".koopNu").addEventListener("click", async () => {
            const product = {
                aantal: document.getElementById("aantalkopenstuks").value,
            };

            const verplichteVelden =
                [
                    product.aantal
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


    })
    .catch(error => console.error("Fout bij het laden van json: ", error));


