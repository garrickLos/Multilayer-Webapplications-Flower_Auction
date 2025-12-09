document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form.form");
  const rol = document.getElementById("rol");

  const bedrijf = document.getElementById("bedrijf");
  const kvk = document.getElementById("kvk");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const registratie = {
      rol: rol.value,
      voornaam: document.getElementById("voornaam").value,
      achternaam: document.getElementById("achternaam").value,
      email: document.getElementById("email").value,
      wachtwoord: document.getElementById("wachtwoord").value,
      straat: document.getElementById("straat").value,
      postcode: document.getElementById("postcode").value,
      bedrijf: bedrijf.value,
      kvk: kvk.value,
      btw: document.getElementById("btw").value
    };

    const verplichteVelden = [
      registratie.rol,
      registratie.voornaam,
      registratie.achternaam,
      registratie.email,
      registratie.wachtwoord,
      registratie.straat,
      registratie.postcode,
      registratie.bedrijf,
      registratie.kvk,
      registratie.btw
    ];

    const isVeldLeeg = verplichteVelden.some(v => !v || v === "");
    if (isVeldLeeg) {
      alert("Vul alle verplichte velden in voordat je doorgaat.");
      return;
    }

    alert("U heeft uw account geregistreerd");
    console.log("Registratie:", registratie);
  });
});
