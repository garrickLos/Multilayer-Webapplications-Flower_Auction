document.querySelector(".btn-primary").addEventListener("click", async () => {
    const login = {
        email: document.getElementById("email").value,
        wachtwoord: document.getElementById("wachtwoord").value,
    };

    const verplichteVelden =
        [
                    login.email,
                    login.wachtwoord,
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
        alert("U bent ingelogd")
        verplichteVelden.forEach(element => {
            console.log(element);
        })
    }
})

