namespace mvc_api.statusPrinter;

public class NormalizeStatus
{
    public string StatusPrinter(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return VeilingStatus.Inactive;

        return status.Trim().ToLowerInvariant() switch
        {
            VeilingStatus.Active => VeilingStatus.Active,
            VeilingStatus.Sold => VeilingStatus.Sold,
            _ => VeilingStatus.Inactive
        };
    }
}

/* 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjQiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJtYXJpb0BnbWFpbC5jb20iLCJzdWIiOiI0IiwianRpIjoiMTQzNjk3ZTQtZmY1NS00NjEwLTkyMmQtMzg1OTMwNjBhNDlmIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiVmVpbGluZ01lZXN0ZXIiLCJleHAiOjE3NjQzMzYzMjAsImlzcyI6InlvdXJhcHAiLCJhdWQiOiJ5b3VyYXBwIn0.p46Faifctl9oZOXif3BN65OGnKW0ilXVUGxvpHK6MRg

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjQiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJtYXJpb0BnbWFpbC5jb20iLCJzdWIiOiI0IiwianRpIjoiMjY1MzhlMDgtZWMzYS00NjUyLTlhYjAtMTk4Y2RiOTgwYWExIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiS2xhbnQiLCJleHAiOjE3NjQzMzY0MjUsImlzcyI6InlvdXJhcHAiLCJhdWQiOiJ5b3VyYXBwIn0.9LkoVtFYLODUHGVHH-QahdIi4FccRo8XgJnewnEK0Og
*/