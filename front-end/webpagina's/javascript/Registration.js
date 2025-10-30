document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form.form");
  const rol = document.getElementById("rol");
  const bedrijf = document.getElementById("bedrijf");
  const kvk = document.getElementById("kvk");

  // (Optioneel) delen tonen/verbergen
  const kwekerLabel = document.querySelector(".subtle-label");
  const kwekerRow = kwekerLabel ? kwekerLabel.nextElementSibling : null; // de grid-2 met bedrijf/kvk

  function updateKwekerFields() {
    const isKweker = rol.value === "kweker";

    // Alleen verplicht als kweker
    [bedrijf, kvk].forEach(el => {
      el.required = isKweker;
      el.disabled = !isKweker;
      if (!isKweker) { el.value = ""; el.setCustomValidity(""); }
    });

    // (Optioneel) verberg UI bij klant
    if (kwekerLabel && kwekerRow) {
      kwekerLabel.style.display = isKweker ? "" : "none";
      kwekerRow.style.display = isKweker ? "" : "none";
    }
  }

  rol.addEventListener("change", updateKwekerFields);
  updateKwekerFields();

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
      kvk: kvk.value
    };

    const verplichteVelden = [
      registratie.rol,
      registratie.voornaam,
      registratie.achternaam,
      registratie.email,
      registratie.wachtwoord,
      registratie.straat,
      registratie.postcode,
      ...(registratie.rol === "kweker" ? [registratie.bedrijf, registratie.kvk] : [])
    ];

    const isVeldLeeg = verplichteVelden.some(v => !v || v === "");
    if (isVeldLeeg) {
      alert("Vul alle verplichte velden in voordat je doorgaat.");
      return;
    }

    alert("U heeft uw account geregistreerd");
    updateKwekerFields();
    console.log("Registratie:", registratie);
      });
});
