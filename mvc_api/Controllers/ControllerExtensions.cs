using Microsoft.AspNetCore.Mvc;

namespace mvc_api.Controllers;

internal static class ControllerExtensions
{
    public static ProblemDetails CreateProblemDetails(this ControllerBase controller, string title, string? detail = null, int statusCode = 400) =>
        new()
        {
            Title = title,
            Detail = detail,
            Status = statusCode,
            Instance = controller.HttpContext?.Request?.Path
        };

    public static void SetPaginationHeaders(this ControllerBase controller, int total, int page, int pageSize)
    {
        controller.Response.Headers["X-Total-Count"] = total.ToString();
        controller.Response.Headers["X-Page"] = page.ToString();
        controller.Response.Headers["X-Page-Size"] = pageSize.ToString();
    }
}
