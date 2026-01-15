/// <summary>
/// Algemene status voor database records (soft state).
/// Wordt gebruikt om items te activeren/deactiveren of “soft delete” toe te passen.
/// </summary>
public enum ModelStatus
{
    /// <summary>Record is actief en mag gebruikt/zichtbaar zijn.</summary>
    Active,

    /// <summary>Record bestaat nog, maar is niet actief (tijdelijk uitgeschakeld).</summary>
    Inactive,

    /// <summary>Record is “soft deleted” en hoort niet meer zichtbaar te zijn.</summary>
    Deleted,
}