using System.Collections.Generic;

namespace mvc_api.Data;

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize);
