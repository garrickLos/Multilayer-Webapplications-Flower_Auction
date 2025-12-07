namespace mvc_api.Models.Dtos;

public record OperationResultDto(bool Success, IReadOnlyList<string> Errors)
{
    public static OperationResultDto Ok() => new(true, Array.Empty<string>());

    public static OperationResultDto Fail(params string[] errors) => new(false, errors);
}
