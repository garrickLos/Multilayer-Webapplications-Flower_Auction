public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; }
    public int GebruikerNr { get; set; }
    public string Email { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsRevoked { get; set; }
}