export interface VeilingproductUpdate {
    // string | null zorgt dat je eventueel wel null mag sturen als dat ooit nodig is
    Naam?: string | null;
    GeplaatstDatum?: Date | null;
    VoorraadBloemen: number;
    AantalFusten: number;
    CategorieNr?: number | null;
    ImagePath?: string | null;
    Minimumprijs?: number | null;
    Plaats?: string | null;
}

export interface VeilingTijdUpdate {
    GeupdateBeginTijd: string
}