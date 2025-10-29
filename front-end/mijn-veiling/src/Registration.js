export default function Header() {
  return (
    <header>
      <div className="HoofschermContainer">
        <div className="logoTitel">
          <img
            src="/resources/pictures/webp/floraHolidayLogo.webp"
            alt="Royal Flora Holland logo"
            className="floraLogo"
          />
          <h1>Flora Royal Holland</h1>
        </div>

        <nav>
          <ul>
            <li className="veilingPlaatsen">
              <img
                src="front-end/resources/pictures/webp/Contact2.webp"
                alt="Contact"
                className="ContactPersoonLogo"
              />
              <span>Service en contact</span>
            </li>
            <li className="klantGegevens">
              <img
                src="/resources/pictures/webp/Home.webp"
                alt="home"
                className="HomeButtonLogo"
              />
              <span>Home</span>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
