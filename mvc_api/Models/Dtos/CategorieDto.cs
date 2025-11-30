using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using mvc_api.Models;

namespace mvc_api.Models;

public record CategorieCreateDto(
    [Required, StringLength(200)] string Naam
);

public record CategorieUpdateDto(
    [Required, StringLength(200)] string Naam
);

public sealed record CList(int CategorieNr, string Naam);

public sealed record CDetail(int CategorieNr, string Naam);